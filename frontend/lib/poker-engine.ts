import { HandRank, evaluateHand, compareHands } from "./hand-evaluator";
import { getRandomNames } from "./poker/player-names";

export type GameStage = "preflop" | "flop" | "turn" | "river" | "showdown";
export type PlayerAction =
  | "fold"
  | "check"
  | "call"
  | "bet"
  | "raise"
  | "allin";

export interface Player {
  position: number;
  name: string;
  isYou: boolean;
  stack: number;
  bet: number;
  folded: boolean;
  holeCards: string;
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
}

export interface GameState {
  players: Player[];
  stage: GameStage;
  pot: number;
  currentBet: number;
  currentPlayer: number;
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  boardCards: string[];
  actionLog: string[];
  actionSequence: string[];
  minRaise: number;
  bigBlindSize: number;
  remainingDeck: string[];
  initialStacks: number[];
}

const SUITS = ["h", "d", "c", "s"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

function shuffleDeck(): string[] {
  const deck: string[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push(rank + suit);
    }
  }

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function createInitialState(stacks: number[]): GameState {
  if (stacks.length !== 6) {
    throw new Error("Must have exactly 6 players");
  }

  const bigBlindSize = 40;
  const smallBlindSize = 20;
  const dealerPosition = 0;
  const smallBlindPosition = 1;
  const bigBlindPosition = 2;

  const deck = shuffleDeck();

  const playerNames = getRandomNames(stacks.length);

  const players: Player[] = stacks.map((stack, index) => ({
    position: index,
    name: playerNames[index].name,
    isYou: playerNames[index].isYou,
    stack,
    bet: 0,
    folded: false,
    holeCards: deck[index * 2] + deck[index * 2 + 1],
    isDealer: index === dealerPosition,
    isSmallBlind: index === smallBlindPosition,
    isBigBlind: index === bigBlindPosition,
  }));

  // Post blinds
  players[smallBlindPosition].bet = smallBlindSize;
  players[smallBlindPosition].stack -= smallBlindSize;
  players[bigBlindPosition].bet = bigBlindSize;
  players[bigBlindPosition].stack -= bigBlindSize;

  const remainingDeck = deck.slice(12);

  return {
    players,
    stage: "preflop",
    pot: smallBlindSize + bigBlindSize,
    currentBet: bigBlindSize,
    currentPlayer: (bigBlindPosition + 1) % 6,
    dealerPosition,
    smallBlindPosition,
    bigBlindPosition,
    boardCards: [],
    actionLog: [
      "6-Max Texas Hold'em Hand Started",
      `Dealer: ${players[dealerPosition].name}`,
      `Small Blind: ${players[smallBlindPosition].name} posts ${smallBlindSize}`,
      `Big Blind: ${players[bigBlindPosition].name} posts ${bigBlindSize}`,
    ],
    actionSequence: [],
    minRaise: bigBlindSize,
    bigBlindSize,
    remainingDeck,
    initialStacks: [...stacks],
  };
}

export function getValidActions(state: GameState): Set<PlayerAction> {
  const player = state.players[state.currentPlayer];

  // Player cannot act if folded or has no chips
  if (player.folded || player.stack <= 0) {
    return new Set();
  }

  const actions = new Set<PlayerAction>();
  const callAmount = state.currentBet - player.bet;
  const canCheck = callAmount === 0;

  // Always can fold
  actions.add("fold");

  // Check or call
  if (canCheck) {
    actions.add("check");
  } else {
    actions.add("call");
  }

  // Betting logic
  if (state.currentBet === 0) {
    // Can bet if no current bet and has at least big blind
    if (player.stack >= state.bigBlindSize) {
      actions.add("bet");
    }
  } else {
    // Can raise if can meet minimum raise
    const minRaiseTo = getMinRaiseAmount(state);
    if (player.stack + player.bet >= minRaiseTo) {
      actions.add("raise");
    }
  }

  // All-in if has chips
  if (player.stack > 0) {
    actions.add("allin");
  }

  return actions;
}

function collectBets(state: GameState): void {
  let potTotal = state.pot;
  for (const player of state.players) {
    potTotal += player.bet;
    player.bet = 0;
  }
  state.pot = potTotal;
  state.currentBet = 0;
}

function findNextPlayer(state: GameState, start: number): number {
  for (let i = 1; i <= 6; i++) {
    const nextPos = (start + i) % 6;
    const player = state.players[nextPos];
    if (!player.folded && player.stack > 0) {
      return nextPos;
    }
  }
  // If no active players found (shouldn't happen), return start
  return start;
}

function shouldAdvanceStage(state: GameState): boolean {
  const activePlayers = state.players.filter((p) => !p.folded && p.stack > 0);

  // Hand over if only one player remains
  if (activePlayers.length <= 1) {
    return true;
  }

  // Check if all active players have matched the bet or are all-in
  const maxBet = Math.max(...state.players.map((p) => p.bet));
  const allActionsComplete = state.players.every((player) => {
    if (player.folded) return true;
    if (player.stack === 0) return true; // All-in players
    return player.bet === maxBet; // Has matched current bet
  });

  return allActionsComplete;
}

function advanceStage(state: GameState): void {
  collectBets(state);

  const stages: GameStage[] = ["preflop", "flop", "turn", "river", "showdown"];
  const currentIndex = stages.indexOf(state.stage);

  if (currentIndex < stages.length - 1) {
    state.stage = stages[currentIndex + 1];
    state.currentBet = 0;
    state.minRaise = state.bigBlindSize;
    state.currentPlayer = findNextPlayer(state, state.dealerPosition);
  }
}

export function performAction(
  state: GameState,
  action: PlayerAction,
  amount?: number
): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const player = newState.players[newState.currentPlayer];

  let logMessage = "";
  let shortAction = "";

  // Validate player can act
  if (player.folded) {
    throw new Error("Player is folded and cannot act");
  }
  if (player.stack <= 0) {
    throw new Error("Player has no chips and cannot act");
  }

  switch (action) {
    case "fold":
      player.folded = true;
      logMessage = `${player.name} folds`;
      shortAction = "f";
      break;

    case "check":
      if (newState.currentBet - player.bet > 0) {
        throw new Error("Cannot check when there is a bet to call");
      }
      logMessage = `${player.name} checks`;
      shortAction = "x";
      break;

    case "call": {
      const callAmount = newState.currentBet - player.bet;
      if (callAmount <= 0) {
        throw new Error("Cannot call when no bet is present");
      }
      const actualCall = Math.min(callAmount, player.stack);
      player.bet += actualCall;
      player.stack -= actualCall;
      logMessage = `${player.name} calls ${actualCall}`;
      shortAction = "c";
      break;
    }

    case "bet":
      if (newState.currentBet > 0) {
        throw new Error("Cannot bet when there is already a bet");
      }
      if (!amount || amount < newState.bigBlindSize) {
        amount = newState.bigBlindSize; // Auto-correct to minimum bet
      }
      if (amount > player.stack) {
        amount = player.stack; // All-in
      }

      player.bet += amount;
      player.stack -= amount;
      newState.currentBet = amount;
      newState.minRaise = amount;
      logMessage = `${player.name} bets ${amount}`;
      shortAction = `b${amount}`;
      break;

    case "raise":
      if (newState.currentBet === 0) {
        throw new Error("Cannot raise when no bet is present");
      }

      const minRaiseTo = getMinRaiseAmount(newState);
      if (!amount || amount < minRaiseTo) {
        amount = minRaiseTo; // Auto-correct to minimum raise
      }

      const maxPossible = player.bet + player.stack;
      if (amount > maxPossible) {
        amount = maxPossible; // All-in
      }

      const raiseAmount = amount - player.bet;
      player.bet = amount;
      player.stack -= raiseAmount;
      newState.currentBet = amount;
      newState.minRaise = amount - state.currentBet; 
      logMessage = `${player.name} raises to ${amount}`;
      shortAction = `r${amount}`;
      break;

    case "allin":
      const chipsCommitted = player.stack;
      player.bet += player.stack;
      player.stack = 0;

      if (player.bet > newState.currentBet) {
        newState.currentBet = player.bet;
      }

      logMessage = `${player.name} goes all-in for ${chipsCommitted}`;
      shortAction = "allin";
      break;

    default:
      throw new Error(`Unknown action: ${action}`);
  }

  newState.actionLog.push(logMessage);
  newState.actionSequence.push(shortAction);

  // Check if hand should end
  const activePlayers = newState.players.filter(
    (p) => !p.folded && p.stack > 0
  );
  if (activePlayers.length <= 1) {
    newState.stage = "showdown";
    return newState;
  }

  // Advance to next player or next betting round
  if (shouldAdvanceStage(newState)) {
    advanceStage(newState);
  } else {
    newState.currentPlayer = findNextPlayer(newState, newState.currentPlayer);
  }

  return newState;
}

