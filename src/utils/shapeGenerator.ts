import { GraphColoringCalculator } from './graphTheory';

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
  // Dynamically choose numRegions based on difficulty (random within range)
  let numRegions = 4;
  if (difficulty === 'easy') {
    numRegions = Math.floor(4 + Math.random() * 4);    // 4–7
  } else if (difficulty === 'medium') {
    numRegions = Math.floor(8 + Math.random() * 4);    // 8–11
  } else if (difficulty === 'hard') {
    numRegions = Math.floor(12 + Math.random() * 4);   // 12–15
  }
  let minColors: number;
  let complexity: number;

  switch (difficulty) {
    case 'easy':
      minColors = 3;
      complexity = 0.3;
      break;
    case 'medium':
      minColors = 4;
      complexity = 0.5;
      break;
    case 'hard':
      minColors = 5;
      complexity = 0.7;
      break;
    default:
      minColors = 3;
      complexity = 0.3;
  }

  return {
    numRegions,
    minColors,
    complexity: Math.min(complexity + (level - 1) * 0.05, 0.9)
  };
};

// Helper functions for geometric calculations
const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

const calculateCentroid = (vertices: Point[]): Point => {
  const x = vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length;
  const y = vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length;
  return { x, y };
};

// Check if two polygons share a boundary
const doRegionsShareBoundary = (region1: Region, region2: Region): boolean => {
  const tolerance = 15;

  const centerDistance = distance(region1.center, region2.center);
  const maxDistance = Math.max(
    Math.max(...region1.vertices.map(v => distance(v, region1.center))),
    Math.max(...region2.vertices.map(v => distance(v, region2.center)))
  ) * 2.2;

  if (centerDistance > maxDistance) return false;

  for (const v1 of region1.vertices) {
    for (const v2 of region2.vertices) {
      if (distance(v1, v2) < tolerance) {
        return true;
      }
    }
  }

  for (let i = 0; i < region1.vertices.length; i++) {
    const edge1Start = region1.vertices[i];
    const edge1End = region1.vertices[(i + 1) % region1.vertices.length];
    for (let j = 0; j < region2.vertices.length; j++) {
      const edge2Start = region2.vertices[j];
      const edge2End = region2.vertices[(j + 1) % region2.vertices.length];
      const edgeDist = edgeToEdgeDistance(edge1Start, edge1End, edge2Start, edge2End);
      if (edgeDist < tolerance) {
        return true;
      }
    }
  }

  return false;
};

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

// Generate shapes based on graph theory and chromatic number
export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty, level: number = 1): Region[] => {
  const config = getDifficultyConfig(difficulty, level);
  const numRegions = config.numRegions;

  // Create graph structure using graph theory
  const graphCalculator = new GraphColoringCalculator();

  // Generate a planar graph with appropriate connectivity
  const targetConnectivity = Math.max(2, Math.floor(numRegions * 0.4));
  graphCalculator.generatePlanarGraph(numRegions, targetConnectivity);

  // Calculate the chromatic number
  const chromaticNumber = graphCalculator.calculateChromaticNumber();

  // Generate geometric shapes based on the graph structure
  const regions = generateGeometricRegionsFromGraph(graphCalculator, width, height);

  // Verify and update adjacencies based on actual geometric boundaries
  updateGeometricAdjacencies(regions);

  // Recalculate chromatic number based on actual geometric adjacencies
  const actualChromaticNumber = calculateChromaticNumberFromRegions(regions);

  return regions;
};

// Calculate chromatic number from actual region adjacencies using backtracking
const calculateChromaticNumberFromRegions = (regions: Region[]): number => {
  if (regions.length === 0) return 0;
  if (regions.length === 1) return 1;
  
  // Try coloring with k colors, starting from 1
  for (let k = 1; k <= regions.length; k++) {
    if (canColorRegionsWithKColors(regions, k)) {
      return k;
    }
  }
  
  // Fallback (should never reach here for valid graphs)
  return regions.length;
};

// Check if regions can be colored with k colors using backtracking
const canColorRegionsWithKColors = (regions: Region[], k: number): boolean => {
  const coloring = new Map<string, number>();
  return backtrackColorRegions(regions, 0, k, coloring);
};

