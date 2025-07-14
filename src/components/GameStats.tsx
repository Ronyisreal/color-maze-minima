
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy, Target, Palette, Star, Award, Info } from 'lucide-react';
import { ScoreData } from '@/utils/scoreCalculator';
import { Region } from '@/utils/shapeGenerator';

interface GameStatsProps {
  level: number;
  minimumColors: number;
  colorsUsed: number;
  gameCompleted: boolean;
  score?: ScoreData | null;
  currentScore: number;
  regions: Region[];
}

export const GameStats: React.FC<GameStatsProps> = ({
  level,
  minimumColors,
  colorsUsed,
  gameCompleted,
  score,
  currentScore,
  regions,
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
      case 'S': return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse';
      case 'A': return 'bg-gradient-to-r from-green-400 to-green-600 text-white';
      case 'B': return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
      case 'C': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'D': return 'bg-gradient-to-r from-red-400 to-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Get unique colors actually used in the puzzle
  const getUsedColors = () => {
    const uniqueColors = new Set(regions.map(region => region.color).filter(Boolean));
    return Array.from(uniqueColors);
  };

  const usedColorsList = getUsedColors();

  return (
    <div className="space-y-6 animate-fade-in">
      <h3 className="font-bold text-xl flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        <Trophy className="w-6 h-6 text-purple-600 animate-bounce" />
        Game Stats
      </h3>
      
      <div className="space-y-4">
        {/* Level - Highlighted */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 p-4 rounded-xl border-2 border-purple-200 hover-scale transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 text-lg font-bold">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-2 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              Level
            </span>
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-lg px-6 py-2 min-w-[3rem] flex items-center justify-center animate-scale-in">
              {level}
            </Badge>
          </div>
        </div>

        {/* Minimum Colors - Highlighted */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 p-4 rounded-xl border-2 border-orange-200 hover-scale transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 text-lg font-bold">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              Minimum Colors
            </span>
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-lg px-6 py-2 min-w-[3rem] flex items-center justify-center animate-scale-in">
              {minimumColors}
            </Badge>
          </div>
        </div>

        {/* Colors Used - Highlighted with actual color swatches */}
        <div className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 p-4 rounded-xl border-2 border-green-200 hover-scale transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-3 text-lg font-bold">
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-2 rounded-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              Colors Used
            </span>
            <div className="flex gap-1">
              {usedColorsList.length > 0 ? (
                usedColorsList.map((color, index) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg hover-scale animate-scale-in"
                    style={{ backgroundColor: color }}
                    title={`Color ${index + 1}`}
                  />
                ))
              ) : (
                <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white text-lg px-6 py-2 min-w-[3rem] flex items-center justify-center animate-scale-in">
                  0
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Current Score - Always visible */}
        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 p-4 rounded-xl border-2 border-indigo-200 hover-scale transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3 text-lg font-bold">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              Current Score
            </span>
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg px-6 py-2 min-w-[3rem] flex items-center justify-center animate-scale-in">
              {currentScore}
            </Badge>
          </div>
        </div>

        {/* Final score and grade only when completed */}
        {gameCompleted && score && (
          <div className="border-t pt-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Final Score</span>
              <Badge variant="default" className="text-lg px-3 py-1">
                {score.totalScore}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Grade</span>
              <Badge className={`${getGradeColor(score.grade)} text-lg px-4 py-2`}>
                {score.grade}
              </Badge>
            </div>

            <div className="text-center pt-2">
              <Badge variant={getEfficiencyColor()} className="text-sm px-4 py-2">
                {getEfficiencyScore()}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 border-t pt-4 space-y-2">
        <p><strong>Rules:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Adjacent blocks cannot have the same color</li>
          <li>Use minimum colors to get perfect score</li>
          <li>Bold selections show block connections</li>
        </ul>
        
        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 rounded-lg text-xs border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <strong className="text-blue-800 dark:text-blue-200">Scoring:</strong>
              <ul className="mt-1 space-y-0.5 text-blue-700 dark:text-blue-300">
                <li>• +10 points per colored region</li>
                <li>• Higher levels = more multiplier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
