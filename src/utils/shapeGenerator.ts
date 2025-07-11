
import { Difficulty } from '@/components/DifficultySelector';

export interface ShapeVertex {
  x: number;
  y: number;
}

export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'pentagon' | 'hexagon' | 'star' | 'diamond';

export const generateRandomShape = (
  x: number, 
  y: number, 
  size: number, 
  difficulty: Difficulty
): { shape: ShapeType; vertices?: ShapeVertex[] } => {
  let availableShapes: ShapeType[] = [];
  
  switch (difficulty) {
    case 'easy':
      availableShapes = ['circle', 'rectangle', 'triangle'];
      break;
    case 'medium':
      availableShapes = ['circle', 'rectangle', 'triangle', 'pentagon', 'diamond'];
      break;
    case 'hard':
      availableShapes = ['circle', 'rectangle', 'triangle', 'pentagon', 'hexagon', 'star', 'diamond'];
      break;
  }

  const shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
  let vertices: ShapeVertex[] = [];

  switch (shape) {
    case 'triangle':
      vertices = [
        { x: x, y: y - size * 0.6 },
        { x: x - size * 0.6, y: y + size * 0.4 },
        { x: x + size * 0.6, y: y + size * 0.4 },
      ];
      break;
    case 'pentagon':
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        vertices.push({
          x: x + Math.cos(angle) * size * 0.6,
          y: y + Math.sin(angle) * size * 0.6,
        });
      }
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const angle = (i * 2 * Math.PI) / 6;
        vertices.push({
          x: x + Math.cos(angle) * size * 0.6,
          y: y + Math.sin(angle) * size * 0.6,
        });
      }
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const angle = (i * 2 * Math.PI) / 10 - Math.PI / 2;
        const radius = i % 2 === 0 ? size * 0.6 : size * 0.3;
        vertices.push({
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
        });
      }
      break;
    case 'diamond':
      vertices = [
        { x: x, y: y - size * 0.7 },
        { x: x + size * 0.5, y: y },
        { x: x, y: y + size * 0.7 },
        { x: x - size * 0.5, y: y },
      ];
      break;
  }

  return { shape, vertices: vertices.length > 0 ? vertices : undefined };
};

export const getDifficultyConfig = (difficulty: Difficulty, level: number) => {
  const configs = {
    easy: {
      blockCount: Math.min(4 + level, 6),
      minSize: 35,
      maxSize: 55,
      spacing: 1.8,
    },
    medium: {
      blockCount: Math.min(7 + level, 10),
      minSize: 30,
      maxSize: 50,
      spacing: 1.6,
    },
    hard: {
      blockCount: Math.min(11 + level, 15),
      minSize: 25,
      maxSize: 45,
      spacing: 1.4,
    },
  };
  
  return configs[difficulty];
};
