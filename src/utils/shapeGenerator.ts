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
  const tolerance = 8; // Reduced tolerance for better connectivity detection
  
  // Check if any vertices are close enough to indicate shared border
  for (const v1 of region1.vertices) {
    for (const v2 of region2.vertices) {
      if (distance(v1, v2) < tolerance) {
        return true;
      }
    }
  }
  
  // Check edge-to-edge proximity for shared borders
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

// Generate regions using proper Voronoi tessellation for connected map-like regions
const generateMapRegions = (width: number, height: number, numRegions: number): Region[] => {
  const regions: Region[] = [];
  const margin = 40;
  const seeds: Point[] = [];
  
  // Generate well-distributed seed points using Poisson disk sampling
  const minDistance = Math.min(width, height) / Math.sqrt(numRegions) * 0.8;
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
  
  // Fill remaining seeds if needed with relaxed constraints
  while (seeds.length < numRegions) {
    const relaxedDistance = minDistance * 0.5;
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
    
    if (!placed) break;
  }
  
  console.log(`Generated ${seeds.length} seeds for ${numRegions} requested regions`);
  
  // Create clean Voronoi cells without organic variation to ensure proper connectivity
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const cellVertices = createCleanVoronoiCell(seed, seeds, width, height);
    
    if (cellVertices.length >= 3) {
      regions.push({
        id: `region-${i + 1}`,
        vertices: cellVertices,
        center: seed,
        color: null,
        adjacentRegions: []
      });
      console.log(`Created region ${i + 1} with ${cellVertices.length} vertices`);
    } else {
      console.warn('Degenerate cell for seed', i, seed, 'vertices:', cellVertices.length);
    }
  }
  
  return regions;
};

// Create a clean Voronoi cell ensuring proper connectivity
const createCleanVoronoiCell = (seed: Point, allSeeds: Point[], width: number, height: number): Point[] => {
  // Start with the bounding rectangle
  let clipVertices: Point[] = [
    { x: 0, y: 0 },
    { x: width, y: 0 },
    { x: width, y: height },
    { x: 0, y: height }
  ];
  
  // Clip against each bisector to create clean Voronoi cell
  for (const otherSeed of allSeeds) {
    if (otherSeed === seed) continue;
    
    clipVertices = clipPolygonByBisector(clipVertices, seed, otherSeed);
    if (clipVertices.length < 3) {
      console.warn('Polygon became degenerate during clipping');
      break;
    }
  }
  
  // Apply minimal smoothing only to prevent jagged edges, but maintain connectivity
  if (clipVertices.length >= 3) {
    return applyMinimalSmoothing(clipVertices);
  }
  
  return clipVertices;
};

// Apply very light smoothing to prevent sharp corners while maintaining connectivity
const applyMinimalSmoothing = (vertices: Point[]): Point[] => {
  if (vertices.length < 4) return vertices; // Don't smooth triangles
  
  const smoothed: Point[] = [];
  const smoothingFactor = 0.1; // Very light smoothing
  
  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    // Apply very light weighted smoothing
    const smoothX = prev.x * smoothingFactor + curr.x * (1 - 2 * smoothingFactor) + next.x * smoothingFactor;
    const smoothY = prev.y * smoothingFactor + curr.y * (1 - 2 * smoothingFactor) + next.y * smoothingFactor;
    
    smoothed.push({ x: smoothX, y: smoothY });
  }
  
  return smoothed;
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
  console.log('Starting robust shape generation...', { width, height, difficulty });
  
  const config = getDifficultyConfig(difficulty, 1);
  
  // Use robust grid-based generation instead of Voronoi
  return generateRobustRegions(width, height, config.numRegions, difficulty);
};

