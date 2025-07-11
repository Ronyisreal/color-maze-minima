export interface Point {
  x: number;
  y: number;
}

export interface Region {
  id: string;
  vertices: Point[];
  center: Point;
  color: string | null;
  adjacentRegions: string[];
}

export interface DifficultyConfig {
  numRegions: number;
  minColors: number;
  complexity: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const getDifficultyConfig = (difficulty: Difficulty, level: number): DifficultyConfig => {
  const baseConfigs = {
    easy: { numRegions: 8, minColors: 3, complexity: 0.3 },
    medium: { numRegions: 12, minColors: 4, complexity: 0.5 },
    hard: { numRegions: 16, minColors: 5, complexity: 0.7 }
  };
  
  const config = baseConfigs[difficulty];
  return {
    numRegions: config.numRegions + Math.floor(level / 2),
    minColors: config.minColors,
    complexity: Math.min(config.complexity + (level - 1) * 0.05, 0.9)
  };
};

const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

// Generate organic, curved shapes similar to the reference image
const generateOrganicShape = (center: Point, size: number, complexity: number): Point[] => {
  const vertices: Point[] = [];
  const numPoints = 16 + Math.floor(complexity * 12); // More points for smoother curves
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    
    // Create organic variation in radius
    const baseRadius = size * (0.6 + Math.random() * 0.4);
    const organicVariation = Math.sin(angle * 3 + Math.random() * Math.PI) * size * 0.3;
    const radius = baseRadius + organicVariation;
    
    // Add some noise for more organic feel
    const noise = (Math.random() - 0.5) * size * 0.2;
    
    const x = center.x + Math.cos(angle) * (radius + noise);
    const y = center.y + Math.sin(angle) * (radius + noise);
    
    vertices.push({ x, y });
  }
  
  return smoothVertices(vertices);
};

// Smooth vertices to create more organic curves
const smoothVertices = (vertices: Point[]): Point[] => {
  const smoothed: Point[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    // Apply simple smoothing
    const smoothX = (prev.x + curr.x * 2 + next.x) / 4;
    const smoothY = (prev.y + curr.y * 2 + next.y) / 4;
    
    smoothed.push({ x: smoothX, y: smoothY });
  }
  
  return smoothed;
};

const calculateCentroid = (vertices: Point[]): Point => {
  const x = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const y = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
  return { x, y };
};

// Check if two organic shapes overlap or are adjacent
const areShapesAdjacent = (shape1: Point[], shape2: Point[], tolerance: number): boolean => {
  for (const p1 of shape1) {
    for (const p2 of shape2) {
      if (distance(p1, p2) < tolerance) {
        return true;
      }
    }
  }
  return false;
};

const findAdjacencies = (regions: Region[], tolerance: number): void => {
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const region1 = regions[i];
      const region2 = regions[j];
      
      if (areShapesAdjacent(region1.vertices, region2.vertices, tolerance)) {
        region1.adjacentRegions.push(region2.id);
        region2.adjacentRegions.push(region1.id);
      }
    }
  }
};

export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty): Region[] => {
  const config = getDifficultyConfig(difficulty, 1);
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Create a smaller, more concentrated formation
  const formationRadius = Math.min(width, height) * 0.25;
  
  // Size settings based on difficulty
  const sizeFactor = {
    easy: { base: 45, variation: 0.3, overlap: 0.7 },
    medium: { base: 35, variation: 0.4, overlap: 0.6 },
    hard: { base: 25, variation: 0.5, overlap: 0.5 }
  }[difficulty];
  
  const regions: Region[] = [];
  const attempts = config.numRegions * 3; // Multiple attempts to place shapes
  
  for (let attempt = 0; attempt < attempts && regions.length < config.numRegions; attempt++) {
    // Create more clustered positioning
    const angle = Math.random() * 2 * Math.PI;
    const radiusFromCenter = Math.random() * formationRadius * sizeFactor.overlap;
    
    // Add some clustering bias towards existing shapes
    let targetX = centerX + Math.cos(angle) * radiusFromCenter;
    let targetY = centerY + Math.sin(angle) * radiusFromCenter;
    
    // If we have existing regions, sometimes cluster near them
    if (regions.length > 0 && Math.random() < 0.6) {
      const existingRegion = regions[Math.floor(Math.random() * regions.length)];
      const clusterDistance = sizeFactor.base * (0.8 + Math.random() * 0.4);
      const clusterAngle = Math.random() * 2 * Math.PI;
      
      targetX = existingRegion.center.x + Math.cos(clusterAngle) * clusterDistance;
      targetY = existingRegion.center.y + Math.sin(clusterAngle) * clusterDistance;
    }
    
    // Keep within reasonable bounds
    targetX = Math.max(100, Math.min(width - 100, targetX));
    targetY = Math.max(100, Math.min(height - 100, targetY));
    
    const center = { x: targetX, y: targetY };
    const baseSize = sizeFactor.base * (1 + (Math.random() - 0.5) * sizeFactor.variation);
    
    // Check if this position would create too much overlap with existing shapes
    let tooMuchOverlap = false;
    for (const existingRegion of regions) {
      const dist = distance(center, existingRegion.center);
      if (dist < baseSize * 0.4) { // Prevent excessive overlap
        tooMuchOverlap = true;
        break;
      }
    }
    
    if (!tooMuchOverlap) {
      const vertices = generateOrganicShape(center, baseSize, config.complexity);
      const actualCenter = calculateCentroid(vertices);
      
      regions.push({
        id: `region-${regions.length + 1}`,
        vertices,
        center: actualCenter,
        color: null,
        adjacentRegions: []
      });
    }
  }
  
  // Find adjacencies with appropriate tolerance
  const adjacencyTolerance = {
    easy: 25,
    medium: 30,
    hard: 35
  }[difficulty];
  
  findAdjacencies(regions, adjacencyTolerance);
  
  // Ensure minimum connectivity
  regions.forEach(region => {
    if (region.adjacentRegions.length === 0) {
      // Find the closest region and force a connection
      let closestRegion: Region | null = null;
      let minDistance = Infinity;
      
      for (const otherRegion of regions) {
        if (otherRegion.id !== region.id) {
          const dist = distance(region.center, otherRegion.center);
          if (dist < minDistance) {
            minDistance = dist;
            closestRegion = otherRegion;
          }
        }
      }
      
      if (closestRegion) {
        region.adjacentRegions.push(closestRegion.id);
        closestRegion.adjacentRegions.push(region.id);
      }
    }
  });
  
  return regions;
};
