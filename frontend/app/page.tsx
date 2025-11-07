"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { createHand, getHands, Hand } from '@/lib/api';
import { 
  createInitialState, 
  performAction, 
  dealBoard, 
  getValidActions,
  type GameState,
  type PlayerAction 
} from '@/lib/poker-engine';
import { GameSetup } from '@/components/poker/GameSetup';
import { GameTable } from '@/components/poker/GameTable';
import { ActionPanel } from '@/components/poker/ActionPanel';
import { HandHistory } from '@/components/poker/HandHistory';

export default function PokerGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [betAmount, setBetAmount] = useState(80);
  const [message, setMessage] = useState('');
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
      setMessage('⚠️ Failed to load hand history: ' + (error as Error).message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startNewHand = () => {
    const newState = createInitialState(stackInputs);
    setGameState(newState);
    setHasStarted(true);
    setMessage('New hand started! Good luck!');
  };

  const resetGame = () => {
    setGameState(null);
    setHasStarted(false);
    setStackInputs([1000, 1000, 1000, 1000, 1000, 1000]);
    setMessage('');
  };

  const handleAction = (action: PlayerAction) => {
    if (!gameState) return;

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
    setMessage(`Player ${gameState.currentPlayer} performed ${action}`);

    if (newState.stage === 'showdown') {
      saveHandToAPI(newState);
    }
  };

  const saveHandToAPI = async (finalState: GameState) => {
    setSaving(true);
    setMessage('Saving hand to database...');
    
    try {
      const payoffs = finalState.players.map((player, index) => {
        return player.stack - stackInputs[index];
      });

      const handData = {
        stacks: stackInputs,
        dealer_position: finalState.dealerPosition,
        small_blind_position: finalState.smallBlindPosition,
        big_blind_position: finalState.bigBlindPosition,
        hole_cards: finalState.players.map(p => p.holeCards.split(' ')).flat(),
        actions: finalState.actionSequence.join(','),
        board_cards: finalState.boardCards.join(''),
      };

      const savedHand = await createHand(handData);
      
      setMessage(`Hand saved! ID: ${savedHand.id.slice(0, 8)}...`);
      await loadHandHistory();
    } catch (error) {
      console.error('Failed to save hand:', error);
      setMessage('Failed to save hand: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-6">Texas Hold&apos;em Poker</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Setup Panel */}
            <div className="lg:col-span-2">
              <GameSetup
                stackInputs={stackInputs}
                onStackInputsChange={setStackInputs}
                onStartNewHand={startNewHand}
                onResetGame={resetGame}
                hasStarted={hasStarted}
              />
            </div>

            {/* Hand History */}
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

  const validActions = getValidActions(gameState);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Texas Hold&apos;em Poker</h1>
            <Badge variant="outline" className="text-base px-3 py-1 bg-amber-500 text-white border-amber-600">
              {gameState.stage.toUpperCase()}
            </Badge>
          </div>
          <Button onClick={resetGame} className="bg-red-600 hover:bg-red-700 text-white">
            Reset
          </Button>
        </div>

        {message && (
          <Alert className="mb-4 bg-blue-900/50 border-blue-400 text-white">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Table */}
          <div className="lg:col-span-2">
            <GameTable gameState={gameState} />
          </div>

          {/* Actions */}
          <div>
            <ActionPanel
              gameState={gameState}
              validActions={validActions}
              betAmount={betAmount}
              onBetAmountChange={setBetAmount}
              onAction={handleAction}
              saving={saving}
            />
          </div>

          {/* Hand History & Action Log */}
          <div className="space-y-4">
            <HandHistory
              hands={handHistory}
              loading={loadingHistory}
              onRefresh={loadHandHistory}
            />

            {/* Action Log */}
            <Card className="bg-gray-900 border-2 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Play Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {gameState.actionLog.slice().reverse().map((log, idx) => (
                    <div key={idx} className="text-xs text-gray-300 py-1 px-2 bg-gray-800 rounded">
                      {log}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}