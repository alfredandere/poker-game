import {
  createInitialState,
  getValidActions,
  performAction,
  getMinRaiseAmount,
  isHandComplete,
  dealBoard,
  getCallAmount,
  getActivePlayerCount,
} from "../../lib/poker-engine";

describe("Poker Engine", () => {
  const initialStacks = [1000, 1000, 1000, 1000, 1000, 1000];

  describe("createInitialState", () => {
    it("should create initial game state with correct structure", () => {
      const state = createInitialState(initialStacks);

      expect(state.players).toHaveLength(6);
      expect(state.stage).toBe("preflop");
      expect(state.pot).toBe(60); // SB 20 + BB 40
      expect(state.currentBet).toBe(40); // Big blind amount
      expect(state.bigBlindSize).toBe(40);
      expect(state.boardCards).toHaveLength(0);
      expect(state.remainingDeck).toHaveLength(52 - 12); // 52 cards - 12 hole cards
    });

    it("should assign correct positions", () => {
      const state = createInitialState(initialStacks);

      expect(state.players[0].isDealer).toBe(true);
      expect(state.players[1].isSmallBlind).toBe(true);
      expect(state.players[2].isBigBlind).toBe(true);
    });

    it("should post blinds correctly", () => {
      const state = createInitialState(initialStacks);

      expect(state.players[1].bet).toBe(20); // Small blind
      expect(state.players[1].stack).toBe(980);
      expect(state.players[2].bet).toBe(40); // Big blind
      expect(state.players[2].stack).toBe(960);
    });

    it("should throw error for incorrect player count", () => {
      expect(() => createInitialState([1000, 1000])).toThrow(
        "Must have exactly 6 players"
      );
    });
  });

  describe("getValidActions", () => {
    it("should return correct actions for first preflop player", () => {
      const state = createInitialState(initialStacks);
      const validActions = getValidActions(state);

      expect(validActions.has("fold")).toBe(true);
      expect(validActions.has("call")).toBe(true);
      expect(validActions.has("raise")).toBe(true);
      expect(validActions.has("allin")).toBe(true);
      expect(validActions.has("check")).toBe(false); // Cannot check when facing bet
      expect(validActions.has("bet")).toBe(false); // Cannot bet when facing bet
    });

    it("should return check when no bet to call", () => {
      const state = createInitialState(initialStacks);

      // For check to be valid: currentBet must equal player's current bet
      const checkState = JSON.parse(JSON.stringify(state));
      checkState.currentBet = 0;
      // Make sure the current player's bet matches the currentBet
      checkState.players[checkState.currentPlayer].bet = 0;

      const validActions = getValidActions(checkState);
      expect(validActions.has("check")).toBe(true);
      expect(validActions.has("call")).toBe(false);
    });

    it("should return empty set for folded player", () => {
      const state = createInitialState(initialStacks);
      state.players[state.currentPlayer].folded = true;

      const validActions = getValidActions(state);
      expect(validActions.size).toBe(0);
    });
  });

  describe("performAction", () => {
    describe("fold", () => {
      it("should fold player correctly", () => {
        const state = createInitialState(initialStacks);
        const currentPlayer = state.currentPlayer;

        const newState = performAction(state, "fold");

        expect(newState.players[currentPlayer].folded).toBe(true);
        expect(
          newState.actionLog.some((log) =>
            log.includes(`Player ${currentPlayer} folds`)
          )
        ).toBe(true);
      });
    });

    describe("call", () => {
      it("should call correctly", () => {
        const state = createInitialState(initialStacks);
        const currentPlayer = state.currentPlayer;
        const initialStack = state.players[currentPlayer].stack;
        const callAmount = state.currentBet - state.players[currentPlayer].bet;

        const newState = performAction(state, "call");

        expect(newState.players[currentPlayer].bet).toBe(state.currentBet);
        expect(newState.players[currentPlayer].stack).toBe(
          initialStack - callAmount
        );
        expect(
          newState.actionLog.some((log) =>
            log.includes(`Player ${currentPlayer} calls`)
          )
        ).toBe(true);
      });

      it("should handle all-in call", () => {
        const shortStack = [1000, 1000, 1000, 1000, 1000, 30]; // Player 5 has only 30
        const state = createInitialState(shortStack);
        state.currentPlayer = 5;

        const newState = performAction(state, "call");

        expect(newState.players[5].stack).toBe(0);
        expect(newState.players[5].bet).toBe(30);
      });
    });

    describe("raise", () => {
      it("should raise correctly", () => {
        const state = createInitialState(initialStacks);
        const currentPlayer = state.currentPlayer;
        const raiseTo = 120;

        const newState = performAction(state, "raise", raiseTo);

        expect(newState.players[currentPlayer].bet).toBe(raiseTo);
        expect(newState.currentBet).toBe(raiseTo);

        const expectedMinRaise = raiseTo - state.currentBet; // 120 - 40 = 80
        expect(newState.minRaise).toBe(expectedMinRaise);

        expect(
          newState.actionLog.some((log) =>
            log.includes(`Player ${currentPlayer} raises to ${raiseTo}`)
          )
        ).toBe(true);
      });

      it("should auto-correct to minimum raise", () => {
        const state = createInitialState(initialStacks);
        const currentPlayer = state.currentPlayer;
        const minRaiseTo = getMinRaiseAmount(state); // This should be 80

        const newState = performAction(state, "raise", 10); // Too small

        expect(newState.players[currentPlayer].bet).toBe(minRaiseTo);
        expect(newState.minRaise).toBe(minRaiseTo - state.currentBet); // 80 - 40 = 40
      });
    });

    describe("allin", () => {
      it("should go all-in correctly", () => {
        const state = createInitialState(initialStacks);
        const currentPlayer = state.currentPlayer;
        const playerStack = state.players[currentPlayer].stack;

        const newState = performAction(state, "allin");

        expect(newState.players[currentPlayer].stack).toBe(0);
        expect(newState.players[currentPlayer].bet).toBe(playerStack);
        expect(
          newState.actionLog.some((log) =>
            log.includes(
              `Player ${currentPlayer} goes all-in for ${playerStack}`
            )
          )
        ).toBe(true);
      });
    });
  });

  describe("betting round progression", () => {
    it("should advance to flop after preflop completes", () => {
      let state = createInitialState(initialStacks);

      // Complete preflop round (simplified - all call)
      for (let i = 0; i < 6; i++) {
        if (
          state.stage === "preflop" &&
          !state.players[state.currentPlayer].folded
        ) {
          state = performAction(state, "call");
        }
      }

      expect(state.stage).toBe("flop");
    });

    it("should end hand when only one player remains", () => {
      let state = createInitialState(initialStacks);

      // First 5 players fold
      for (let i = 0; i < 5; i++) {
        if (!state.players[state.currentPlayer].folded) {
          state = performAction(state, "fold");
        }
      }

      expect(state.stage).toBe("showdown");
      expect(isHandComplete(state)).toBe(true);
    });
  });

  describe("dealBoard", () => {
    it("should deal flop correctly", () => {
      const state = createInitialState(initialStacks);
      state.stage = "flop";

      const newState = dealBoard(state);

      expect(newState.boardCards).toHaveLength(3);
      expect(
        newState.actionLog.some((log) => log.includes("*** FLOP ***"))
      ).toBe(true);
    });

    it("should deal turn correctly", () => {
      const state = createInitialState(initialStacks);
      state.stage = "turn";
      state.boardCards = ["Ah", "Kh", "Qh"]; // Mock flop

      const newState = dealBoard(state);

      expect(newState.boardCards).toHaveLength(4);
      expect(
        newState.actionLog.some((log) => log.includes("*** TURN ***"))
      ).toBe(true);
    });

    it("should deal river correctly", () => {
      const state = createInitialState(initialStacks);
      state.stage = "river";
      state.boardCards = ["Ah", "Kh", "Qh", "Jh"]; // Mock flop + turn

      const newState = dealBoard(state);

      expect(newState.boardCards).toHaveLength(5);
      expect(
        newState.actionLog.some((log) => log.includes("*** RIVER ***"))
      ).toBe(true);
    });
  });

  describe("utility functions", () => {
    it("getMinRaiseAmount should work correctly", () => {
      const state = createInitialState(initialStacks);

      expect(getMinRaiseAmount(state)).toBe(80); // currentBet (40) + minRaise (40)

      // Test when no current bet
      state.currentBet = 0;
      expect(getMinRaiseAmount(state)).toBe(40); // big blind size
    });

    it("getCallAmount should work correctly", () => {
      const state = createInitialState(initialStacks);
      const currentPlayer = state.currentPlayer;

      expect(getCallAmount(state)).toBe(40); // BB amount to call

      // Test all-in scenario
      state.players[currentPlayer].stack = 20;
      expect(getCallAmount(state)).toBe(20);
    });

    it("getActivePlayerCount should work correctly", () => {
      const state = createInitialState(initialStacks);

      expect(getActivePlayerCount(state)).toBe(6);

      state.players[0].folded = true;
      state.players[1].stack = 0;

      expect(getActivePlayerCount(state)).toBe(4);
    });
  });

  describe("edge cases", () => {
    it("should handle all players all-in", () => {
      const shortStacks = [50, 50, 50, 50, 50, 50];
      let state = createInitialState(shortStacks);

      // All players go all-in
      while (state.stage !== "showdown" && getActivePlayerCount(state) > 1) {
        const validActions = getValidActions(state);
        if (validActions.has("allin")) {
          state = performAction(state, "allin");
        } else if (validActions.has("call")) {
          state = performAction(state, "call");
        } else {
          break;
        }
      }

      expect(state.stage).toBe("showdown");
    });

    it("should prevent invalid actions", () => {
      const state = createInitialState(initialStacks);

      // Try to check when facing bet
      expect(() => performAction(state, "check")).toThrow(
        "Cannot check when there is a bet to call"
      );

      // Try to bet when facing bet
      expect(() => performAction(state, "bet")).toThrow(
        "Cannot bet when there is already a bet"
      );
    });
  });
});