const generateRobustRegions = (width: number, height: number, numRegions: number, difficulty: Difficulty): Region[] => {
  const regions: Region[] = [];
  
  // Create one big interconnected messy structure
  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) * 0.4;
  
  // Generate interconnected regions in a spiral/web pattern
  const angleStep = (2 * Math.PI) / numRegions;
  const radiusStep = maxRadius / Math.ceil(numRegions / 6);
  
  let regionCount = 0;
  
  // Create concentric rings of connected regions
  for (let ring = 0; ring < Math.ceil(numRegions / 6) && regionCount < numRegions; ring++) {
    const ringRadius = (ring + 1) * radiusStep;
    const regionsInRing = ring === 0 ? 1 : Math.min(6 + ring * 2, numRegions - regionCount);
    
    for (let i = 0; i < regionsInRing && regionCount < numRegions; i++) {
      const baseAngle = (i / regionsInRing) * 2 * Math.PI;
      const angleVariation = (Math.random() - 0.5) * 0.3;
      const angle = baseAngle + angleVariation;
      
      const radiusVariation = (Math.random() - 0.5) * radiusStep * 0.4;
      const radius = ring === 0 ? 0 : ringRadius + radiusVariation;
      
      const regionCenterX = centerX + Math.cos(angle) * radius;
      const regionCenterY = centerY + Math.sin(angle) * radius;
      
      // Create messy hand-drawn irregular shapes that overlap
      const vertices = [];
      const numVertices = 5 + Math.floor(Math.random() * 4); // 5-8 vertices
      const baseSize = radiusStep * (0.8 + Math.random() * 0.6); // Overlapping sizes
      
      for (let v = 0; v < numVertices; v++) {
        const vertexAngle = (v / numVertices) * 2 * Math.PI;
        
        // Add significant randomness for hand-drawn messy look
        const radiusVariation = 0.5 + Math.random() * 0.8;
        const angleJitter = (Math.random() - 0.5) * 0.4;
        const vertexRadius = baseSize * radiusVariation;
        
        const x = regionCenterX + Math.cos(vertexAngle + angleJitter) * vertexRadius;
        const y = regionCenterY + Math.sin(vertexAngle + angleJitter) * vertexRadius;
        
        vertices.push({
          x: Math.max(10, Math.min(width - 10, x)),
          y: Math.max(10, Math.min(height - 10, y))
        });
      }
      
      const center = calculateCentroid(vertices);
      
      regions.push({
        id: `region-${regionCount + 1}`,
        vertices,
        center,
        color: null,
        adjacentRegions: []
      });
      
      regionCount++;
    }
  }
  
  // Ensure all regions are connected by making adjacency very generous
  regions.forEach((region, i) => {
    region.adjacentRegions = [];
    for (let j = 0; j < regions.length; j++) {
      if (i !== j && areRegionsConnected(region, regions[j])) {
        region.adjacentRegions.push(regions[j].id);
      }
    }
  });
  
  console.log(`Generated ${regions.length} interconnected messy regions`);
  const regionsWithAdjacencies = regions.filter(r => r.adjacentRegions.length > 0);
  console.log(`Found ${regionsWithAdjacencies.length} regions with adjacencies:`, 
    regionsWithAdjacencies.map(r => `${r.id}:${r.adjacentRegions.length}`).join(', '));
  
  return regions;
};

const areRegionsConnected = (region1: Region, region2: Region): boolean => {
  const tolerance = 50; // Very generous tolerance for interconnected structure
  
  // Check center-to-center distance - much more generous for messy interconnected structure
  const centerDistance = distance(region1.center, region2.center);
  const maxConnectionDistance = Math.min(150, Math.max(
    Math.sqrt(region1.vertices.length) * 30,
    Math.sqrt(region2.vertices.length) * 30
  ));
  
  // If centers are reasonably close, consider them connected
  if (centerDistance < maxConnectionDistance) {
    return true;
  }
  
  // Check if any vertex of region1 is close to any vertex or edge of region2
  for (const vertex1 of region1.vertices) {
    // Check vertex-to-vertex proximity
    for (const vertex2 of region2.vertices) {
      if (distance(vertex1, vertex2) < tolerance) {
        return true;
      }
    }
    
    // Check vertex-to-edge proximity
    for (let i = 0; i < region2.vertices.length; i++) {
      const edgeStart = region2.vertices[i];
      const edgeEnd = region2.vertices[(i + 1) % region2.vertices.length];
      
      if (distancePointToLineSegment(vertex1, edgeStart, edgeEnd) < tolerance) {
        return true;
      }
    }
  }
  
  return false;
};
