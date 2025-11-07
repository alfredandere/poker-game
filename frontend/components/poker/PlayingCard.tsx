import React from 'react';

interface PlayingCardProps {
  card: string;
  hidden?: boolean;
}

export const PlayingCard: React.FC<PlayingCardProps> = ({ card, hidden = false }) => {
  if (hidden) {
    return (
      <div className="w-12 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded border border-blue-400 flex items-center justify-center shadow">
        <div className="text-xl text-blue-300">🂠</div>
      </div>
    );
  }

  const rank = card[0];
  const suit = card[1];
  const isRed = suit === 'h' || suit === 'd';
  
  const suitSymbol = {
    'h': '♥',
    'd': '♦',
    'c': '♣',
    's': '♠'
  }[suit];

  return (
    <div className={`w-12 h-16 bg-white rounded border ${isRed ? 'border-red-300' : 'border-gray-800'} flex flex-col items-center justify-between p-1 shadow`}>
      <div className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {rank}
      </div>
      <div className={`text-lg ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {suitSymbol}
      </div>
      <div className={`text-sm font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {rank}
      </div>
    </div>
  );
};