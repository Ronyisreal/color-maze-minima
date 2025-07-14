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
    easy: { numRegions: 4 + Math.floor(Math.random() * 3), minColors: 3, complexity: 0.3 }, // 4-6 regions
    medium: { numRegions: 7 + Math.floor(Math.random() * 4), minColors: 4, complexity: 0.5 }, // 7-10 regions
    hard: { numRegions: 11 + Math.floor(Math.random() * 5), minColors: 5, complexity: 0.7 } // 11-15 regions
  };
  
  const config = baseConfigs[difficulty];
  return {
    numRegions: config.numRegions,
    minColors: config.minColors,
    complexity: Math.min(config.complexity + (level - 1) * 0.05, 0.9)
  };
};

const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

const calculateCentroid = (vertices: Point[]): Point => {
  const x = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const y = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
  return { x, y };
};

const distancePointToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }
  
  const param = dot / lenSq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// Check if two regions actually share a border (have overlapping edges)
const doRegionsShareBorder = (region1: Region, region2: Region): boolean => {
  const tolerance = 15; // Tolerance for connection detection
  
  // Check if any vertices are close enough to indicate shared border
  for (const v1 of region1.vertices) {
    for (const v2 of region2.vertices) {
      if (distance(v1, v2) < tolerance) {
        return true;
      }
    }
  }
  
  // Also check edge-to-edge proximity
  for (let i = 0; i < region1.vertices.length; i++) {
    const edge1Start = region1.vertices[i];
    const edge1End = region1.vertices[(i + 1) % region1.vertices.length];
    
    for (let j = 0; j < region2.vertices.length; j++) {
      const edge2Start = region2.vertices[j];
      const edge2End = region2.vertices[(j + 1) % region2.vertices.length];
      
      if (edgeToEdgeDistance(edge1Start, edge1End, edge2Start, edge2End) < tolerance) {
        return true;
      }
    }
  }
  
  return false;
};

// Calculate minimum distance between two line segments
const edgeToEdgeDistance = (
  line1Start: Point, line1End: Point,
  line2Start: Point, line2End: Point
): number => {
  const distances = [
    distancePointToLineSegment(line1Start, line2Start, line2End),
    distancePointToLineSegment(line1End, line2Start, line2End),
    distancePointToLineSegment(line2Start, line1Start, line1End),
    distancePointToLineSegment(line2End, line1Start, line1End)
  ];
  
  return Math.min(...distances);
};

const findAdjacencies = (regions: Region[]): void => {
  // Clear existing adjacencies
  regions.forEach(region => {
    region.adjacentRegions = [];
  });
  
  // Find all adjacencies based on shared borders
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const region1 = regions[i];
      const region2 = regions[j];
      
      if (doRegionsShareBorder(region1, region2)) {
        region1.adjacentRegions.push(region2.id);
        region2.adjacentRegions.push(region1.id);
      }
    }
  }
};

// Generate regions using Voronoi diagram for proper map-like tessellation
const generateMapRegions = (width: number, height: number, numRegions: number): Region[] => {
  const regions: Region[] = [];
  const margin = 60;
  const seeds: Point[] = [];
  
  // Generate well-distributed seed points using Poisson disk sampling
  const minDistance = Math.min(width, height) / Math.sqrt(numRegions) * 0.7;
  let attempts = 0;
  
  while (seeds.length < numRegions && attempts < numRegions * 50) {
    const candidate = {
      x: margin + Math.random() * (width - 2 * margin),
      y: margin + Math.random() * (height - 2 * margin)
    };
    
    // Check minimum distance to existing seeds
    let validSeed = true;
    for (const seed of seeds) {
      if (distance(candidate, seed) < minDistance) {
        validSeed = false;
        break;
      }
    }
    
    if (validSeed) {
      seeds.push(candidate);
    }
    attempts++;
  }
  
  // Fill remaining seeds with relaxed constraints if needed
  while (seeds.length < numRegions) {
    const relaxedDistance = minDistance * 0.6;
    let placed = false;
    
    for (let attempt = 0; attempt < 100 && !placed; attempt++) {
      const candidate = {
        x: margin + Math.random() * (width - 2 * margin),
        y: margin + Math.random() * (height - 2 * margin)
      };
      
      let validSeed = true;
      for (const seed of seeds) {
        if (distance(candidate, seed) < relaxedDistance) {
          validSeed = false;
          break;
        }
      }
      
      if (validSeed) {
        seeds.push(candidate);
        placed = true;
      }
    }
    
    if (!placed) break; // Prevent infinite loop
  }
  
  // Create Voronoi cells for each seed
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const cellVertices = createVoronoiCell(seed, seeds, width, height);
    
    if (cellVertices.length >= 3) {
      regions.push({
        id: `region-${i + 1}`,
        vertices: cellVertices,
        center: seed,
        color: null,
        adjacentRegions: []
      });
    }
  }
  
  return regions;
};

