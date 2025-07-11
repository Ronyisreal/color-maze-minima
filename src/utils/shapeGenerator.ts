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
    easy: { numRegions: 6, minColors: 3, complexity: 0.3 },
    medium: { numRegions: 10, minColors: 4, complexity: 0.5 },
    hard: { numRegions: 15, minColors: 5, complexity: 0.7 }
  };
  
  const config = baseConfigs[difficulty];
  return {
    numRegions: config.numRegions + Math.floor(level / 3),
    minColors: config.minColors,
    complexity: Math.min(config.complexity + (level - 1) * 0.1, 0.9)
  };
};

const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

const generateVoronoiCell = (seed: Point, seeds: Point[], bounds: { width: number; height: number; margin: number }): Point[] => {
  const vertices: Point[] = [];
  const step = 8;
  
  for (let x = bounds.margin; x < bounds.width - bounds.margin; x += step) {
    for (let y = bounds.margin; y < bounds.height - bounds.margin; y += step) {
      const point = { x, y };
      let isClosestToSeed = true;
      const distToSeed = distance(point, seed);
      
      for (const otherSeed of seeds) {
        if (otherSeed !== seed && distance(point, otherSeed) < distToSeed) {
          isClosestToSeed = false;
          break;
        }
      }
      
      if (isClosestToSeed) {
        vertices.push(point);
      }
    }
  }
  
  if (vertices.length === 0) {
    const offset = 30;
    return [
      { x: seed.x - offset, y: seed.y - offset },
      { x: seed.x + offset, y: seed.y - offset },
      { x: seed.x + offset, y: seed.y + offset },
      { x: seed.x - offset, y: seed.y + offset }
    ];
  }
  
  return convexHull(vertices);
};

const convexHull = (points: Point[]): Point[] => {
  if (points.length < 3) return points;
  
  const hull: Point[] = [];
  const sortedPoints = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  
  // Build lower hull
  for (const point of sortedPoints) {
    while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
      hull.pop();
    }
    hull.push(point);
  }
  
  // Build upper hull
  const t = hull.length + 1;
  for (let i = sortedPoints.length - 2; i >= 0; i--) {
    const point = sortedPoints[i];
    while (hull.length >= t && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
      hull.pop();
    }
    hull.push(point);
  }
  
  hull.pop(); // Remove last point as it's the same as the first
  return hull;
};

const cross = (O: Point, A: Point, B: Point): number => {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
};

const calculateCentroid = (vertices: Point[]): Point => {
  const x = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const y = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
  return { x, y };
};

const findAdjacencies = (regions: Region[]): void => {
  const tolerance = 15;
  
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const region1 = regions[i];
      const region2 = regions[j];
      
      let isAdjacent = false;
      
      for (const vertex1 of region1.vertices) {
        for (const vertex2 of region2.vertices) {
          if (distance(vertex1, vertex2) < tolerance) {
            isAdjacent = true;
            break;
          }
        }
        if (isAdjacent) break;
      }
      
      if (isAdjacent) {
        region1.adjacentRegions.push(region2.id);
        region2.adjacentRegions.push(region1.id);
      }
    }
  }
};

