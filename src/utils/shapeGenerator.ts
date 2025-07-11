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
  
  // Create a compact, brain-like formation in the center
  const centerX = width / 2;
  const centerY = height / 2;
  const formationRadius = Math.min(width, height) * 0.15; // Much smaller, more compact
  
  // Generate seeds in a dense, brain-like pattern
  const seeds: Point[] = [];
  
  // Create multiple concentric layers for brain-like complexity
  const layers = 3;
  const seedsPerLayer = Math.ceil(config.numRegions / layers);
  
  for (let layer = 0; layer < layers && seeds.length < config.numRegions; layer++) {
    const layerRadius = formationRadius * (0.3 + layer * 0.35); // Varying layer distances
    const numSeeds = Math.min(seedsPerLayer, config.numRegions - seeds.length);
    
    for (let i = 0; i < numSeeds; i++) {
      // Create irregular angular distribution for organic look
      const baseAngle = (2 * Math.PI * i) / numSeeds;
      const angleVariation = (Math.random() - 0.5) * 0.8; // Random angle variation
      const angle = baseAngle + angleVariation;
      
      // Variable radius within the layer for organic shape
      const radiusVariation = (Math.random() - 0.5) * layerRadius * 0.4;
      const radius = layerRadius + radiusVariation;
      
      // Add organic jitter for brain-like irregularity
      const jitterAmount = formationRadius * 0.2;
      const jitterX = (Math.random() - 0.5) * jitterAmount;
      const jitterY = (Math.random() - 0.5) * jitterAmount;
      
      const x = centerX + Math.cos(angle) * radius + jitterX;
      const y = centerY + Math.sin(angle) * radius + jitterY;
      
      // Ensure seeds stay within reasonable bounds but allow some organic spread
      const clampedX = Math.max(margin, Math.min(width - margin, x));
      const clampedY = Math.max(margin, Math.min(height - margin, y));
      
      seeds.push({ x: clampedX, y: clampedY });
    }
  }
  
  // Add a few random seeds in the core for extra complexity
  const coreSeeds = Math.min(3, config.numRegions - seeds.length);
  for (let i = 0; i < coreSeeds; i++) {
    const coreRadius = formationRadius * 0.2;
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * coreRadius;
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    seeds.push({ x, y });
  }
  
  // Generate Voronoi cells with compact bounds
  const regions: Region[] = [];
  const compactBounds = {
    width: centerX + formationRadius * 1.5,
    height: centerY + formationRadius * 1.5,
    margin: centerX - formationRadius * 1.5
  };
  
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const vertices = generateVoronoiCell(seed, seeds, compactBounds);
    const center = calculateCentroid(vertices);
    
    regions.push({
      id: `region-${i + 1}`,
      vertices,
      center,
      color: null,
      adjacentRegions: []
    });
  }
  
  // Find adjacencies with moderate tolerance for brain-like connectivity
  findAdjacenciesWithTolerance(regions, 25);
  
  // Ensure connectivity by connecting isolated regions
  const isolated = regions.filter(r => r.adjacentRegions.length === 0);
  isolated.forEach(region => {
    const closest = regions
      .filter(r => r.id !== region.id)
      .reduce((min, r) => {
        const dist = distance(region.center, r.center);
        return dist < distance(region.center, min.center) ? r : min;
      });
    
    region.adjacentRegions.push(closest.id);
    closest.adjacentRegions.push(region.id);
  });
  
  return regions;
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
