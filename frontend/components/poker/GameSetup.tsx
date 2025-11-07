import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameSetupProps {
  stackInputs: number[];
  onStackInputsChange: (stacks: number[]) => void;
  onStartNewHand: () => void;
  onResetGame: () => void;
  hasStarted: boolean;
}

export const GameSetup: React.FC<GameSetupProps> = ({
  stackInputs,
  onStackInputsChange,
  onStartNewHand,
  onResetGame,
  hasStarted
}) => {
  return (
    <Card className="bg-gray-900 border-2 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Setup Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {stackInputs.map((stack, idx) => (
            <div key={idx}>
              <label className="text-white text-sm mb-1 block">Player {idx}</label>
              <Input
                type="number"
                value={stack}
                onChange={(e) => {
                  const newStacks = [...stackInputs];
                  newStacks[idx] = Number(e.target.value);
                  onStackInputsChange(newStacks);
                }}
                className="bg-gray-800 text-white border-gray-600"
              />
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={onStartNewHand}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-lg py-6"
          >
            {hasStarted ? 'Reset & Start New Hand' : 'Start Hand'}
          </Button>
          {hasStarted && (
            <Button 
              onClick={onResetGame}
              variant="outline"
              className="bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
            >
              Clear Setup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};