export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty): Region[] => {
  const config = getDifficultyConfig(difficulty, 1);
  const margin = 50;
  
  // Create a tangled, messy formation in the center
  const centerX = width / 2;
  const centerY = height / 2;
  const baseRadius = Math.min(width, height) * 0.2; // Base size for the tangled shape
  
  // Generate overlapping, irregular seeds based on difficulty
  const seeds: Point[] = [];
  
  // Difficulty-based overlap and messiness
  const overlapFactors = {
    easy: { overlap: 0.8, messiness: 0.3, clusters: 2 },
    medium: { overlap: 0.6, messiness: 0.5, clusters: 3 },
    hard: { overlap: 0.4, messiness: 0.7, clusters: 4 }
  };
  
  const factor = overlapFactors[difficulty];
  
  // Create overlapping clusters for tangled effect
  for (let cluster = 0; cluster < factor.clusters; cluster++) {
    const clusterSeeds = Math.ceil(config.numRegions / factor.clusters);
    
    // Each cluster has its own center with some offset
    const clusterAngle = (2 * Math.PI * cluster) / factor.clusters;
    const clusterOffset = baseRadius * 0.4 * (Math.random() + 0.5);
    const clusterCenterX = centerX + Math.cos(clusterAngle) * clusterOffset;
    const clusterCenterY = centerY + Math.sin(clusterAngle) * clusterOffset;
    
    for (let i = 0; i < clusterSeeds && seeds.length < config.numRegions; i++) {
      // Create highly irregular positioning
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * baseRadius * factor.overlap;
      
      // Add extreme messiness - random distortions
      const messinessX = (Math.random() - 0.5) * baseRadius * factor.messiness;
      const messinessY = (Math.random() - 0.5) * baseRadius * factor.messiness;
      
      const x = clusterCenterX + Math.cos(angle) * radius + messinessX;
      const y = clusterCenterY + Math.sin(angle) * radius + messinessY;
      
      // Allow some seeds to go beyond normal bounds for overlapping effect
      const clampedX = Math.max(margin * 0.5, Math.min(width - margin * 0.5, x));
      const clampedY = Math.max(margin * 0.5, Math.min(height - margin * 0.5, y));
      
      seeds.push({ x: clampedX, y: clampedY });
    }
  }
  
  // Add some completely random seeds for extra chaos on higher difficulties
  if (difficulty === 'medium' || difficulty === 'hard') {
    const chaosSeeds = difficulty === 'hard' ? 3 : 2;
    for (let i = 0; i < chaosSeeds && seeds.length < config.numRegions; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * baseRadius * 1.2;
      const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * baseRadius;
      const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * baseRadius;
      
      seeds.push({ 
        x: Math.max(margin, Math.min(width - margin, x)),
        y: Math.max(margin, Math.min(height - margin, y))
      });
    }
  }
  
  // Generate irregular Voronoi cells with very loose bounds for overlapping
  const regions: Region[] = [];
  const looseBounds = {
    width: width,
    height: height,
    margin: 0 // No margin to allow maximum irregularity
  };
  
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const vertices = generateIrregularVoronoiCell(seed, seeds, looseBounds, difficulty);
    const center = calculateCentroid(vertices);
    
    regions.push({
      id: `region-${i + 1}`,
      vertices,
      center,
      color: null,
      adjacentRegions: []
    });
  }
  
  // Find adjacencies with very high tolerance for maximum tangling
  const adjacencyTolerance = {
    easy: 35,
    medium: 45,
    hard: 55
  };
  
  findAdjacenciesWithTolerance(regions, adjacencyTolerance[difficulty]);
  
  // Force additional connections for more tangling
  regions.forEach(region => {
    if (region.adjacentRegions.length < 2) {
      // Find closest regions and force connections
      const distances = regions
        .filter(r => r.id !== region.id && !region.adjacentRegions.includes(r.id))
        .map(r => ({ region: r, distance: distance(region.center, r.center) }))
        .sort((a, b) => a.distance - b.distance);
      
      // Connect to 1-2 closest regions for guaranteed tangling
      const connectionsToAdd = Math.min(2, distances.length);
      for (let i = 0; i < connectionsToAdd; i++) {
        const targetRegion = distances[i].region;
        region.adjacentRegions.push(targetRegion.id);
        targetRegion.adjacentRegions.push(region.id);
      }
    }
  });
  
  return regions;
};

const generateIrregularVoronoiCell = (seed: Point, seeds: Point[], bounds: { width: number; height: number; margin: number }, difficulty: Difficulty): Point[] => {
  const vertices: Point[] = [];
  
  // Adjust step size based on difficulty for more/less irregular shapes
  const stepSizes = { easy: 12, medium: 10, hard: 8 };
  const step = stepSizes[difficulty];
  
  for (let x = bounds.margin; x < bounds.width - bounds.margin; x += step) {
    for (let y = bounds.margin; y < bounds.height - bounds.margin; y += step) {
      const point = { x, y };
      let isClosestToSeed = true;
      const distToSeed = distance(point, seed);
      
      for (const otherSeed of seeds) {
        if (otherSeed !== seed && distance(point, otherSeed) < distToSeed) {
          isClosestToSeed = false;
          break;
        }
      }
      
      if (isClosestToSeed) {
        vertices.push(point);
      }
    }
  }
  
  if (vertices.length === 0) {
    // Create very irregular fallback shapes
    const irregularityFactor = { easy: 0.3, medium: 0.5, hard: 0.7 }[difficulty];
    const baseSize = 25;
    const irregularSize = baseSize * (1 + irregularityFactor);
    
    return [
      { x: seed.x - irregularSize + Math.random() * 20, y: seed.y - irregularSize + Math.random() * 20 },
      { x: seed.x + irregularSize - Math.random() * 20, y: seed.y - irregularSize + Math.random() * 20 },
      { x: seed.x + irregularSize - Math.random() * 20, y: seed.y + irregularSize - Math.random() * 20 },
      { x: seed.x - irregularSize + Math.random() * 20, y: seed.y + irregularSize - Math.random() * 20 }
    ];
  }
  
  return convexHull(vertices);
};

const findAdjacenciesWithTolerance = (regions: Region[], tolerance: number): void => {
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const region1 = regions[i];
      const region2 = regions[j];
      
      let isAdjacent = false;
      
      for (const vertex1 of region1.vertices) {
        for (const vertex2 of region2.vertices) {
          if (distance(vertex1, vertex2) < tolerance) {
            isAdjacent = true;
            break;
          }
        }
        if (isAdjacent) break;
      }
      
      if (isAdjacent) {
        region1.adjacentRegions.push(region2.id);
        region2.adjacentRegions.push(region1.id);
      }
    }
  }
};
