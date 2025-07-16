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
  
  // Start with the entire canvas area as one region
  const initialRegion = {
    vertices: [
      { x: margin, y: margin },
      { x: margin + workingWidth, y: margin },
      { x: margin + workingWidth, y: margin + workingHeight },
      { x: margin, y: margin + workingHeight }
    ],
    center: { x: margin + workingWidth / 2, y: margin + workingHeight / 2 }
  };
  
  // Recursively divide the space into connected regions
  const regions = divideSpaceRecursively([initialRegion], nodes.length, nodes);
  
  return { regions };
};

const divideSpaceRecursively = (
  currentRegions: { vertices: Point[]; center: Point }[],
  targetCount: number,
  nodes: any[]
): { vertices: Point[]; center: Point }[] => {
  if (currentRegions.length >= targetCount) {
    return currentRegions.slice(0, targetCount);
  }
  
  // Find the largest region to split
  let largestRegion = currentRegions[0];
  let largestIndex = 0;
  let largestArea = calculatePolygonArea(largestRegion.vertices);
  
  for (let i = 1; i < currentRegions.length; i++) {
    const area = calculatePolygonArea(currentRegions[i].vertices);
    if (area > largestArea) {
      largestArea = area;
      largestRegion = currentRegions[i];
      largestIndex = i;
    }
  }
  
  // Split the largest region into two parts
  const newRegions = splitRegion(largestRegion);
  
  // Replace the largest region with the two new regions
  const updatedRegions = [
    ...currentRegions.slice(0, largestIndex),
    ...newRegions,
    ...currentRegions.slice(largestIndex + 1)
  ];
  
  // Continue recursively
  return divideSpaceRecursively(updatedRegions, targetCount, nodes);
};

const calculatePolygonArea = (vertices: Point[]): number => {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
};

const splitRegion = (region: { vertices: Point[]; center: Point }): { vertices: Point[]; center: Point }[] => {
  const vertices = region.vertices;
  const bounds = getBounds(vertices);
  
  // Decide whether to split horizontally or vertically
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const splitVertically = width > height;
  
  // Create an organic dividing line
  const divideAt = 0.3 + Math.random() * 0.4; // 30-70% along the dimension
  const divisionLine = createOrganicDivisionLine(bounds, splitVertically, divideAt);
  
  // Split the polygon along the division line
  const [region1, region2] = splitPolygonByLine(vertices, divisionLine, splitVertically);
  
  return [
    {
      vertices: region1,
      center: calculateCentroid(region1)
    },
    {
      vertices: region2,
      center: calculateCentroid(region2)
    }
  ];
};

const getBounds = (vertices: Point[]): { minX: number; maxX: number; minY: number; maxY: number } => {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const vertex of vertices) {
    minX = Math.min(minX, vertex.x);
    maxX = Math.max(maxX, vertex.x);
    minY = Math.min(minY, vertex.y);
    maxY = Math.max(maxY, vertex.y);
  }
  
  return { minX, maxX, minY, maxY };
};

const createOrganicDivisionLine = (
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  splitVertically: boolean,
  divideAt: number
): Point[] => {
  const points: Point[] = [];
  const numPoints = 8;
  
  if (splitVertically) {
    // Vertical split - line goes from top to bottom
    const baseX = bounds.minX + (bounds.maxX - bounds.minX) * divideAt;
    const height = bounds.maxY - bounds.minY;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const y = bounds.minY + height * t;
      
      // Add organic variation to the line
      const maxVariation = (bounds.maxX - bounds.minX) * 0.1;
      const variation = Math.sin(t * Math.PI * 2) * maxVariation * (Math.random() - 0.5);
      const x = baseX + variation;
      
      points.push({ x, y });
    }
  } else {
    // Horizontal split - line goes from left to right
    const baseY = bounds.minY + (bounds.maxY - bounds.minY) * divideAt;
    const width = bounds.maxX - bounds.minX;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const x = bounds.minX + width * t;
      
      // Add organic variation to the line
      const maxVariation = (bounds.maxY - bounds.minY) * 0.1;
      const variation = Math.sin(t * Math.PI * 2) * maxVariation * (Math.random() - 0.5);
      const y = baseY + variation;
      
      points.push({ x, y });
    }
  }
  
  return points;
};

const splitPolygonByLine = (
  vertices: Point[],
  divisionLine: Point[],
  splitVertically: boolean
): [Point[], Point[]] => {
  const bounds = getBounds(vertices);
  
  // Create two polygons by combining the original edges with the division line
  const region1: Point[] = [];
  const region2: Point[] = [];
  
  if (splitVertically) {
    // Split vertically - left and right regions
    // Create left region
    region1.push({ x: bounds.minX, y: bounds.minY });
    region1.push({ x: divisionLine[0].x, y: bounds.minY });
    region1.push(...divisionLine);
    region1.push({ x: divisionLine[divisionLine.length - 1].x, y: bounds.maxY });
    region1.push({ x: bounds.minX, y: bounds.maxY });
    
    // Create right region
    region2.push({ x: divisionLine[0].x, y: bounds.minY });
    region2.push({ x: bounds.maxX, y: bounds.minY });
    region2.push({ x: bounds.maxX, y: bounds.maxY });
    region2.push({ x: divisionLine[divisionLine.length - 1].x, y: bounds.maxY });
    region2.push(...divisionLine.slice().reverse());
  } else {
    // Split horizontally - top and bottom regions
    // Create top region
    region1.push({ x: bounds.minX, y: bounds.minY });
    region1.push({ x: bounds.maxX, y: bounds.minY });
    region1.push({ x: bounds.maxX, y: divisionLine[divisionLine.length - 1].y });
    region1.push(...divisionLine.slice().reverse());
    region1.push({ x: bounds.minX, y: divisionLine[0].y });
    
    // Create bottom region
    region2.push({ x: bounds.minX, y: divisionLine[0].y });
    region2.push(...divisionLine);
    region2.push({ x: bounds.maxX, y: divisionLine[divisionLine.length - 1].y });
    region2.push({ x: bounds.maxX, y: bounds.maxY });
    region2.push({ x: bounds.minX, y: bounds.maxY });
  }
  
  return [region1, region2];
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
