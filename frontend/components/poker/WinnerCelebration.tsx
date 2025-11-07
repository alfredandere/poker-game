"use client";
import { useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { showConfetti } from '@/lib/confetti';
import { Card, CardContent } from '@/components/ui/card';
import { HandRank } from '@/lib/hand-evaluator';

interface WinnerCelebrationProps {
  winnerNames: string;
  winnerPositions: number[];
  isYou: boolean;
  potAmount: number;
  winningHand?: HandRank; // Use the proper type instead of any
  onClose: () => void;
}

export function WinnerCelebration({ 
  winnerNames, 
  winnerPositions, 
  isYou, 
  potAmount, 
  winningHand,
  onClose 
}: WinnerCelebrationProps) {
  useEffect(() => {
    showConfetti(isYou ? "You" : winnerNames);
  }, [isYou, winnerNames]);

  const isTie = winnerPositions.length > 1;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-amber-500 to-amber-600 border-amber-400 shadow-2xl animate-pulse">
        <CardContent className="p-6 text-center">
          <div className="mb-4">
            <Badge className="bg-green-600 text-white text-lg px-4 py-2 mb-2">
              {isTie ? '🏆 TIE 🏆' : '🏆 WINNER 🏆'}
            </Badge>
          </div>
          
          <h2 className={`text-3xl font-bold mb-2 ${isYou ? 'text-yellow-300' : 'text-white'}`}>
            {winnerNames}
          </h2>
          
          <p className="text-amber-100 mb-3">
            {isTie 
              ? 'Split the pot!' 
              : isYou ? 'Congratulations! You won!' : 'wins the hand!'
            }
          </p>

          {winningHand && (
            <div className="bg-amber-700/50 rounded-lg p-3 mb-3">
              <p className="text-amber-200 text-sm">Winning Hand</p>
              <p className="text-white text-xl font-bold">{winningHand.name}</p>
            </div>
          )}
          
          <div className="bg-amber-700/50 rounded-lg p-3 mb-4">
            <p className="text-amber-200 text-sm">Pot Won</p>
            <p className="text-white text-2xl font-bold">${potAmount}</p>
          </div>
          
          {isYou && !isTie && (
            <div className="bg-yellow-500/20 rounded-lg p-3 mb-4 border border-yellow-400/50">
              <p className="text-yellow-200 text-sm">🎉 Amazing play! 🎉</p>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="bg-amber-700 hover:bg-amber-800 text-white px-8 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            Continue
          </button>
        </CardContent>
      </Card>
    </div>
  );
}