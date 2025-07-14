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

// Generate brain-like regions with folded, convoluted boundaries
const generateBrainLikeRegions = (width: number, height: number, numRegions: number, complexity: number): Region[] => {
  const regions: Region[] = [];
  const margin = 40;
  
  // Start with a central brain region
  const centerX = width / 2;
  const centerY = height / 2;
  const baseSize = Math.min(width, height) / (Math.sqrt(numRegions) * 1.2);
  
  // Create the first region as a central brain fold
  const firstRegion = generateBrainFoldShape({ x: centerX, y: centerY }, baseSize, complexity, 0);
  regions.push({
    id: 'region-1',
    vertices: firstRegion,
    center: calculateCentroid(firstRegion),
    color: null,
    adjacentRegions: []
  });
  
  // Generate additional regions that grow from existing ones like brain tissue
  for (let i = 1; i < numRegions; i++) {
    let bestRegion: Point[] | null = null;
    let attempts = 0;
    
    while (!bestRegion && attempts < 40) {
      attempts++;
      
      // Pick a random existing region to grow from
      const existingRegion = regions[Math.floor(Math.random() * regions.length)];
      
      // Find a suitable connection point (prefer longer edges for brain-like growth)
      const suitableEdges = findSuitableConnectionEdges(existingRegion);
      if (suitableEdges.length === 0) continue;
      
      const selectedEdge = suitableEdges[Math.floor(Math.random() * suitableEdges.length)];
      const edgeStart = existingRegion.vertices[selectedEdge.index];
      const edgeEnd = existingRegion.vertices[(selectedEdge.index + 1) % existingRegion.vertices.length];
      
      // Calculate connection point along the edge
      const connectionPoint = {
        x: edgeStart.x + selectedEdge.t * (edgeEnd.x - edgeStart.x),
        y: edgeStart.y + selectedEdge.t * (edgeEnd.y - edgeStart.y)
      };
      
      // Calculate outward direction for brain-like growth
      const edgeVec = { x: edgeEnd.x - edgeStart.x, y: edgeEnd.y - edgeStart.y };
      const edgeLength = Math.sqrt(edgeVec.x * edgeVec.x + edgeVec.y * edgeVec.y);
      const normal = { x: -edgeVec.y / edgeLength, y: edgeVec.x / edgeLength };
      
      // Ensure outward direction
      const toCenter = { 
        x: existingRegion.center.x - connectionPoint.x, 
        y: existingRegion.center.y - connectionPoint.y 
      };
      const dot = normal.x * toCenter.x + normal.y * toCenter.y;
      if (dot > 0) {
        normal.x = -normal.x;
        normal.y = -normal.y;
      }
      
      // Position new region center with brain-like spacing
      const growthDistance = baseSize * (0.5 + Math.random() * 0.3);
      const newCenter = {
        x: connectionPoint.x + normal.x * growthDistance,
        y: connectionPoint.y + normal.y * growthDistance
      };
      
      // Check bounds
      if (newCenter.x < margin || newCenter.x > width - margin ||
          newCenter.y < margin || newCenter.y > height - margin) {
        continue;
      }
      
      // Generate new brain-like region
      const regionSize = baseSize * (0.6 + Math.random() * 0.5);
      const newRegion = generateBrainFoldShape(newCenter, regionSize, complexity, i);
      
      // Create shared boundary connection
      const connectedRegion = createBrainConnection(newRegion, edgeStart, edgeEnd, connectionPoint, newCenter);
      
      bestRegion = connectedRegion;
    }
    
    if (bestRegion) {
      regions.push({
        id: `region-${i + 1}`,
        vertices: bestRegion,
        center: calculateCentroid(bestRegion),
        color: null,
        adjacentRegions: []
      });
    }
  }
  
  return regions;
};

// Generate brain-like folded shapes with gyri and sulci patterns
const generateBrainFoldShape = (center: Point, size: number, complexity: number, seed: number): Point[] => {
  const vertices: Point[] = [];
  const numPoints = 20 + Math.floor(complexity * 16); // More points for brain-like detail
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    
    // Create brain-like folding patterns with multiple frequency components
    // Simulate gyri (ridges) and sulci (grooves)
    const gyrusPattern = Math.sin(angle * 4 + seed) * size * 0.25; // Main folds
    const sulcusPattern = Math.sin(angle * 8 + seed * 1.7) * size * 0.15; // Secondary grooves  
    const microFold = Math.sin(angle * 12 + seed * 2.3) * size * 0.08; // Fine details
    const irregularity = Math.sin(angle * 6 + seed * 3.1) * size * 0.12; // Irregular bumps
    
    // Create deeper folding characteristic of brain tissue
    const foldingDepth = Math.cos(angle * 3 + seed * 1.5) * size * 0.2;
    
    // Base radius with brain-like convolutions
    const baseRadius = size * (0.5 + Math.sin(seed + i * 0.8) * 0.25);
    const totalFolding = gyrusPattern + sulcusPattern + microFold + irregularity + foldingDepth;
    const radius = Math.max(size * 0.2, baseRadius + totalFolding);
    
    const x = center.x + Math.cos(angle) * radius;
    const y = center.y + Math.sin(angle) * radius;
    
    vertices.push({ x, y });
  }
  
  // Apply extensive smoothing for brain-like organic curves
  let smoothed = smoothVertices(vertices);
  smoothed = smoothVertices(smoothed); // Double smoothing
  smoothed = applyBrainLikeRefinement(smoothed, size); // Brain-specific refinement
  
  return smoothed;
};