// Backtracking function to try all possible colorings for regions
const backtrackColorRegions = (regions: Region[], regionIndex: number, k: number, coloring: Map<string, number>): boolean => {
  // Base case: all regions are colored
  if (regionIndex === regions.length) {
    return true;
  }

  const currentRegion = regions[regionIndex];
  
  // Try each color from 1 to k
  for (let color = 1; color <= k; color++) {
    if (isSafeToColorRegion(currentRegion, color, coloring)) {
      // Assign color to current region
      coloring.set(currentRegion.id, color);
      
      // Recursively try to color remaining regions
      if (backtrackColorRegions(regions, regionIndex + 1, k, coloring)) {
        return true;
      }
      
      // Backtrack: remove color assignment
      coloring.delete(currentRegion.id);
    }
  }
  
  // No valid coloring found
  return false;
};

// Check if it's safe to assign a color to a region
const isSafeToColorRegion = (region: Region, color: number, coloring: Map<string, number>): boolean => {
  // Check if any adjacent region has the same color
  for (const adjacentId of region.adjacentRegions) {
    if (coloring.has(adjacentId) && coloring.get(adjacentId) === color) {
      return false;
    }
  }
  return true;
};

const generateGeometricRegionsFromGraph = (
  graphCalculator: GraphColoringCalculator, 
  width: number, 
  height: number
): Region[] => {
  const nodes = graphCalculator.getNodes();
  const regions: Region[] = [];
  const margin = 60;
  
  // Create a seamless connected map with shared boundaries
  const mapData = createSeamlessConnectedMap(nodes, width, height, margin);
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const regionData = mapData.regions[i];
    
    regions.push({
      id: node.id,
      vertices: regionData.vertices,
      center: regionData.center,
      color: null,
      adjacentRegions: Array.from(node.adjacents)
    });
  }
  
  return regions;
};

const createSeamlessConnectedMap = (
  nodes: any[],
  width: number,
  height: number,
  margin: number
): { regions: { vertices: Point[]; center: Point }[] } => {
  const workingWidth = width - 2 * margin;
  const workingHeight = height - 2 * margin;
  const numNodes = nodes.length;
  
  // Create a network of connected control points
  const controlPoints = generateControlPointNetwork(workingWidth, workingHeight, margin, numNodes);
  
  // Generate organic boundaries between regions
  const boundaries = generateOrganicBoundaries(controlPoints, nodes);
  
  // Create regions from the boundary network
  const regions = createRegionsFromBoundaries(boundaries, controlPoints, nodes);
  
  return { regions };
};

const generateControlPointNetwork = (
  width: number,
  height: number,
  margin: number,
  numNodes: number
): Point[] => {
  const points: Point[] = [];
  
  // Create a roughly circular/organic arrangement of control points
  const centerX = margin + width / 2;
  const centerY = margin + height / 2;
  const baseRadius = Math.min(width, height) * 0.3;
  
  for (let i = 0; i < numNodes; i++) {
    const angle = (i / numNodes) * 2 * Math.PI;
    const radiusVariation = 0.7 + Math.random() * 0.6; // 70%-130% variation
    const angleVariation = (Math.random() - 0.5) * 0.5; // Some angular variation
    
    const actualAngle = angle + angleVariation;
    const actualRadius = baseRadius * radiusVariation;
    
    const x = centerX + Math.cos(actualAngle) * actualRadius;
    const y = centerY + Math.sin(actualAngle) * actualRadius;
    
    points.push({ x, y });
  }
  
  return points;
};

const generateOrganicBoundaries = (
  controlPoints: Point[],
  nodes: any[]
): Map<string, Point[]> => {
  const boundaries = new Map<string, Point[]>();
  
  // For each pair of adjacent nodes, create a curved boundary
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePoint = controlPoints[i];
    
    for (const adjacentId of node.adjacents) {
      const adjacentIndex = nodes.findIndex(n => n.id === adjacentId);
      if (adjacentIndex !== -1 && adjacentIndex > i) { // Avoid duplicate boundaries
        const adjacentPoint = controlPoints[adjacentIndex];
        const boundaryKey = `${node.id}-${adjacentId}`;
        
        // Create a curved boundary line between the two points
        const boundaryPoints = createCurvedBoundary(nodePoint, adjacentPoint);
        boundaries.set(boundaryKey, boundaryPoints);
      }
    }
  }
  
  return boundaries;
};

