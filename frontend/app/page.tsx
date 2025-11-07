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
  type GameState,
  type PlayerAction 
} from '@/lib/poker-engine';
import { showToast } from '@/lib/toast';
import { GameSetup } from '@/components/poker/GameSetup';
import { GameTable } from '@/components/poker/GameTable';
import { ActionPanel } from '@/components/poker/ActionPanel';
import { HandHistory } from '@/components/poker/HandHistory';

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betAmount, setBetAmount] = useState(80);
  const [saving, setSaving] = useState(false);
  const [handHistory, setHandHistory] = useState<Hand[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stackInputs, setStackInputs] = useState<number[]>([1000, 1000, 1000, 1000, 1000, 1000]);
  const [hasStarted, setHasStarted] = useState(false);

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
      showToast.success('New hand started! Good luck!');
    } catch (error) {
      showToast.error(`Failed to start hand: ${(error as Error).message}`);
    }
  };

  const resetGame = () => {
    setGameState(null);
    setHasStarted(false);
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
      }

      setGameState(newState);
      showToast.success(`Player ${gameState.currentPlayer} performed ${action}`);

      if (isHandComplete(newState)) {
        saveHandToAPI(newState);
      }
    } catch (error) {
      showToast.error(`Action failed: ${(error as Error).message}`);
    }
  };

  const saveHandToAPI = async (finalState: GameState) => {
    setSaving(true);
    const toastId = showToast.loading('Calculating results and saving hand...');
    
    try {
      const handData = {
        stacks: finalState.initialStacks, 
        dealer_position: finalState.dealerPosition,
        small_blind_position: finalState.smallBlindPosition, 
        big_blind_position: finalState.bigBlindPosition,
        hole_cards: finalState.players.map(p => p.holeCards),
        actions: finalState.actionSequence.join(','),
        board_cards: finalState.boardCards.join(''),
      };

      console.log('Saving 6-max Texas Hold\'em hand:', handData);
      const savedHand = await createHand(handData);
      
      showToast.update(toastId, { message: `Hand completed and saved! ID: ${savedHand.id.slice(0, 8)}` });
      await loadHandHistory();
    } catch (error) {
      console.error('Failed to save hand:', error);
      showToast.update(toastId, { message: `Failed to save hand: ${(error as Error).message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
      
      <div className="max-w-7xl mx-auto">
        {/* Setup screen */}
        {!gameState ? (
          <>
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-white mb-2">Texas Hold&apos;em Poker</h1>
              <p className="text-gray-300">6-Max No Limit • $20/$40 Blinds</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          </>
        ) : (
          /* Game screen */
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Texas Hold&apos;em</h1>
                <div className="flex gap-2 items-center">
                  <Badge className="text-base px-3 py-1 bg-amber-500 text-white border-amber-600">
                    {gameState.stage.toUpperCase()}
                  </Badge>
                  <span className="text-gray-300 text-sm">
                    Player {gameState.currentPlayer} to act
                  </span>
                </div>
              </div>
              <Button 
                onClick={resetGame} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset Game
              </Button>
            </div>

            {/* Main Game Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Game Table */}
              <div className="lg:col-span-2">
                <GameTable gameState={gameState} />
              </div>

              {/* Action Panel */}
              <div>
                <ActionPanel
                  gameState={gameState}
                  validActions={getValidActions(gameState)}
                  betAmount={betAmount}
                  onBetAmountChange={setBetAmount}
                  onAction={handleAction}
                  saving={saving}
                />
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Hand History */}
                <HandHistory
                  hands={handHistory}
                  loading={loadingHistory}
                  onRefresh={loadHandHistory}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}