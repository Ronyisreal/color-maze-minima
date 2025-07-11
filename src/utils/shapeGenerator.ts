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
  const margin = 100; // Margin to keep shapes away from edges
  
  // Create a central tangled formation
  const centerX = width / 2;
  const centerY = height / 2;
  const formationRadius = Math.min(width, height) * 0.2; // Compact formation
  
  // Generate seeds in a dense, overlapping pattern for tangled effect
  const seeds: Point[] = [];
  
  // Add center seed
  seeds.push({ x: centerX, y: centerY });
  
  // Create multiple overlapping clusters to achieve tangled effect
  const numClusters = Math.ceil(config.numRegions / 4);
  
  for (let cluster = 0; cluster < numClusters && seeds.length < config.numRegions; cluster++) {
    // Each cluster has a slightly offset center
    const clusterAngle = (2 * Math.PI * cluster) / numClusters;
    const clusterOffset = formationRadius * 0.3;
    const clusterCenterX = centerX + Math.cos(clusterAngle) * clusterOffset;
    const clusterCenterY = centerY + Math.sin(clusterAngle) * clusterOffset;
    
    // Generate seeds around each cluster center
    const seedsPerCluster = Math.min(5, config.numRegions - seeds.length);
    
    for (let i = 0; i < seedsPerCluster; i++) {
      const angle = (2 * Math.PI * i) / seedsPerCluster + cluster * 0.5; // Add rotation offset
      const radius = formationRadius * (0.3 + Math.random() * 0.4); // Varying distances
      
      // High jitter for irregular, tangled shapes
      const jitter = formationRadius * 0.4 * config.complexity;
      const x = clusterCenterX + Math.cos(angle) * radius + (Math.random() - 0.5) * jitter;
      const y = clusterCenterY + Math.sin(angle) * radius + (Math.random() - 0.5) * jitter;
      
      // Ensure seeds stay within bounds
      const clampedX = Math.max(margin, Math.min(width - margin, x));
      const clampedY = Math.max(margin, Math.min(height - margin, y));
      
      seeds.push({ x: clampedX, y: clampedY });
    }
  }
  
  // Fill remaining seeds with random placement in the formation area
  while (seeds.length < config.numRegions) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * formationRadius;
    const jitter = formationRadius * 0.3;
    
    const x = centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * jitter;
    const y = centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * jitter;
    
    const clampedX = Math.max(margin, Math.min(width - margin, x));
    const clampedY = Math.max(margin, Math.min(height - margin, y));
    
    seeds.push({ x: clampedX, y: clampedY });
  }
  
  // Generate Voronoi cells with tighter bounds for more tangled effect
  const regions: Region[] = [];
  
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const vertices = generateVoronoiCell(seed, seeds, { width, height, margin: margin * 0.5 });
    const center = calculateCentroid(vertices);
    
    regions.push({
      id: `region-${i + 1}`,
      vertices,
      center,
      color: null,
      adjacentRegions: []
    });
  }
  
  // Find adjacencies with increased tolerance for more connections (tangled effect)
  findAdjacenciesWithTolerance(regions, 20);
  
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
