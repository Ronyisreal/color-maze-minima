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
  console.log('getDifficultyConfig called with:', { difficulty, level });
  
  let numRegions: number;
  let minColors: number;
  let complexity: number;
  
  switch (difficulty) {
    case 'easy':
      numRegions = 3 + level; // Level 1: 4 pieces, Level 2: 5 pieces, Level 3: 6 pieces
      minColors = 3;
      complexity = 0.3;
      break;
    case 'medium':
      numRegions = 6 + level; // Level 1: 7 pieces, Level 2: 8 pieces, Level 3: 9 pieces
      minColors = 4;
      complexity = 0.5;
      break;
    case 'hard':
      numRegions = 9 + level; // Level 1: 10 pieces, Level 2: 11 pieces, Level 3: 12 pieces
      minColors = 5;
      complexity = 0.7;
      break;
  }
  
  const finalConfig = {
    numRegions,
    minColors,
    complexity: Math.min(complexity + (level - 1) * 0.05, 0.9)
  };
  
  console.log('Final difficulty config:', finalConfig);
  return finalConfig;
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
  const tolerance = 15; // Increased tolerance for better boundary detection
  
  // First check center-to-center distance for quick filtering
  const centerDistance = distance(region1.center, region2.center);
  const maxDistance = Math.max(
    Math.max(...region1.vertices.map(v => distance(v, region1.center))),
    Math.max(...region2.vertices.map(v => distance(v, region2.center)))
  ) * 2.2; // Regions must be reasonably close
  
  if (centerDistance > maxDistance) return false;
  
  // Check if any vertices are close enough to indicate shared boundary
  for (const v1 of region1.vertices) {
    for (const v2 of region2.vertices) {
      if (distance(v1, v2) < tolerance) {
        return true;
      }
    }
  }
  
  // More thorough edge-to-edge proximity check
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

// Generate shapes based on graph theory and chromatic number
export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty, level: number = 1): Region[] => {
  console.log('Starting graph-based shape generation...', { width, height, difficulty, level });
  
  const config = getDifficultyConfig(difficulty, level);
  const numRegions = config.numRegions;
  
  // Create graph structure using graph theory
  const graphCalculator = new GraphColoringCalculator();
  
  // Generate a planar graph with appropriate connectivity
  const targetConnectivity = Math.max(2, Math.floor(numRegions * 0.4));
  graphCalculator.generatePlanarGraph(numRegions, targetConnectivity);
  
  // Calculate the chromatic number
  const chromaticNumber = graphCalculator.calculateChromaticNumber();
  console.log('Generated graph with chromatic number:', chromaticNumber);
  
  // Generate geometric shapes based on the graph structure
  const regions = generateGeometricRegionsFromGraph(graphCalculator, width, height);
  
  // Verify and update adjacencies based on actual geometric boundaries
  updateGeometricAdjacencies(regions);
  
  console.log(`Generated ${regions.length} regions with proper boundary connections`);
  const regionsWithAdjacencies = regions.filter(r => r.adjacentRegions.length > 0);
  console.log(`Found ${regionsWithAdjacencies.length} regions with adjacencies:`, 
    regionsWithAdjacencies.map(r => `${r.id}:${r.adjacentRegions.length}`).join(', '));
  
  return regions;
};

// Generate geometric regions based on graph structure
const generateGeometricRegionsFromGraph = (
  graphCalculator: GraphColoringCalculator, 
  width: number, 
  height: number
): Region[] => {
  const nodes = graphCalculator.getNodes();
  const regions: Region[] = [];
  const margin = 40;
  
  // Create a grid-like layout to ensure proper boundary connections
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const rows = Math.ceil(nodes.length / cols);
  
  const cellWidth = (width - 2 * margin) / cols;
  const cellHeight = (height - 2 * margin) / rows;
  
  nodes.forEach((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    // Calculate base position in grid
    const baseX = margin + col * cellWidth + cellWidth / 2;
    const baseY = margin + row * cellHeight + cellHeight / 2;
    
    // Add some randomization while keeping regions connected
    const jitterX = (Math.random() - 0.5) * cellWidth * 0.3;
    const jitterY = (Math.random() - 0.5) * cellHeight * 0.3;
    
    const centerX = baseX + jitterX;
    const centerY = baseY + jitterY;
    
    // Create shape vertices ensuring boundary connections
    const vertices = createConnectedShapeVertices(
      { x: centerX, y: centerY },
      node,
      graphCalculator,
      cellWidth * 0.4,
      cellHeight * 0.4
    );
    
    regions.push({
      id: node.id,
      vertices,
      center: { x: centerX, y: centerY },
      color: null,
      adjacentRegions: Array.from(node.adjacents)
    });
  });
  
  return regions;
};

// Create shape vertices that will connect properly with adjacent shapes
const createConnectedShapeVertices = (
  center: Point,
  node: any,
  graphCalculator: GraphColoringCalculator,
  maxWidth: number,
  maxHeight: number
): Point[] => {
  const numVertices = 6 + Math.floor(Math.random() * 3); // 6-8 vertices
  const vertices: Point[] = [];
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    
    // Vary radius based on direction and adjacency
    let radiusX = maxWidth * (0.6 + Math.random() * 0.4);
    let radiusY = maxHeight * (0.6 + Math.random() * 0.4);
    
    // Extend towards adjacent regions to ensure boundary connection
    const adjacentCount = node.adjacents.size;
    if (adjacentCount > 0) {
      const extensionFactor = 1 + (adjacentCount * 0.1);
      radiusX *= extensionFactor;
      radiusY *= extensionFactor;
    }
    
    const x = center.x + Math.cos(angle) * radiusX;
    const y = center.y + Math.sin(angle) * radiusY;
    
    vertices.push({ x, y });
  }
  
  return vertices;
};

// Update adjacencies based on actual geometric boundaries
const updateGeometricAdjacencies = (regions: Region[]): void => {
  // Clear existing adjacencies
  regions.forEach(region => {
    region.adjacentRegions = [];
  });
  
  // Find actual geometric adjacencies
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
