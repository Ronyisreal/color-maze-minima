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
  
  // Create a more compact central area for seed placement to ensure centering
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.35; // Use 35% of the smaller dimension
  
  // Generate seeds in a more controlled pattern around the center
  const seeds: Point[] = [];
  
  // Add center seed
  seeds.push({ x: centerX, y: centerY });
  
  // Add seeds in concentric circles around the center
  const numCircles = Math.ceil(Math.sqrt(config.numRegions));
  const remainingSeeds = config.numRegions - 1;
  
  for (let circle = 1; circle <= numCircles && seeds.length < config.numRegions; circle++) {
    const radius = (maxRadius / numCircles) * circle;
    const seedsInCircle = Math.min(
      remainingSeeds - (seeds.length - 1),
      Math.max(4, Math.floor(circle * 2.5))
    );
    
    for (let i = 0; i < seedsInCircle && seeds.length < config.numRegions; i++) {
      const angle = (2 * Math.PI * i) / seedsInCircle;
      // Add some randomness while keeping it centered
      const jitter = radius * 0.3 * config.complexity;
      const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * jitter;
      const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * jitter;
      
      // Ensure seeds stay within bounds
      const clampedX = Math.max(margin, Math.min(width - margin, x));
      const clampedY = Math.max(margin, Math.min(height - margin, y));
      
      seeds.push({ x: clampedX, y: clampedY });
    }
  }
  
  // Generate Voronoi cells
  const regions: Region[] = [];
  
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const vertices = generateVoronoiCell(seed, seeds, { width, height, margin });
    const center = calculateCentroid(vertices);
    
    regions.push({
      id: `region-${i + 1}`,
      vertices,
      center,
      color: null,
      adjacentRegions: []
    });
  }
  
  // Find adjacencies
  findAdjacencies(regions);
  
  // Ensure all regions are connected by adding connections to isolated regions
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