// Create a Voronoi cell using the half-plane intersection method
const createVoronoiCell = (seed: Point, allSeeds: Point[], width: number, height: number): Point[] => {
  // Start with the bounding rectangle
  let clipVertices: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];
  
  // Clip against each bisector
  for (const otherSeed of allSeeds) {
    if (otherSeed === seed) continue;
    
    clipVertices = clipPolygonByBisector(clipVertices, seed, otherSeed);
    if (clipVertices.length < 3) break; // Polygon too small
  }
  
  return clipVertices;
};

// Clip polygon by perpendicular bisector using Sutherland-Hodgman algorithm
const clipPolygonByBisector = (vertices: Point[], seed1: Point, seed2: Point): Point[] => {
  if (vertices.length === 0) return [];
  
  // Calculate perpendicular bisector
  const midpoint = {
    x: (seed1.x + seed2.x) / 2,
    y: (seed1.y + seed2.y) / 2
  };
  
  const normal = {
    x: seed2.x - seed1.x,
    y: seed2.y - seed1.y
  };
  
  const result: Point[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    const currentSide = isPointOnSide(current, midpoint, normal, seed1);
    const nextSide = isPointOnSide(next, midpoint, normal, seed1);
    
    if (currentSide) {
      if (!nextSide) {
        // Leaving the valid side - add intersection
        const intersection = findBisectorIntersection(current, next, midpoint, normal);
        if (intersection) result.push(intersection);
      }
    } else {
      if (nextSide) {
        // Entering the valid side - add intersection and next point
        const intersection = findBisectorIntersection(current, next, midpoint, normal);
        if (intersection) result.push(intersection);
        result.push(next);
      }
    }
  }
  
  return result;
};

// Check which side of bisector a point is on (closer to seed1 or seed2)
const isPointOnSide = (point: Point, bisectorPoint: Point, bisectorNormal: Point, seed1: Point): boolean => {
  // Check if point is on the same side as seed1
  const toPoint = { x: point.x - bisectorPoint.x, y: point.y - bisectorPoint.y };
  const toSeed1 = { x: seed1.x - bisectorPoint.x, y: seed1.y - bisectorPoint.y };
  
  const pointDot = toPoint.x * bisectorNormal.x + toPoint.y * bisectorNormal.y;
  const seed1Dot = toSeed1.x * bisectorNormal.x + toSeed1.y * bisectorNormal.y;
  
  return pointDot * seed1Dot >= 0;
};

// Find intersection of line segment with bisector
const findBisectorIntersection = (p1: Point, p2: Point, bisectorPoint: Point, bisectorNormal: Point): Point | null => {
  const lineDir = { x: p2.x - p1.x, y: p2.y - p1.y };
  const lineLength = Math.sqrt(lineDir.x * lineDir.x + lineDir.y * lineDir.y);
  
  if (lineLength === 0) return null;
  
  // Normalize line direction
  lineDir.x /= lineLength;
  lineDir.y /= lineLength;
  
  // Find intersection parameter
  const denominator = lineDir.x * bisectorNormal.x + lineDir.y * bisectorNormal.y;
  if (Math.abs(denominator) < 1e-10) return null; // Parallel
  
  const toBisector = { x: bisectorPoint.x - p1.x, y: bisectorPoint.y - p1.y };
  const t = (toBisector.x * bisectorNormal.x + toBisector.y * bisectorNormal.y) / denominator;
  
  // Check if intersection is within line segment
  if (t >= 0 && t <= lineLength) {
    return {
      x: p1.x + t * lineDir.x,
      y: p1.y + t * lineDir.y
    };
  }
  
  return null;
};

export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty): Region[] => {
  const config = getDifficultyConfig(difficulty, 1);
  
  // Generate proper map-like regions using Voronoi approach
  const regions = generateMapRegions(width, height, config.numRegions);
  
  // Find adjacencies between regions
  findAdjacencies(regions);
  
  // Ensure connectivity - connect isolated regions
  regions.forEach(region => {
    if (region.adjacentRegions.length === 0) {
      let closestRegion: Region | null = null;
      let minDistance = Infinity;
      
      regions.forEach(otherRegion => {
        if (otherRegion.id !== region.id) {
          const dist = distance(region.center, otherRegion.center);
          if (dist < minDistance) {
            minDistance = dist;
            closestRegion = otherRegion;
          }
        }
      });
      
      if (closestRegion) {
        region.adjacentRegions.push(closestRegion.id);
        closestRegion.adjacentRegions.push(region.id);
      }
    }
  });
  
  return regions;
};
