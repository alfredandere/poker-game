import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-xl border-2 border-gray-300">
        <CardContent className="relative p-4">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-3 grid-rows-3 gap-2">
            
            {/* Top Player */}
            <div className="col-start-2 row-start-1 flex justify-center">
              <PlayerCard
                player={gameState.players[0]}
                isCurrentPlayer={0 === gameState.currentPlayer}
                showCards={0 === gameState.currentPlayer || gameState.stage === 'showdown'}
              />
            </div>

            {/* Side Players */}
            <div className="col-start-1 row-start-2 flex justify-start items-center">
              <PlayerCard
                player={gameState.players[1]}
                isCurrentPlayer={1 === gameState.currentPlayer}
                showCards={1 === gameState.currentPlayer || gameState.stage === 'showdown'}
              />
            </div>

            {/* Center Area */}
            <div className="col-start-2 row-start-2 flex flex-col items-center justify-center space-y-3">
              {/* Community Cards */}
              <div className="flex justify-center gap-0.5">
                {gameState.boardCards.map((card, idx) => (
                  <div key={idx} className="transform hover:scale-105 transition-transform">
                    <PlayingCard card={card} />
                  </div>
                ))}
                {gameState.stage === 'preflop' && gameState.boardCards.length === 0 && (
                  <div className="text-gray-600 text-sm min-w-[70px] text-center">
                    Waiting for flop...
                  </div>
                )}
              </div>

              {/* Pot Display */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-full px-3 py-2 shadow-lg border-2 border-amber-400 text-center min-w-[100px]">
                <div className="text-white text-xs font-semibold uppercase tracking-wide">POT</div>
                <div className="text-xl font-bold text-white">${gameState.pot}</div>
              </div>
            </div>

            <div className="col-start-3 row-start-2 flex justify-end items-center">
              <PlayerCard
                player={gameState.players[2]}
                isCurrentPlayer={2 === gameState.currentPlayer}
                showCards={2 === gameState.currentPlayer || gameState.stage === 'showdown'}
              />
            </div>

            {/* Bottom Players */}
            <div className="col-start-1 row-start-3 flex justify-start">
              <PlayerCard
                player={gameState.players[3]}
                isCurrentPlayer={3 === gameState.currentPlayer}
                showCards={3 === gameState.currentPlayer || gameState.stage === 'showdown'}
              />
            </div>

            <div className="col-start-2 row-start-3 flex justify-center">
              <PlayerCard
                player={gameState.players[4]}
                isCurrentPlayer={4 === gameState.currentPlayer}
                showCards={4 === gameState.currentPlayer || gameState.stage === 'showdown'}
              />
            </div>

            <div className="col-start-3 row-start-3 flex justify-end">
              <PlayerCard
                player={gameState.players[5]}
                isCurrentPlayer={5 === gameState.currentPlayer}
                showCards={5 === gameState.currentPlayer || gameState.stage === 'showdown'}
              />
            </div>
          </div>

          {/* Current Bet Display */}
          {gameState.currentBet > 0 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-800/95 rounded px-3 py-2 border border-amber-500/60">
              <div className="text-white text-sm font-medium text-center whitespace-nowrap">
                <span>Bet: <span className="text-amber-300">${gameState.currentBet}</span></span>
                {callAmount > 0 && (
                  <span className="ml-3">
                    Call: <span className="text-blue-300">${callAmount}</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};