// Find suitable edges for brain-like region connections
const findSuitableConnectionEdges = (region: Region): Array<{index: number, t: number, length: number}> => {
  const suitableEdges: Array<{index: number, t: number, length: number}> = [];
  const minEdgeLength = 25; // Minimum edge length for connection
  
  for (let i = 0; i < region.vertices.length; i++) {
    const edgeStart = region.vertices[i];
    const edgeEnd = region.vertices[(i + 1) % region.vertices.length];
    const edgeLength = distance(edgeStart, edgeEnd);
    
    if (edgeLength >= minEdgeLength) {
      // Add multiple connection points along longer edges
      const numConnectionPoints = Math.min(3, Math.floor(edgeLength / 30));
      for (let j = 0; j < numConnectionPoints; j++) {
        const t = (j + 1) / (numConnectionPoints + 1); // Avoid endpoints
        suitableEdges.push({
          index: i,
          t: t,
          length: edgeLength
        });
      }
    }
  }
  
  return suitableEdges;
};

// Apply brain-specific refinement to create more realistic folding
const applyBrainLikeRefinement = (vertices: Point[], size: number): Point[] => {
  const refined: Point[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    // Calculate local curvature for brain-like effects
    const curvature = calculateCurvature(prev, curr, next);
    const curvatureEffect = Math.abs(curvature) * size * 0.1;
    
    // Apply brain-like micro-adjustments based on curvature
    const adjustmentAngle = Math.atan2(next.y - prev.y, next.x - prev.x) + Math.PI / 2;
    const adjustedX = curr.x + Math.cos(adjustmentAngle) * curvatureEffect * (Math.random() - 0.5);
    const adjustedY = curr.y + Math.sin(adjustmentAngle) * curvatureEffect * (Math.random() - 0.5);
    
    refined.push({ x: adjustedX, y: adjustedY });
  }
  
  return refined;
};

// Calculate curvature at a point
const calculateCurvature = (prev: Point, curr: Point, next: Point): number => {
  const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
  const v2 = { x: next.x - curr.x, y: next.y - curr.y };
  
  const crossProduct = v1.x * v2.y - v1.y * v2.x;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return crossProduct / (mag1 * mag2);
};

// Create brain-like connections between regions
const createBrainConnection = (
  newRegion: Point[], 
  edgeStart: Point, 
  edgeEnd: Point, 
  connectionPoint: Point,
  regionCenter: Point
): Point[] => {
  const result = [...newRegion];
  const connectionTolerance = 35;
  
  // Find vertices that should form the connection
  const connectingIndices: number[] = [];
  
  newRegion.forEach((vertex, index) => {
    const distToConnection = distance(vertex, connectionPoint);
    if (distToConnection < connectionTolerance) {
      connectingIndices.push(index);
    }
  });
  
  // Create brain-like connection with shared boundary
  if (connectingIndices.length >= 1) {
    const sortedIndices = connectingIndices.sort((a, b) => a - b);
    
    // Create connection points that follow the existing edge
    const numConnectPoints = Math.min(4, Math.max(2, sortedIndices.length));
    const connectionPoints: Point[] = [];
    
    for (let i = 0; i < numConnectPoints; i++) {
      const t = i / Math.max(1, numConnectPoints - 1);
      const edgePoint = {
        x: edgeStart.x + t * (edgeEnd.x - edgeStart.x),
        y: edgeStart.y + t * (edgeEnd.y - edgeStart.y)
      };
      
      // Add brain-like micro-variations to avoid perfectly straight connections
      const microVariation = 3 + Math.random() * 6;
      const variationAngle = Math.random() * 2 * Math.PI;
      edgePoint.x += Math.cos(variationAngle) * microVariation;
      edgePoint.y += Math.sin(variationAngle) * microVariation;
      
      connectionPoints.push(edgePoint);
    }
    
    // Apply connection points to the region
    for (let i = 0; i < Math.min(sortedIndices.length, connectionPoints.length); i++) {
      result[sortedIndices[i]] = connectionPoints[i];
    }
  }
  
  return result;
};

export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty): Region[] => {
  const config = getDifficultyConfig(difficulty, 1);
  
  // Generate brain-like regions with folded boundaries
  const regions = generateBrainLikeRegions(width, height, config.numRegions, config.complexity);
  
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
