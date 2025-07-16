
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
  level: number,
  regionCount: number
): ScoreData => {
  // Simple scoring: 10 points per region
  const baseScore = regionCount * 10;
  const efficiencyBonus = 0;
  const difficultyMultiplier = 1;
  const totalScore = baseScore;

  // Calculate grade based on color efficiency
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
