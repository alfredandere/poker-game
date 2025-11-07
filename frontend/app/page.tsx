"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createHand, getHands, Hand } from '@/lib/api';
import { 
  createInitialState, 
  performAction, 
  dealBoard, 
  getValidActions,
  isHandComplete,
  determineWinners,
  getWinningPlayerNames,
  type GameState,
  type PlayerAction 
} from '@/lib/poker-engine';
import { showToast } from '@/lib/toast';
import { showDealConfetti } from '@/lib/confetti';
import { WinnerCelebration } from '@/components/poker/WinnerCelebration';
import { GameSetup } from '@/components/poker/GameSetup';
import { GameTable } from '@/components/poker/GameTable';
import { ActionPanel } from '@/components/poker/ActionPanel';
import { HandHistory } from '@/components/poker/HandHistory';
import { Toaster } from 'react-hot-toast';
import { HandRank } from '@/lib/hand-evaluator';

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betAmount, setBetAmount] = useState(80);
  const [saving, setSaving] = useState(false);
  const [handHistory, setHandHistory] = useState<Hand[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stackInputs, setStackInputs] = useState<number[]>([1000, 1000, 1000, 1000, 1000, 1000]);
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
      console.error('Failed to load hand history:', error);
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
      showToast.success('New hand started! Good luck!');
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
    showToast.info('Game reset');
  };

  const handleAction = (action: PlayerAction) => {
    if (!gameState) return;

    try {
      let newState: GameState;
      
      if (action === 'bet' || action === 'raise') {
        newState = performAction(gameState, action, betAmount);
      } else {
        newState = performAction(gameState, action);
      }

      // Deal community cards when stage advances
      if (newState.stage !== gameState.stage && newState.stage !== 'showdown') {
        newState = dealBoard(newState);
        showDealConfetti();
      }

      setGameState(newState);
      
      // Use player name in the toast
      const playerName = gameState.players[gameState.currentPlayer].name;
      showToast.success(`${playerName} ${action}${action === 'raise' || action === 'bet' ? ` ${betAmount}` : ''}`);

      if (isHandComplete(newState)) {
        // Determine winner and show celebration
        const { winners, winningHand } = determineWinners(newState);
        if (winners.length > 0) {
          const winnerNames = getWinningPlayerNames(newState, winners);
          const isYouWinner = winners.some(pos => 
            newState.players.find(p => p.position === pos)?.isYou
          );

          setWinnerInfo({
            names: winnerNames,
            positions: winners,
            isYou: isYouWinner,
            winningHand
          });
          setShowWinner(true);
        }
        saveHandToAPI(newState, winners, winningHand);
      }
    } catch (error) {
      showToast.error(`Action failed: ${(error as Error).message}`);
    }
  };

  const saveHandToAPI = async (finalState: GameState, winners: number[], winningHand?: HandRank) => {
    setSaving(true);
    const toastId = showToast.loading('Saving hand results...');
    
    try {
      // Convert each player's hole cards array to a concatenated string
      const hole_cards = finalState.players.map(p => p.holeCards.join(''));
      
      const handData = {
        stacks: finalState.initialStacks, 
        dealer_position: finalState.dealerPosition,
        small_blind_position: finalState.smallBlindPosition, 
        big_blind_position: finalState.bigBlindPosition,
        hole_cards: hole_cards,
        actions: finalState.actionSequence.join(','),
        board_cards: finalState.boardCards.join(''),
        winners: winners,
        winning_hand: winningHand?.name || 'Fold',
        pot: finalState.pot,
      };

      console.log('Saving hand:', {
        ...handData,
        hole_cards_length: handData.hole_cards.length,
        hole_cards_sample: handData.hole_cards.slice(0, 2)
      });

      const savedHand = await createHand(handData);
      
      showToast.update(toastId, { 
        message: `Hand saved! ID: ${savedHand.id.slice(0, 8)}` 
      });
      await loadHandHistory();
    } catch (error) {
      console.error('Failed to save hand:', error);
      showToast.update(toastId, { message: `Failed to save hand: ${(error as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

  // Setup screen
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
        <Toaster />
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold text-white mb-3">Texas Hold&apos;em Poker</h1>
            <p className="text-gray-300 text-xl">6-Max No Limit • $20/$40 Blinds</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <GameSetup
                stackInputs={stackInputs}
                onStackInputsChange={setStackInputs}
                onStartNewHand={startNewHand}
                onResetGame={resetGame}
                hasStarted={hasStarted}
              />
            </div>

            <div>
              <HandHistory
                hands={handHistory}
                loading={loadingHistory}
                onRefresh={loadHandHistory}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  const validActions = getValidActions(gameState);
  const currentPlayer = gameState.players[gameState.currentPlayer];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
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
      
      <div className="max-w-7xl mx-auto flex flex-col h-screen max-h-screen">
        {/* Header - Compact */}
        <div className="flex justify-between items-center mb-4 px-4 py-3 bg-green-800/50 rounded-lg border border-green-600/30">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Texas Hold&apos;em</h1>
              <div className="flex gap-2 items-center mt-1">
                <Badge className="text-sm px-3 py-1 bg-amber-500 text-white border-amber-600">
                  {gameState.stage.toUpperCase()}
                </Badge>
                <span className="text-gray-200 text-sm">
                  Pot: <span className="font-bold text-white">${gameState.pot}</span>
                </span>
              </div>
            </div>
            <div className="text-gray-200">
              <span className="font-semibold text-white">{currentPlayer.name}</span> to act
            </div>
          </div>
          <Button 
            onClick={resetGame} 
            variant="outline"
            className="bg-red-600 hover:bg-red-700 text-white border-red-700"
          >
            Reset Game
          </Button>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Game Table - Dominant Center Piece */}
          <div className="flex-1 lg:flex-[2] bg-green-800/20 rounded-xl border-2 border-green-600/30 p-4 min-h-0">
            <div className="h-full flex items-center justify-center">
              <GameTable gameState={gameState} />
            </div>
          </div>

          {/* Sidebar - Action Panel and History */}
          <div className="lg:w-80 flex flex-col gap-4 min-h-0">
            {/* Action Panel - Prominent */}
            <div className="bg-gray-900 rounded-xl border-2 border-amber-500/50 shadow-lg shadow-amber-500/10">
              <ActionPanel
                gameState={gameState}
                validActions={validActions}
                betAmount={betAmount}
                onBetAmountChange={setBetAmount}
                onAction={handleAction}
                saving={saving}
              />
            </div>

            {/* Hand History - Scrollable */}
            <div className="flex-1 bg-gray-900/80 rounded-xl border border-gray-700 min-h-0">
              <HandHistory
                hands={handHistory}
                loading={loadingHistory}
                onRefresh={loadHandHistory}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions Bar - Bottom Row */}
        <div className="mt-4 p-3 bg-green-800/30 rounded-lg border border-green-600/20">
          <div className="flex flex-wrap gap-3 justify-center">
            {/* Game Info */}
            <div className="flex items-center gap-4 text-sm text-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Dealer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Small Blind</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Big Blind</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-200">
              <div>
                Players: <span className="font-bold text-white">{gameState.players.filter(p => !p.folded).length}/{gameState.players.length}</span>
              </div>
              <div>
                Min Raise: <span className="font-bold text-white">${gameState.minRaise}</span>
              </div>
              <div>
                Your Stack: <span className="font-bold text-white">${currentPlayer.stack}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}