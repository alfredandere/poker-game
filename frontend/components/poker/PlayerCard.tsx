import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayingCard } from './PlayingCard';
import { Player } from '@/lib/poker-engine';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  showCards: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isCurrentPlayer, 
  showCards 
}) => {
  return (
    <Card 
      className={`relative transition-all duration-200 min-w-[140px] overflow-hidden ${
        isCurrentPlayer 
          ? 'ring-2 ring-amber-400 bg-gradient-to-br from-slate-700 to-amber-900/20 shadow-lg shadow-amber-500/30 scale-[1.02]' 
          : player.folded 
          ? 'opacity-60 bg-slate-800/20 grayscale' 
          : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 hover:scale-[1.01] border-slate-600/30'
      } border rounded-xl shadow-md`}
    >
      {/* Active Player Glow Effect */}
      {isCurrentPlayer && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400/3 via-yellow-300/5 to-amber-400/3 animate-pulse rounded-xl"></div>
      )}

      {/* Folded Overlay */}
      {player.folded && (
        <div className="absolute inset-0 bg-slate-900/60 rounded-xl z-10 flex items-center justify-center">
          <div className="bg-red-600/80 px-2 py-1 rounded border border-red-700 rotate-12">
            <span className="text-white font-bold text-xs uppercase">FOLDED</span>
          </div>
        </div>
      )}

      <CardContent className="p-3 relative z-20">
        {/* Header - Name and Position Badges */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${
              isCurrentPlayer ? 'text-amber-300' : 'text-white'
            }`}>
              {player.name}
            </div>
            <div className="flex gap-1 mt-1">
              {player.isDealer && (
                <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0 h-4">
                  D
                </Badge>
              )}
              {player.isSmallBlind && (
                <Badge className="bg-yellow-500 text-slate-900 text-[10px] px-1.5 py-0 h-4">
                  SB
                </Badge>
              )}
              {player.isBigBlind && (
                <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0 h-4">
                  BB
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Hole Cards - Compact Layout */}
        <div className="flex gap-1 mb-3 justify-center bg-slate-900/30 rounded-lg p-2 border border-slate-600/20">
          {player.holeCards.map((card, idx) => (
            <div 
              key={idx} 
              className={`transform transition-all duration-200 ${
                isCurrentPlayer ? 'scale-105' : 'scale-100'
              }`}
            >
              <PlayingCard 
                card={card} 
                hidden={!showCards}
              />
            </div>
          ))}
        </div>

        {/* Financial Info - Compact */}
        <div className="space-y-1.5">
          {/* Stack */}
          <div className="bg-slate-900/40 rounded px-2 py-1.5 border border-green-500/20">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs font-medium">Stack</span>
              <span className="font-semibold text-green-400 text-sm">${player.stack}</span>
            </div>
          </div>
          
          {/* Current Bet */}
          {player.bet > 0 && (
            <div className="bg-slate-900/40 rounded px-2 py-1.5 border border-amber-500/20">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs font-medium">Bet</span>
                <span className="font-semibold text-amber-400 text-sm">${player.bet}</span>
              </div>
            </div>
          )}
        </div>

        {/* Status Indicator - Minimal */}
        <div className="mt-2 text-center">
          {isCurrentPlayer && (
            <div className="inline-flex items-center gap-1 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-400/20">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
              <span className="text-amber-300 text-xs font-medium">ACTING</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};