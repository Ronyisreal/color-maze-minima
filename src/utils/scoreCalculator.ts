
import { Difficulty } from '@/components/DifficultySelector';

export interface ScoreData {
  baseScore: number;
  efficiencyBonus: number;
  difficultyMultiplier: number;
  totalScore: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export const calculateScore = (
  difficulty: Difficulty,
  minimumColors: number,
  colorsUsed: number,
  level: number
): ScoreData => {
  // Base score based on difficulty
  const baseScores = {
    easy: 100,
    medium: 200,
    hard: 300,
  };

  const baseScore = baseScores[difficulty];
  
  // Efficiency bonus (perfect = 100%, each extra color reduces bonus)
  const colorDifference = colorsUsed - minimumColors;
  const efficiencyPercentage = Math.max(0, 100 - (colorDifference * 25));
  const efficiencyBonus = Math.floor((baseScore * efficiencyPercentage) / 100);
  
  // Difficulty multiplier increases with level
  const difficultyMultipliers = {
    easy: 1 + (level - 1) * 0.1,
    medium: 1 + (level - 1) * 0.15,
    hard: 1 + (level - 1) * 0.2,
  };

  const difficultyMultiplier = difficultyMultipliers[difficulty];
  const totalScore = Math.floor((baseScore + efficiencyBonus) * difficultyMultiplier);

  // Calculate grade
  let grade: 'S' | 'A' | 'B' | 'C' | 'D';
  if (colorsUsed === minimumColors) grade = 'S';
  else if (colorsUsed === minimumColors + 1) grade = 'A';
  else if (colorsUsed === minimumColors + 2) grade = 'B';
  else if (colorsUsed <= minimumColors + 3) grade = 'C';
  else grade = 'D';

  return {
    baseScore,
    efficiencyBonus,
    difficultyMultiplier,
    totalScore,
    grade,
  };
};