export function dealBoard(state: GameState): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;

  if (newState.stage === "flop" && newState.boardCards.length === 0) {
    newState.remainingDeck.shift(); // Burn
    newState.boardCards = [
      newState.remainingDeck.shift()!,
      newState.remainingDeck.shift()!,
      newState.remainingDeck.shift()!,
    ];
    newState.actionLog.push(`*** FLOP ***: ${newState.boardCards.join(" ")}`);
  } else if (newState.stage === "turn" && newState.boardCards.length === 3) {
    newState.remainingDeck.shift(); // Burn
    const card = newState.remainingDeck.shift()!;
    newState.boardCards.push(card);
    newState.actionLog.push(`*** TURN ***: ${card}`);
  } else if (newState.stage === "river" && newState.boardCards.length === 4) {
    newState.remainingDeck.shift(); // Burn
    const card = newState.remainingDeck.shift()!;
    newState.boardCards.push(card);
    newState.actionLog.push(`*** RIVER ***: ${card}`);
  }

  return newState;
}

export function isHandComplete(state: GameState): boolean {
  return state.stage === "showdown";
}

export function getMinRaiseAmount(state: GameState): number {
  if (state.currentBet === 0) {
    return state.bigBlindSize;
  }
  return state.currentBet + state.minRaise;
}

