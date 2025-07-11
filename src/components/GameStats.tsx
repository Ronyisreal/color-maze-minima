
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Palette, Star, Award, Info } from 'lucide-react';
import { ScoreData } from '@/utils/scoreCalculator';

interface GameStatsProps {
  level: number;
  minimumColors: number;
  colorsUsed: number;
  gameCompleted: boolean;
  score?: ScoreData | null;
}

export const GameStats: React.FC<GameStatsProps> = ({
  level,
  minimumColors,
  colorsUsed,
  gameCompleted,
  score,
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

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
      case 'A': return 'bg-green-500 text-white';
      case 'B': return 'bg-blue-500 text-white';
      case 'C': return 'bg-yellow-500 text-white';
      case 'D': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
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

            {score && (
              <>
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Score</span>
                    <Badge variant="default">{score.totalScore}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grade</span>
                    <Badge className={getGradeColor(score.grade)}>
                      {score.grade}
                    </Badge>
                  </div>
                </div>
              </>
            )}

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
        
        <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
          <div className="flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <strong className="text-blue-800">Scoring:</strong>
              <ul className="mt-1 space-y-0.5">
                <li>• Easy: 100 base points</li>
                <li>• Medium: 200 base points</li>
                <li>• Hard: 300 base points</li>
                <li>• Perfect color usage = 100% bonus</li>
                <li>• Higher levels = more multiplier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
