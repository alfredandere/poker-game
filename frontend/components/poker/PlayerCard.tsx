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
      className={`transition-all ${
        isCurrentPlayer 
          ? 'ring-2 ring-yellow-400 bg-green-500/30' 
          : player.folded 
          ? 'opacity-40 bg-gray-800/50' 
          : 'bg-green-800/50'
      } border ${player.folded ? 'border-gray-600' : 'border-green-400'}`}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-1">
            {player.isDealer && <Badge className="bg-red-600 text-xs px-1">D</Badge>}
            {player.isSmallBlind && <Badge className="bg-blue-600 text-xs px-1">SB</Badge>}
            {player.isBigBlind && <Badge className="bg-purple-600 text-xs px-1">BB</Badge>}
          </div>
          <div className="text-white font-bold text-sm">P{player.position}</div>
        </div>
        
        <div className="flex gap-1 mb-2 justify-center">
          {/* Now holeCards is already an array, so we can map directly */}
          {player.holeCards.map((card, idx) => (
            <PlayingCard 
              key={idx} 
              card={card} 
              hidden={!showCards || player.folded}
            />
          ))}
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-white">
            <span>Stack:</span>
            <span className="font-bold text-green-300">${player.stack}</span>
          </div>
          {player.bet > 0 && (
            <div className="flex justify-between text-white">
              <span>Bet:</span>
              <span className="font-bold text-amber-300">${player.bet}</span>
            </div>
          )}
          {player.folded && (
            <Badge className="w-full bg-red-600 text-center text-xs">FOLDED</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};