
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Flame } from 'lucide-react';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onDifficultyChange,
}) => {
  const difficulties = [
    {
      id: 'easy' as Difficulty,
      name: 'Easy',
      icon: Star,
      description: '4-6 blocks, simple shapes',
      color: 'bg-green-500',
      blocks: '4-6',
    },
    {
      id: 'medium' as Difficulty,
      name: 'Medium',
      icon: Zap,
      description: '7-10 blocks, mixed shapes',
      color: 'bg-yellow-500',
      blocks: '7-10',
    },
    {
      id: 'hard' as Difficulty,
      name: 'Hard',
      icon: Flame,
      description: '11-15 blocks, complex shapes',
      color: 'bg-red-500',
      blocks: '11-15',
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Star className="w-5 h-5" />
        Difficulty Level
      </h3>
      <div className="space-y-2">
        {difficulties.map((difficulty) => {
          const Icon = difficulty.icon;
          return (
            <Button
              key={difficulty.id}
              variant={selectedDifficulty === difficulty.id ? "default" : "outline"}
              className="w-full justify-start h-auto p-3"
              onClick={() => onDifficultyChange(difficulty.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`p-2 rounded ${difficulty.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium">{difficulty.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {difficulty.description}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {difficulty.blocks}
                </Badge>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
