import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerAction, GameState } from '@/lib/poker-engine';

interface ActionPanelProps {
  gameState: GameState;
  validActions: Set<PlayerAction>;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onAction: (action: PlayerAction) => void;
  saving: boolean;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  gameState,
  validActions,
  betAmount,
  onBetAmountChange,
  onAction,
  saving
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const callAmount = gameState.currentBet - currentPlayer.bet;

  if (gameState.stage === 'showdown') {
    return (
      <Card className="bg-gray-900 border-2 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-green-600 border border-green-500 text-white p-3 rounded text-center">
              <div className="font-bold">Hand Complete!</div>
            </div>
            {saving && (
              <div className="text-center text-white animate-pulse">💾 Saving...</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-2 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {validActions.has('fold') && (
            <Button 
              onClick={() => onAction('fold')}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              Fold
            </Button>
          )}
          
          {validActions.has('check') && (
            <Button 
              onClick={() => onAction('check')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Check
            </Button>
          )}
          
          {validActions.has('call') && (
            <Button 
              onClick={() => onAction('call')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Call ${callAmount}
            </Button>
          )}
          
          {(validActions.has('bet') || validActions.has('raise')) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => onBetAmountChange(Math.max(gameState.minRaise, betAmount - gameState.bigBlindSize))}
                  className="bg-gray-700"
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={betAmount}
                  onChange={(e) => onBetAmountChange(Number(e.target.value))}
                  className="bg-gray-800 text-white text-center"
                />
                <Button
                  size="sm"
                  onClick={() => onBetAmountChange(Math.min(currentPlayer.stack + currentPlayer.bet, betAmount + gameState.bigBlindSize))}
                  className="bg-gray-700"
                >
                  +
                </Button>
              </div>
              <Button 
                onClick={() => onAction(validActions.has('bet') ? 'bet' : 'raise')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              >
                {validActions.has('bet') ? 'Bet' : 'Raise'} ${betAmount}
              </Button>
            </div>
          )}
          
          {validActions.has('allin') && (
            <Button 
              onClick={() => onAction('allin')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              All-In ${currentPlayer.stack + currentPlayer.bet}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};