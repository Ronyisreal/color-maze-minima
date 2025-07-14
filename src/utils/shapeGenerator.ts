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

// Generate regions using Voronoi-like approach for proper map-like adjacency
const generateMapRegions = (width: number, height: number, numRegions: number): Region[] => {
  const regions: Region[] = [];
  const margin = 50;
  const seeds: Point[] = [];
  
  // Generate seed points for regions using better distribution
  for (let i = 0; i < numRegions; i++) {
    let attempts = 0;
    let validSeed = false;
    
    while (!validSeed && attempts < 50) {
      const seed = {
        x: margin + Math.random() * (width - 2 * margin),
        y: margin + Math.random() * (height - 2 * margin)
      };
      
      // Ensure minimum distance between seeds
      const minDistance = Math.min(width, height) / Math.sqrt(numRegions) * 0.8;
      validSeed = seeds.every(existing => distance(seed, existing) >= minDistance);
      
      if (validSeed) {
        seeds.push(seed);
      }
      attempts++;
    }
  }
  
  // If we couldn't place enough seeds, fill remaining with grid-based approach
  while (seeds.length < numRegions) {
    const gridSize = Math.ceil(Math.sqrt(numRegions - seeds.length));
    const cellWidth = (width - 2 * margin) / gridSize;
    const cellHeight = (height - 2 * margin) / gridSize;
    
    for (let row = 0; row < gridSize && seeds.length < numRegions; row++) {
      for (let col = 0; col < gridSize && seeds.length < numRegions; col++) {
        const seed = {
          x: margin + (col + 0.3 + Math.random() * 0.4) * cellWidth,
          y: margin + (row + 0.3 + Math.random() * 0.4) * cellHeight
        };
        
        // Check if this position is too close to existing seeds
        const minDistance = Math.min(cellWidth, cellHeight) * 0.6;
        if (seeds.every(existing => distance(seed, existing) >= minDistance)) {
          seeds.push(seed);
        }
      }
    }
  }
  
  // Create regions using simplified Voronoi approach
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const vertices = generateVoronoiCell(seed, seeds, width, height, margin);
    
    if (vertices.length >= 3) {
      regions.push({
        id: `region-${i + 1}`,
        vertices: vertices,
        center: seed,
        color: null,
        adjacentRegions: []
      });
    }
  }
  
  return regions;
};

// Generate a Voronoi cell for a seed point
const generateVoronoiCell = (seed: Point, allSeeds: Point[], width: number, height: number, margin: number): Point[] => {
  const vertices: Point[] = [];
  const angles: number[] = [];
  
  // Create vertices by finding intersection points
  const numRays = 24; // Number of rays to cast from seed
  
  for (let i = 0; i < numRays; i++) {
    const angle = (2 * Math.PI * i) / numRays;
    const ray = { x: Math.cos(angle), y: Math.sin(angle) };
    
    // Find closest intersection with boundaries or other regions
    let minDistance = Math.min(width, height);
    
    // Check boundaries
    const boundaryIntersections = [
      intersectRayWithBoundary(seed, ray, 0, 0, width, height), // boundaries
    ].filter(p => p !== null) as Point[];
    
    for (const intersection of boundaryIntersections) {
      const dist = distance(seed, intersection);
      minDistance = Math.min(minDistance, dist);
    }
    
    // Check perpendicular bisectors with other seeds
    for (const otherSeed of allSeeds) {
      if (otherSeed === seed) continue;
      
      const bisectorIntersection = intersectRayWithPerpBisector(seed, ray, seed, otherSeed);
      if (bisectorIntersection) {
        const dist = distance(seed, bisectorIntersection);
        if (dist > 10 && dist < minDistance) { // Minimum distance check
          minDistance = dist;
        }
      }
    }
    
    // Create vertex at the intersection point
    const vertex = {
      x: seed.x + ray.x * minDistance * 0.9, // Slightly reduce to avoid edge issues
      y: seed.y + ray.y * minDistance * 0.9
    };
    
    vertices.push(vertex);
    angles.push(angle);
  }
  
  // Sort vertices by angle and remove duplicates
  const sortedVertices = vertices
    .map((v, i) => ({ vertex: v, angle: angles[i] }))
    .sort((a, b) => a.angle - b.angle)
    .map(item => item.vertex);
  
  // Remove vertices that are too close to each other
  const filteredVertices: Point[] = [];
  const minVertexDistance = 15;
  
  for (let i = 0; i < sortedVertices.length; i++) {
    const current = sortedVertices[i];
    const next = sortedVertices[(i + 1) % sortedVertices.length];
    
    if (distance(current, next) >= minVertexDistance) {
      filteredVertices.push(current);
    }
  }
  
  return filteredVertices.length >= 3 ? filteredVertices : [];
};

