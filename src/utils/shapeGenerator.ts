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

// Generate geometric regions based on graph structure - as one connected puzzle
const generateGeometricRegionsFromGraph = (
  graphCalculator: GraphColoringCalculator, 
  width: number, 
  height: number
): Region[] => {
  const nodes = graphCalculator.getNodes();
  const regions: Region[] = [];
  const margin = 60;
  
  // Create a single connected puzzle using Voronoi tessellation
  const seeds: Point[] = [];
  
  // Generate seeds in a more connected pattern
  const numNodes = nodes.length;
  const cols = Math.ceil(Math.sqrt(numNodes * 1.2));
  const rows = Math.ceil(numNodes / cols);
  
  const cellWidth = (width - 2 * margin) / cols;
  const cellHeight = (height - 2 * margin) / rows;
  
  // Create seeds with some randomization but ensuring connectivity
  for (let i = 0; i < numNodes; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    
    const baseX = margin + col * cellWidth + cellWidth / 2;
    const baseY = margin + row * cellHeight + cellHeight / 2;
    
    // Add controlled randomization to avoid perfect grid
    const jitterX = (Math.random() - 0.5) * cellWidth * 0.4;
    const jitterY = (Math.random() - 0.5) * cellHeight * 0.4;
    
    seeds.push({
      x: baseX + jitterX,
      y: baseY + jitterY
    });
  }
  
  // Create Voronoi cells that form a connected puzzle
  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const vertices = createVoronoiCell(seed, seeds, width, height);
    
    if (vertices.length >= 3) {
      regions.push({
        id: nodes[i].id,
        vertices,
        center: seed,
        color: null,
        adjacentRegions: []
      });
    }
  }
  
  return regions;
};

// Create a Voronoi cell for connected puzzle
const createVoronoiCell = (seed: Point, allSeeds: Point[], width: number, height: number): Point[] => {
  // Start with canvas boundaries
  let clipVertices: Point[] = [
    { x: 50, y: 50 },
    { x: width - 50, y: 50 },
    { x: width - 50, y: height - 50 },
    { x: 50, y: height - 50 }
  ];
  
  // Clip against perpendicular bisectors of other seeds
  for (const otherSeed of allSeeds) {
    if (otherSeed === seed) continue;
    
    clipVertices = clipByPerpBisector(clipVertices, seed, otherSeed);
    if (clipVertices.length < 3) break;
  }
  
  return clipVertices;
};

// Clip polygon by perpendicular bisector
const clipByPerpBisector = (vertices: Point[], seed1: Point, seed2: Point): Point[] => {
  if (vertices.length === 0) return [];
  
  const midX = (seed1.x + seed2.x) / 2;
  const midY = (seed1.y + seed2.y) / 2;
  
  const dx = seed2.x - seed1.x;
  const dy = seed2.y - seed1.y;
  
  const result: Point[] = [];
  
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];
    
    const currentSide = (current.x - midX) * dx + (current.y - midY) * dy;
    const nextSide = (next.x - midX) * dx + (next.y - midY) * dy;
    
    if (currentSide <= 0) {
      result.push(current);
    }
    
    if ((currentSide > 0) !== (nextSide > 0)) {
      // Find intersection
      const t = currentSide / (currentSide - nextSide);
      const ix = current.x + t * (next.x - current.x);
      const iy = current.y + t * (next.y - current.y);
      result.push({ x: ix, y: iy });
    }
  }
  
  return result;
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
