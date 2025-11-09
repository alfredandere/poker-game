"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createHand, getHands, Hand } from "@/lib/api";
import {
  createInitialState,
  performAction,
  dealBoard,
  getValidActions,
  isHandComplete,
  determineWinners,
  getWinningPlayerNames,
  type GameState,
  type PlayerAction,
} from "@/lib/poker-engine";
import { showToast } from "@/lib/toast";
import { showDealConfetti } from "@/lib/confetti";
import { WinnerCelebration } from "@/components/poker/WinnerCelebration";
import { GameSetup } from "@/components/poker/GameSetup";
import { GameTable } from "@/components/poker/GameTable";
import { ActionPanel } from "@/components/poker/ActionPanel";
import { HandHistory } from "@/components/poker/HandHistory";
import { Toaster } from "react-hot-toast";
import { HandRank } from "@/lib/hand-evaluator";

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betAmount, setBetAmount] = useState(80);
  const [saving, setSaving] = useState(false);
  const [handHistory, setHandHistory] = useState<Hand[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stackInputs, setStackInputs] = useState<number[]>([
    1000, 1000, 1000, 1000, 1000, 1000,
  ]);
  const [hasStarted, setHasStarted] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{
    names: string;
    positions: number[];
    isYou: boolean;
    winningHand?: HandRank;
  } | null>(null);

  useEffect(() => {
    loadHandHistory();
  }, []);

  const loadHandHistory = async () => {
    setLoadingHistory(true);
    try {
      const hands = await getHands();
      setHandHistory(hands);
    } catch (error) {
      console.error("Failed to load hand history:", error);
      showToast.error(`Failed to load history: ${(error as Error).message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewHand = () => {
    try {
      const newState = createInitialState(stackInputs);
      setGameState(newState);
      setHasStarted(true);
      setShowWinner(false);
      setWinnerInfo(null);
      showToast.success("New hand started! Good luck!");
      showDealConfetti();
    } catch (error) {
      showToast.error(`Failed to start hand: ${(error as Error).message}`);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setHasStarted(false);
    setShowWinner(false);
    setWinnerInfo(null);
    setStackInputs([1000, 1000, 1000, 1000, 1000, 1000]);
    showToast.info("Game reset");
  };

  const handleAction = (action: PlayerAction) => {
    if (!gameState) return;

    try {
      let newState: GameState;

      if (action === "bet" || action === "raise") {
        newState = performAction(gameState, action, betAmount);
      } else {
        newState = performAction(gameState, action);
      }

      // Deal community cards when stage advances
      if (newState.stage !== gameState.stage && newState.stage !== "showdown") {
        newState = dealBoard(newState);
        showDealConfetti();
      }

      setGameState(newState);

      // Use player name in the toast
      const playerName = gameState.players[gameState.currentPlayer].name;
      showToast.success(
        `${playerName} ${action}${
          action === "raise" || action === "bet" ? ` ${betAmount}` : ""
        }`
      );

      if (isHandComplete(newState)) {
        // Determine winner and show celebration
        const { winners, winningHand } = determineWinners(newState);
        if (winners.length > 0) {
          const winnerNames = getWinningPlayerNames(newState, winners);
          const isYouWinner = winners.some(
            (pos) => newState.players.find((p) => p.position === pos)?.isYou
          );

          setWinnerInfo({
            names: winnerNames,
            positions: winners,
            isYou: isYouWinner,
            winningHand,
          });
          setShowWinner(true);
        }
        saveHandToAPI(newState, winners, winningHand);
      }
    } catch (error) {
      showToast.error(`Action failed: ${(error as Error).message}`);
    }
  };

  const saveHandToAPI = async (
    finalState: GameState,
    winners: number[],
    winningHand?: HandRank
  ) => {
    setSaving(true);
    const toastId = showToast.loading("Saving hand results...");

    try {
      // Convert each player's hole cards array to a concatenated string
      const hole_cards = finalState.players.map((p) => p.holeCards.join(""));

      const handData = {
        stacks: finalState.initialStacks,
        dealer_position: finalState.dealerPosition,
        small_blind_position: finalState.smallBlindPosition,
        big_blind_position: finalState.bigBlindPosition,
        hole_cards: hole_cards,
        actions: finalState.actionSequence.join(","),
        board_cards: finalState.boardCards.join(""),
        winners: winners,
        winning_hand: winningHand?.name || "Fold",
        pot: finalState.pot,
      };

      console.log("Saving hand:", {
        ...handData,
        hole_cards_length: handData.hole_cards.length,
        hole_cards_sample: handData.hole_cards.slice(0, 2),
      });

      const savedHand = await createHand(handData);

      showToast.update(toastId, {
        message: `Hand saved! ID: ${savedHand.id.slice(0, 8)}`,
      });
      await loadHandHistory();
    } catch (error) {
      console.error("Failed to save hand:", error);
      showToast.update(toastId, {
        message: `Failed to save hand: ${(error as Error).message}`,
      });
    } finally {
      setSaving(false);
    }
  };

  // Setup screen
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-gray-900 p-6">
        <Toaster />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-900 px-6 py-3 rounded-2xl mb-4">
              <h1 className="text-4xl font-bold">TEXAS HOLD&apos;EM POKER</h1>
            </div>
            <p className="text-gray-300 text-lg">6-Max No Limit • $20/$40 Blinds</p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Game Setup - Left Side */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-6 bg-amber-400 rounded-full"></div>
                  Game Setup
                </h2>
                <GameSetup
                  stackInputs={stackInputs}
                  onStackInputsChange={setStackInputs}
                  onStartNewHand={startNewHand}
                  onResetGame={resetGame}
                  hasStarted={hasStarted}
                />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700">
                  <div className="text-2xl font-bold text-amber-400">6</div>
                  <div className="text-gray-400 text-sm">Max Players</div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700">
                  <div className="text-2xl font-bold text-green-400">$20/$40</div>
                  <div className="text-gray-400 text-sm">Blinds</div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700">
                  <div className="text-2xl font-bold text-blue-400">NL</div>
                  <div className="text-gray-400 text-sm">No Limit</div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-4 text-center border border-slate-700">
                  <div className="text-2xl font-bold text-purple-400">100%</div>
                  <div className="text-gray-400 text-sm">Fair Play</div>
                </div>
              </div>
            </div>

            {/* Hand History - Right Side */}
            <div className="xl:col-span-1">
              <div className="bg-slate-800/60 rounded-2xl border border-slate-700 h-full">
                <HandHistory
                  hands={handHistory}
                  loading={loadingHistory}
                  onRefresh={loadHandHistory}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  const validActions = getValidActions(gameState);
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const activePlayers = gameState.players.filter(p => !p.folded).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-gray-900 p-4">
      <Toaster />

      {/* Winner Celebration Modal */}
      {showWinner && winnerInfo && gameState && (
        <WinnerCelebration
          winnerNames={winnerInfo.names}
          winnerPositions={winnerInfo.positions}
          isYou={winnerInfo.isYou}
          potAmount={gameState.pot}
          winningHand={winnerInfo.winningHand}
          onClose={() => setShowWinner(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        {/* Top Bar - Game Status */}
        <div className="">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Game Info */}
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Texas Hold&apos;em</h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-amber-500 text-white px-3 py-1 text-sm">
                    {gameState.stage.toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2 text-gray-200">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    Pot: <span className="font-bold text-white">${gameState.pot}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Turn & Stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-gray-400 text-sm">Current Player</div>
                <div className="font-bold text-white text-lg">{currentPlayer.name}</div>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <div className="text-gray-400 text-sm">Active</div>
                  <div className="font-bold text-green-400">{activePlayers}/6</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-400 text-sm">Min Raise</div>
                  <div className="font-bold text-amber-400">${gameState.minRaise}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={startNewHand}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                New Hand
              </Button>
              <Button
                onClick={resetGame}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
              >
                Reset Game
              </Button>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          {/* Game Table - Center Stage */}
          <div className="flex-1 lg:flex-[2] bg-slate-800/40 rounded-2xl border-2 border-slate-600/50 ">
            <GameTable gameState={gameState} />
          </div>

          {/* Sidebar - Controls & History */}
          <div className="lg:w-80 xl:w-96 flex flex-col gap-6 min-h-0">
            <div className="bg-slate-800/80">
              <ActionPanel
                gameState={gameState}
                validActions={validActions}
                betAmount={betAmount}
                onBetAmountChange={setBetAmount}
                onAction={handleAction}
                saving={saving}
              />
            </div>

            {/* Player Quick Info */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <div className="w-2 h-4 bg-blue-400 rounded-full"></div>
                Your Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Stack</span>
                  <span className="font-bold text-green-400">${currentPlayer.stack}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Bet</span>
                  <span className="font-bold text-amber-400">${currentPlayer.bet}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Position</span>
                  <div className="flex gap-1">
                    {currentPlayer.isDealer && <Badge className="bg-red-600 text-xs">D</Badge>}
                    {currentPlayer.isSmallBlind && <Badge className="bg-yellow-500 text-slate-900 text-xs">SB</Badge>}
                    {currentPlayer.isBigBlind && <Badge className="bg-blue-500 text-xs">BB</Badge>}
                  </div>
                </div>
              </div>
            </div>

            {/* Hand History */}
            <div className="flex-1 bg-slate-800/60 rounded-2xl border border-slate-700 min-h-0">
              <HandHistory
                hands={handHistory}
                loading={loadingHistory}
                onRefresh={loadHandHistory}
              />
            </div>
          </div>
        </div>

        {/* Bottom Bar - Game Legend & Quick Actions */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Position Legend */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                <span className="text-gray-300 text-sm">Dealer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg shadow-yellow-500/50"></div>
                <span className="text-gray-300 text-sm">Small Blind</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
                <span className="text-gray-300 text-sm">Big Blind</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
                <span className="text-gray-300 text-sm">Current Player</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button
                onClick={startNewHand}
                variant="outline"
                className="border-green-600 text-green-400 hover:bg-green-600/20"
                size="sm"
              >
                Quick New Hand
              </Button>
              <Button
                onClick={() => loadHandHistory()}
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600/20"
                size="sm"
              >
                Refresh History
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}