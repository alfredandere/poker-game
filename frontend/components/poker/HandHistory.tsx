import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Hand } from '@/lib/api';

interface HandHistoryProps {
  hands: Hand[];
  loading: boolean;
  onRefresh: () => void;
}

export const HandHistory: React.FC<HandHistoryProps> = ({ 
  hands, 
  loading, 
  onRefresh 
}) => {
  const formatPayoffs = (payoffs: number[]) => {
    return payoffs.map((p, i) => {
      const sign = p > 0 ? '+' : '';
      return `P${i}: ${sign}${p}`;
    }).join(', ');
  };

  return (
    <Card className="bg-gray-900 border-2 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-white text-lg">Hand History</CardTitle>
        <Button 
          onClick={onRefresh}
          size="sm"
          variant="outline"
          disabled={loading}
          className="bg-gray-800 text-white border-gray-600 h-8 w-8 p-0"
        >
          {loading ? '⏳' : '🔄'}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-white text-center py-4">Loading...</div>
        ) : hands.length === 0 ? (
          <div className="text-gray-400 text-center py-4">No hands yet</div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {hands.slice().reverse().map((hand) => (
              <div key={hand.id} className="bg-gray-800 p-2 rounded text-xs">
                <div className="text-gray-400 mb-1 font-mono">{hand.id.slice(0, 8)}...</div>
                <div className="text-white mb-1 text-[10px]">
                  [{hand.stacks.join(',')}] D:{hand.dealer_position} SB:{hand.small_blind_position} BB:{hand.big_blind_position}
                </div>
                <div className="text-gray-300 mb-1 text-[10px]">
                  {hand.hole_cards.join(',')}
                </div>
                <div className="text-gray-400 mb-1 truncate text-[10px]">
                  {hand.actions}
                </div>
                <div className="text-green-400 text-[10px]">
                  {formatPayoffs(hand.payoffs)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};