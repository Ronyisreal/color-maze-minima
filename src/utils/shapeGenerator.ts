
import { Difficulty } from '@/components/DifficultySelector';

export interface ShapeVertex {
  x: number;
  y: number;
}

export type ShapeType = 'organic' | 'blob' | 'neural' | 'tangle' | 'distorted' | 'brain' | 'irregular';

export const generateRandomShape = (
  x: number, 
  y: number, 
  size: number, 
  difficulty: Difficulty
): { shape: ShapeType; vertices?: ShapeVertex[] } => {
  const shapes: ShapeType[] = ['organic', 'blob', 'neural', 'tangle', 'distorted', 'brain', 'irregular'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  
  const vertices = generateOrganicShape(x, y, size, difficulty);
  
  return { shape, vertices };
};

const generateOrganicShape = (centerX: number, centerY: number, baseSize: number, difficulty: Difficulty): ShapeVertex[] => {
  const vertices: ShapeVertex[] = [];
  
  // More vertices for more complex shapes
  const vertexCount = difficulty === 'easy' ? 6 + Math.floor(Math.random() * 4) : 
                     difficulty === 'medium' ? 8 + Math.floor(Math.random() * 6) : 
                     12 + Math.floor(Math.random() * 8);
  
  // Create irregular, brain-like shapes
  for (let i = 0; i < vertexCount; i++) {
    const angle = (i * 2 * Math.PI) / vertexCount;
    
    // Add multiple layers of randomness for organic feel
    const radiusVariation = 0.4 + Math.random() * 0.8; // Base radius variation
    const roughness = 0.7 + Math.random() * 0.6; // Surface roughness
    const irregularity = Math.random() * 0.4; // Shape irregularity
    
    // Create bumps and indentations like brain tissue
    const bumpFactor = Math.sin(angle * 3 + Math.random() * Math.PI) * 0.3;
    const noiseFactor = Math.sin(angle * 7 + Math.random() * Math.PI) * 0.15;
    
    const radius = baseSize * radiusVariation * roughness * (1 + bumpFactor + noiseFactor + irregularity);
    
    // Add angular distortion
    const angleDistortion = (Math.random() - 0.5) * 0.5;
    const distortedAngle = angle + angleDistortion;
    
    // Add positional jitter for more organic feel
    const jitterX = (Math.random() - 0.5) * baseSize * 0.2;
    const jitterY = (Math.random() - 0.5) * baseSize * 0.2;
    
    const x = centerX + Math.cos(distortedAngle) * radius + jitterX;
    const y = centerY + Math.sin(distortedAngle) * radius + jitterY;
    
    vertices.push({ x, y });
  }
  
  // Add some random internal bumps for extra complexity
  if (difficulty !== 'easy') {
    const extraVertices = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < extraVertices; i++) {
      const insertIndex = Math.floor(Math.random() * vertices.length);
      const prevVertex = vertices[insertIndex];
      const nextVertex = vertices[(insertIndex + 1) % vertices.length];
      
      // Create a mid-point with distortion
      const midX = (prevVertex.x + nextVertex.x) / 2;
      const midY = (prevVertex.y + nextVertex.y) / 2;
      
      // Add random bulge or indentation
      const bulgeDirection = Math.random() * Math.PI * 2;
      const bulgeMagnitude = (Math.random() - 0.3) * baseSize * 0.3;
      
      const bulgeX = midX + Math.cos(bulgeDirection) * bulgeMagnitude;
      const bulgeY = midY + Math.sin(bulgeDirection) * bulgeMagnitude;
      
      vertices.splice(insertIndex + 1, 0, { x: bulgeX, y: bulgeY });
    }
  }
  
  return vertices;
};

export const getDifficultyConfig = (difficulty: Difficulty, level: number) => {
  const configs = {
    easy: {
      blockCount: Math.min(4 + level, 6),
      minSize: 30,
      maxSize: 60,
      spacing: 1.2, // Closer spacing for more tangled look
    },
    medium: {
      blockCount: Math.min(7 + level, 10),
      minSize: 25,
      maxSize: 55,
      spacing: 1.0, // Even closer for more chaos
    },
    hard: {
      blockCount: Math.min(11 + level, 15),
      minSize: 20,
      maxSize: 50,
      spacing: 0.8, // Very close for maximum tangle
    },
  };
  
  return configs[difficulty];
};
