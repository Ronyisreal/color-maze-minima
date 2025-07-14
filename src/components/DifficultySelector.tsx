
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
      description: 'Simple shapes',
      color: 'bg-green-500',
      blocks: '4-6',
    },
    {
      id: 'medium' as Difficulty,
      name: 'Medium',
      icon: Zap,
      description: 'Mixed shapes',
      color: 'bg-yellow-500',
      blocks: '7-10',
    },
    {
      id: 'hard' as Difficulty,
      name: 'Hard',
      icon: Flame,
      description: 'Complex shapes',
      color: 'bg-red-500',
      blocks: '11-15',
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-bold text-xl flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
        <Star className="w-6 h-6 text-purple-600 animate-shine" />
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
                <div className={`p-1.5 rounded ${difficulty.color} text-white flex-shrink-0`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium text-sm">{difficulty.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {difficulty.blocks} blocks
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};
