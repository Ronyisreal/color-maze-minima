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

// Generate brain-like shapes that can connect to other regions
const generateOrganicShape = (center: Point, size: number, complexity: number, shapeIndex: number): Point[] => {
  const vertices: Point[] = [];
  const numPoints = 12 + Math.floor(complexity * 8);
  
  // Create unique patterns for each shape based on index
  const patternSeed = shapeIndex * 13;
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    
    // Base radius with controlled variation
    const baseRadius = size * (0.7 + Math.sin(patternSeed + i) * 0.1);
    
    // Create unique brain-like patterns for each region
    const pattern1 = Math.sin(angle * (2 + shapeIndex % 3)) * size * (0.12 + shapeIndex * 0.01);
    const pattern2 = Math.cos(angle * (3 + shapeIndex % 4)) * size * (0.08 + shapeIndex * 0.01);
    
    const organicVariation = pattern1 + pattern2;
    const radius = baseRadius + organicVariation;
    
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    
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

// Generate a connected region that shares exact borders with an existing region
const generateConnectedRegion = (existingRegion: Region, size: number, complexity: number, shapeIndex: number, boardWidth: number, boardHeight: number): Point[] | null => {
  const vertices = existingRegion.vertices;
  const numVertices = vertices.length;
  
  // Try multiple edge segments to find a good connection point
  for (let attempts = 0; attempts < 8; attempts++) {
    const edgeIndex = Math.floor(Math.random() * numVertices);
    const edgeStart = vertices[edgeIndex];
    const edgeEnd = vertices[(edgeIndex + 1) % numVertices];
    
    // Calculate edge vector and normal
    const edgeVector = { x: edgeEnd.x - edgeStart.x, y: edgeEnd.y - edgeStart.y };
    const edgeLength = Math.sqrt(edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y);
    
    if (edgeLength < 20) continue; // Skip very short edges
    
    // Calculate outward normal
    const edgeNormal = { x: -edgeVector.y / edgeLength, y: edgeVector.x / edgeLength };
    
    // Determine which side is outward
    const edgeMidpoint = {
      x: (edgeStart.x + edgeEnd.x) / 2,
      y: (edgeStart.y + edgeEnd.y) / 2
    };
    
    const toCenter = { 
      x: existingRegion.center.x - edgeMidpoint.x, 
      y: existingRegion.center.y - edgeMidpoint.y 
    };
    const dotProduct = edgeNormal.x * toCenter.x + edgeNormal.y * toCenter.y;
    
    if (dotProduct > 0) {
      edgeNormal.x = -edgeNormal.x;
      edgeNormal.y = -edgeNormal.y;
    }
    
    // Position new region center
    const centerDistance = size * 0.7;
    const newCenter = {
      x: edgeMidpoint.x + edgeNormal.x * centerDistance,
      y: edgeMidpoint.y + edgeNormal.y * centerDistance
    };
    
    // Check bounds with better margins
    const margin = size * 0.8;
    if (newCenter.x < margin || newCenter.x > boardWidth - margin ||
        newCenter.y < margin || newCenter.y > boardHeight - margin) {
      continue;
    }
    
    // Generate new region shape
    const newVertices = generateOrganicShape(newCenter, size, complexity, shapeIndex);
    
    // Force shared border by replacing some vertices of new region with existing edge
    const sharedVertices = createSharedBorder(newVertices, edgeStart, edgeEnd, newCenter);
    
    return sharedVertices;
  }
  
  return null;
};

// Create a shared border between regions by aligning vertices
const createSharedBorder = (newVertices: Point[], sharedEdgeStart: Point, sharedEdgeEnd: Point, regionCenter: Point): Point[] => {
  const result: Point[] = [];
  
  // Find vertices that should be part of the shared edge
  const edgeVector = { x: sharedEdgeEnd.x - sharedEdgeStart.x, y: sharedEdgeEnd.y - sharedEdgeStart.y };
  const edgeLength = Math.sqrt(edgeVector.x * edgeVector.x + edgeVector.y * edgeVector.y);
  
  if (edgeLength === 0) return newVertices;
  
  const normalizedEdge = { x: edgeVector.x / edgeLength, y: edgeVector.y / edgeLength };
  
  // Find vertices close to the shared edge line
  const sharedVertexIndices: number[] = [];
  const tolerance = 30;
  
  newVertices.forEach((vertex, index) => {
    const distToEdge = distancePointToLineSegment(vertex, sharedEdgeStart, sharedEdgeEnd);
    if (distToEdge < tolerance) {
      sharedVertexIndices.push(index);
    }
  });
  
  // If we found vertices near the shared edge, replace them with points along the shared edge
  if (sharedVertexIndices.length >= 2) {
    const sortedIndices = sharedVertexIndices.sort((a, b) => a - b);
    
    // Create the shared edge points
    const numSharedPoints = Math.min(4, sortedIndices.length);
    const sharedPoints: Point[] = [];
    
    for (let i = 0; i < numSharedPoints; i++) {
      const t = i / (numSharedPoints - 1);
      sharedPoints.push({
        x: sharedEdgeStart.x + t * edgeVector.x,
        y: sharedEdgeStart.y + t * edgeVector.y
      });
    }
    
    // Replace the vertices
    for (let i = 0; i < newVertices.length; i++) {
      if (sortedIndices.includes(i)) {
        const sharedPointIndex = sortedIndices.indexOf(i);
        if (sharedPointIndex < sharedPoints.length) {
          result.push(sharedPoints[sharedPointIndex]);
        } else {
          result.push(newVertices[i]);
        }
      } else {
        result.push(newVertices[i]);
      }
    }
    
    return result;
  }
  
  return newVertices;
};

// Check if two regions actually share a border (have overlapping edges)
const doRegionsShareBorder = (region1: Region, region2: Region): boolean => {
  const tolerance = 15; // Increased tolerance for better connection detection
  
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

export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty): Region[] => {
  const config = getDifficultyConfig(difficulty, 1);
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Size configuration for connected regions
  const sizeFactor = {
    easy: { base: 100, variation: 0.2 },
    medium: { base: 85, variation: 0.3 },
    hard: { base: 70, variation: 0.4 }
  }[difficulty];
  
  const regions: Region[] = [];
  
  // Start with one central region
  const centralSize = sizeFactor.base * (1 + (Math.random() - 0.5) * sizeFactor.variation);
  const centralVertices = generateOrganicShape({ x: centerX, y: centerY }, centralSize, config.complexity, 0);
  const centralCenter = calculateCentroid(centralVertices);
  
  regions.push({
    id: 'region-1',
    vertices: centralVertices,
    center: centralCenter,
    color: null,
    adjacentRegions: []
  });
  
  // Generate connected regions
  let attempts = 0;
  const maxAttempts = config.numRegions * 5;
  
  while (regions.length < config.numRegions && attempts < maxAttempts) {
    attempts++;
    
    // Pick a random existing region to connect to
    const existingRegion = regions[Math.floor(Math.random() * regions.length)];
    const newSize = sizeFactor.base * (1 + (Math.random() - 0.5) * sizeFactor.variation);
    
    const newVertices = generateConnectedRegion(
      existingRegion, 
      newSize, 
      config.complexity, 
      regions.length,
      width,
      height
    );
    
    if (newVertices) {
      const newCenter = calculateCentroid(newVertices);
      
      regions.push({
        id: `region-${regions.length + 1}`,
        vertices: newVertices,
        center: newCenter,
        color: null,
        adjacentRegions: []
      });
    }
  }
  
  // If we didn't generate enough regions, fill in with nearby regions
  while (regions.length < config.numRegions) {
    const existingRegion = regions[Math.floor(Math.random() * regions.length)];
    const angle = Math.random() * 2 * Math.PI;
    const distance = sizeFactor.base * 1.2;
    
    const newCenter = {
      x: Math.max(sizeFactor.base, Math.min(width - sizeFactor.base, 
          existingRegion.center.x + Math.cos(angle) * distance)),
      y: Math.max(sizeFactor.base, Math.min(height - sizeFactor.base, 
          existingRegion.center.y + Math.sin(angle) * distance))
    };
    
    const newSize = sizeFactor.base * (1 + (Math.random() - 0.5) * sizeFactor.variation);
    const newVertices = generateOrganicShape(newCenter, newSize, config.complexity, regions.length);
    const actualCenter = calculateCentroid(newVertices);
    
    regions.push({
      id: `region-${regions.length + 1}`,
      vertices: newVertices,
      center: actualCenter,
      color: null,
      adjacentRegions: []
    });
  }
  
  // Find all adjacencies
  findAdjacencies(regions);
  
  // Ensure every region has at least one connection
  regions.forEach(region => {
    if (region.adjacentRegions.length === 0) {
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
