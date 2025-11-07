import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GameSetupProps {
  stackInputs: number[];
  onStackInputsChange: (stacks: number[]) => void;
  onStartNewHand: () => void;
  onResetGame: () => void;
  hasStarted: boolean;
}

export function GameSetup({
  stackInputs,
  onStackInputsChange,
  onStartNewHand,
  onResetGame,
  hasStarted,
}: GameSetupProps) {
  const handleStackChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newStacks = [...stackInputs];
    newStacks[index] = Math.max(0, numValue);
    onStackInputsChange(newStacks);
  };

  const setAllStacks = (value: number) => {
    onStackInputsChange(Array(6).fill(value));
  };

  return (
    <Card className="bg-gray-900 border-2 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Setup Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stack Presets */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setAllStacks(1000)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            $1000 Each
          </Button>
          <Button
            size="sm"
            onClick={() => setAllStacks(2000)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            $2000 Each
          </Button>
          <Button
            size="sm"
            onClick={() => setAllStacks(5000)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            $5000 Each
          </Button>
        </div>

        {/* Individual Stack Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stackInputs.map((stack, i) => (
            <div key={i} className="space-y-1">
              <Label className="text-white text-sm">
                Player {i} Stack
              </Label>
              <Input
                type="number"
                value={stack}
                onChange={(e) => handleStackChange(i, e.target.value)}
                className="bg-gray-800 text-white border-gray-600"
                min="0"
                step="100"
              />
            </div>
          ))}
        </div>

        {/* Game Info */}
        <div className="bg-gray-800 p-3 rounded text-sm text-gray-300 space-y-1">
          <div>Blinds: $20/$40</div>
          <div>Game: 6-Max No Limit Texas Hold&apos;em</div>
          <div>Total Chips: ${stackInputs.reduce((a, b) => a + b, 0)}</div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onStartNewHand}
            className="bg-green-600 hover:bg-green-700 text-white flex-1 text-lg py-6"
          >
            {hasStarted ? 'Start New Hand' : 'Start Game'}
          </Button>
          {hasStarted && (
            <Button
              onClick={onResetGame}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-6"
            >
              Reset
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}