export function getCallAmount(state: GameState): number {
  const player = state.players[state.currentPlayer];
  return Math.min(state.currentBet - player.bet, player.stack);
}

export function getActivePlayerCount(state: GameState): number {
  return state.players.filter((p) => !p.folded && p.stack > 0).length;
}

// NEW: Winner determination functions
export function determineWinners(state: GameState): { winners: number[]; winningHand?: HandRank } {
  const activePlayers = state.players.filter(p => !p.folded);
  
  // If only one player remains, they win
  if (activePlayers.length === 1) {
    return { winners: [activePlayers[0].position] };
  }
  
  // At showdown, evaluate all hands
  const playerHands = activePlayers.map(player => {
    const holeCards = [player.holeCards.slice(0, 2), player.holeCards.slice(2, 4)];
    return {
      player: player.position,
      hand: evaluateHand(holeCards, state.boardCards)
    };
  });
  
  // Find the best hand(s) - handle ties
  let bestHands = [playerHands[0]];
  for (let i = 1; i < playerHands.length; i++) {
    const comparison = compareHands(bestHands[0].hand, playerHands[i].hand);
    if (comparison < 0) {
      bestHands = [playerHands[i]];
    } else if (comparison === 0) {
      bestHands.push(playerHands[i]);
    }
  }
  
  return { 
    winners: bestHands.map(ph => ph.player),
    winningHand: bestHands[0].hand
  };
}

export function getWinningPlayerNames(state: GameState, winnerPositions: number[]): string {
  return winnerPositions.map(pos => {
    const player = state.players.find(p => p.position === pos);
    return player ? player.name : `Player ${pos}`;
  }).join(' and ');
}