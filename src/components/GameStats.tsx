
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Palette, Star } from 'lucide-react';

interface GameStatsProps {
  level: number;
  minimumColors: number;
  colorsUsed: number;
  gameCompleted: boolean;
}

export const GameStats: React.FC<GameStatsProps> = ({
  level,
  minimumColors,
  colorsUsed,
  gameCompleted,
}) => {
  const getEfficiencyScore = () => {
    if (!gameCompleted) return null;
    if (colorsUsed === minimumColors) return 'Perfect!';
    if (colorsUsed === minimumColors + 1) return 'Excellent!';
    if (colorsUsed === minimumColors + 2) return 'Good!';
    return 'Keep trying!';
  };

  const getEfficiencyColor = () => {
    if (!gameCompleted) return 'secondary';
    if (colorsUsed === minimumColors) return 'default';
    if (colorsUsed <= minimumColors + 1) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Trophy className="w-5 h-5" />
        Game Stats
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4" />
            Level
          </span>
          <Badge variant="outline">{level}</Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4" />
            Minimum Colors
          </span>
          <Badge variant="secondary">{minimumColors}</Badge>
        </div>

        {gameCompleted && (
          <>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <Palette className="w-4 h-4" />
                Colors Used
              </span>
              <Badge variant="outline">{colorsUsed}</Badge>
            </div>

            <div className="pt-2 border-t">
              <div className="text-center">
                <Badge variant={getEfficiencyColor()} className="text-sm">
                  {getEfficiencyScore()}
                </Badge>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500 border-t pt-3">
        <p><strong>Rules:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-1">
          <li>Adjacent blocks cannot have the same color</li>
          <li>Use minimum colors to get perfect score</li>
          <li>Dashed lines show block connections</li>
        </ul>
      </div>
    </div>
  );
};
