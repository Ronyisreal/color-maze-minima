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
  
  // Create a more organic layout using recursive space division
  const regionBounds = createMapRegions(nodes, width, height, margin);
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const bounds = regionBounds[i];
    
    // Generate irregular polygon for this region
    const vertices = generateIrregularPolygon(bounds, 6 + Math.floor(Math.random() * 4)); // 6-9 vertices
    const center = calculateCentroid(vertices);
    
    regions.push({
      id: node.id,
      vertices,
      center,
      color: null,
      adjacentRegions: Array.from(node.adjacents)
    });
  }
  
  return regions;
};

interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createMapRegions = (
  nodes: any[],
  width: number,
  height: number,
  margin: number
): RegionBounds[] => {
  const bounds: RegionBounds[] = [];
  const workingWidth = width - 2 * margin;
  const workingHeight = height - 2 * margin;
  
  // Use a recursive subdivision approach to create map-like regions
  const areas = subdivideArea(
    { x: margin, y: margin, width: workingWidth, height: workingHeight },
    nodes.length,
    0
  );
  
  // Add some randomness to make regions more organic
  return areas.map(area => ({
    x: area.x + (Math.random() - 0.5) * area.width * 0.2,
    y: area.y + (Math.random() - 0.5) * area.height * 0.2,
    width: area.width * (0.8 + Math.random() * 0.4),
    height: area.height * (0.8 + Math.random() * 0.4)
  }));
};

const subdivideArea = (
  area: RegionBounds,
  numRegions: number,
  depth: number
): RegionBounds[] => {
  if (numRegions <= 1 || depth > 4) {
    return [area];
  }
  
  const isHorizontalSplit = area.width > area.height;
  const splitRatio = 0.4 + Math.random() * 0.2; // 40%-60% split
  
  if (isHorizontalSplit) {
    const splitX = area.x + area.width * splitRatio;
    const leftRegions = Math.floor(numRegions * splitRatio);
    const rightRegions = numRegions - leftRegions;
    
    return [
      ...subdivideArea(
        { x: area.x, y: area.y, width: splitX - area.x, height: area.height },
        leftRegions,
        depth + 1
      ),
      ...subdivideArea(
        { x: splitX, y: area.y, width: area.x + area.width - splitX, height: area.height },
        rightRegions,
        depth + 1
      )
    ];
  } else {
    const splitY = area.y + area.height * splitRatio;
    const topRegions = Math.floor(numRegions * splitRatio);
    const bottomRegions = numRegions - topRegions;
    
    return [
      ...subdivideArea(
        { x: area.x, y: area.y, width: area.width, height: splitY - area.y },
        topRegions,
        depth + 1
      ),
      ...subdivideArea(
        { x: area.x, y: splitY, width: area.width, height: area.y + area.height - splitY },
        bottomRegions,
        depth + 1
      )
    ];
  }
};

const generateIrregularPolygon = (bounds: RegionBounds, numVertices: number): Point[] => {
  const vertices: Point[] = [];
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const radiusX = bounds.width * 0.4;
  const radiusY = bounds.height * 0.4;
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    const radiusVariation = 0.6 + Math.random() * 0.8; // 60%-140% of base radius
    const angleVariation = (Math.random() - 0.5) * 0.3; // ±15% angle variation
    
    const actualAngle = angle + angleVariation;
    const x = centerX + Math.cos(actualAngle) * radiusX * radiusVariation;
    const y = centerY + Math.sin(actualAngle) * radiusY * radiusVariation;
    
    vertices.push({
      x: Math.max(bounds.x, Math.min(bounds.x + bounds.width, x)),
      y: Math.max(bounds.y, Math.min(bounds.y + bounds.height, y))
    });
  }
  
  return vertices;
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