const createCurvedBoundary = (point1: Point, point2: Point): Point[] => {
  const points: Point[] = [];
  const numSegments = 8;
  
  // Create a curved path between the two points
  const midX = (point1.x + point2.x) / 2;
  const midY = (point1.y + point2.y) / 2;
  
  // Add some perpendicular offset to create curves
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  if (length > 0) {
    const perpX = -dy / length;
    const perpY = dx / length;
    const maxOffset = length * 0.3 * (Math.random() - 0.5);
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const baseX = point1.x + (point2.x - point1.x) * t;
      const baseY = point1.y + (point2.y - point1.y) * t;
      
      // Apply curved offset (stronger in the middle)
      const offsetStrength = Math.sin(t * Math.PI) * maxOffset;
      const x = baseX + perpX * offsetStrength;
      const y = baseY + perpY * offsetStrength;
      
      points.push({ x, y });
    }
  }
  
  return points;
};

const createRegionsFromBoundaries = (
  boundaries: Map<string, Point[]>,
  controlPoints: Point[],
  nodes: any[]
): { vertices: Point[]; center: Point }[] => {
  const regions: { vertices: Point[]; center: Point }[] = [];
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const centerPoint = controlPoints[i];
    
    // Create a region by expanding outward from the center
    const vertices = createOrganicRegionShape(centerPoint, node.adjacents, controlPoints, nodes, boundaries);
    
    regions.push({
      vertices,
      center: centerPoint
    });
  }
  
  return regions;
};

const createOrganicRegionShape = (
  centerPoint: Point,
  adjacentIds: Set<string>,
  controlPoints: Point[],
  nodes: any[],
  boundaries: Map<string, Point[]>
): Point[] => {
  const vertices: Point[] = [];
  const radius = 40 + Math.random() * 30; // 40-70 pixel radius
  const numBaseVertices = 8 + Math.floor(Math.random() * 4); // 8-11 vertices
  
  // Create organic shape around the center point
  for (let i = 0; i < numBaseVertices; i++) {
    const angle = (i / numBaseVertices) * 2 * Math.PI;
    const radiusVariation = 0.6 + Math.random() * 0.8; // 60%-140% variation
    const angleVariation = (Math.random() - 0.5) * 0.3; // ±15% angle variation
    
    const actualAngle = angle + angleVariation;
    const actualRadius = radius * radiusVariation;
    
    const x = centerPoint.x + Math.cos(actualAngle) * actualRadius;
    const y = centerPoint.y + Math.sin(actualAngle) * actualRadius;
    
    vertices.push({ x, y });
  }
  
  // Add some additional random points for more organic feel
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = radius * (0.5 + Math.random() * 0.5);
    const x = centerPoint.x + Math.cos(angle) * r;
    const y = centerPoint.y + Math.sin(angle) * r;
    vertices.push({ x, y });
  }
  
  // Sort vertices by angle to create proper polygon
  vertices.sort((a, b) => {
    const angleA = Math.atan2(a.y - centerPoint.y, a.x - centerPoint.x);
    const angleB = Math.atan2(b.y - centerPoint.y, b.x - centerPoint.x);
    return angleA - angleB;
  });
  
  // Smooth the shape by applying curve smoothing
  return smoothPolygon(vertices);
};

const smoothPolygon = (vertices: Point[]): Point[] => {
  const smoothed: Point[] = [];
  const smoothingFactor = 0.3;
  
  for (let i = 0; i < vertices.length; i++) {
    const prev = vertices[(i - 1 + vertices.length) % vertices.length];
    const curr = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    const smoothedX = curr.x + smoothingFactor * ((prev.x + next.x) / 2 - curr.x);
    const smoothedY = curr.y + smoothingFactor * ((prev.y + next.y) / 2 - curr.y);
    
    smoothed.push({ x: smoothedX, y: smoothedY });
  }
  
  return smoothed;
};


const updateGeometricAdjacencies = (regions: Region[]): void => {
  regions.forEach(region => {
    region.adjacentRegions = [];
  });

  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const region1 = regions[i];
      const region2 = regions[j];
      if (doRegionsShareBoundary(region1, region2)) {
        region1.adjacentRegions.push(region2.id);
        region2.adjacentRegions.push(region1.id);
      }
    }
  }
};
