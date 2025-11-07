import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayingCard } from './PlayingCard';
import { PlayerCard } from './PlayerCard';
import { GameState } from '@/lib/poker-engine';

interface GameTableProps {
  gameState: GameState;
}

export const GameTable: React.FC<GameTableProps> = ({ gameState }) => {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const callAmount = gameState.currentBet - currentPlayer.bet;

  return (
    <Card className="bg-gradient-to-br from-green-700 to-green-600 border-4 border-amber-600">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <div className="inline-block bg-amber-500 rounded-full px-6 py-3">
            <div className="text-white text-xs font-semibold">POT</div>
            <div className="text-2xl font-bold text-white">${gameState.pot}</div>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-4 min-h-[70px]">
          {gameState.boardCards.map((card, idx) => (
            <PlayingCard key={idx} card={card} />
          ))}
          {gameState.stage === 'preflop' && (
            <div className="text-white text-center py-4 opacity-50">Waiting for flop...</div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {gameState.players.map((player) => (
            <PlayerCard
              key={player.position}
              player={player}
              isCurrentPlayer={player.position === gameState.currentPlayer}
              showCards={player.position === gameState.currentPlayer || gameState.stage === 'showdown'}
            />
          ))}
        </div>

        {gameState.currentBet > 0 && (
          <div className="mt-4 text-center text-white">
            Current Bet: <span className="font-bold text-amber-300">${gameState.currentBet}</span>
            {callAmount > 0 && (
              <span className="ml-3">
                To Call: <span className="font-bold text-blue-300">${callAmount}</span>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};