// Intersect ray with rectangular boundary
const intersectRayWithBoundary = (origin: Point, ray: Point, x1: number, y1: number, x2: number, y2: number): Point | null => {
  const intersections: Point[] = [];
  
  // Check intersection with each boundary
  const boundaries = [
    { start: { x: x1, y: y1 }, end: { x: x2, y: y1 } }, // top
    { start: { x: x2, y: y1 }, end: { x: x2, y: y2 } }, // right
    { start: { x: x2, y: y2 }, end: { x: x1, y: y2 } }, // bottom
    { start: { x: x1, y: y2 }, end: { x: x1, y: y1 } }  // left
  ];
  
  for (const boundary of boundaries) {
    const intersection = intersectRayWithSegment(origin, ray, boundary.start, boundary.end);
    if (intersection) {
      intersections.push(intersection);
    }
  }
  
  // Return the closest intersection
  if (intersections.length === 0) return null;
  
  return intersections.reduce((closest, current) => {
    const closestDist = distance(origin, closest);
    const currentDist = distance(origin, current);
    return currentDist < closestDist ? current : closest;
  });
};

// Intersect ray with line segment
const intersectRayWithSegment = (rayOrigin: Point, rayDirection: Point, segStart: Point, segEnd: Point): Point | null => {
  const dx1 = rayDirection.x;
  const dy1 = rayDirection.y;
  const dx2 = segEnd.x - segStart.x;
  const dy2 = segEnd.y - segStart.y;
  
  const determinant = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(determinant) < 1e-10) return null; // Parallel lines
  
  const dx3 = rayOrigin.x - segStart.x;
  const dy3 = rayOrigin.y - segStart.y;
  
  const t1 = (dx2 * dy3 - dy2 * dx3) / determinant;
  const t2 = (dx1 * dy3 - dy1 * dx3) / determinant;
  
  if (t1 >= 0 && t2 >= 0 && t2 <= 1) {
    return {
      x: rayOrigin.x + t1 * dx1,
      y: rayOrigin.y + t1 * dy1
    };
  }
  
  return null;
};

// Intersect ray with perpendicular bisector of two points
const intersectRayWithPerpBisector = (rayOrigin: Point, rayDirection: Point, point1: Point, point2: Point): Point | null => {
  // Perpendicular bisector passes through midpoint and is perpendicular to line between points
  const midpoint = {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2
  };
  
  const lineVector = { x: point2.x - point1.x, y: point2.y - point1.y };
  const perpVector = { x: -lineVector.y, y: lineVector.x }; // Perpendicular vector
  
  // Find intersection of ray with perpendicular bisector line
  const determinant = rayDirection.x * perpVector.y - rayDirection.y * perpVector.x;
  if (Math.abs(determinant) < 1e-10) return null; // Parallel
  
  const dx = midpoint.x - rayOrigin.x;
  const dy = midpoint.y - rayOrigin.y;
  
  const t = (dx * perpVector.y - dy * perpVector.x) / determinant;
  
  if (t >= 0) {
    return {
      x: rayOrigin.x + t * rayDirection.x,
      y: rayOrigin.y + t * rayDirection.y
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
