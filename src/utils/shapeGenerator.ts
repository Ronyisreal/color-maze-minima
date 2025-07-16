import rough from 'roughjs';
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
  subdivisions: number;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export const getDifficultyConfig = (difficulty: Difficulty, level: number): DifficultyConfig => {
  let numRegions = 4;
  let subdivisions = 1;
  if (difficulty === 'easy') {
    numRegions = Math.floor(4 + Math.random() * 4); // 4–7
    subdivisions = 1;
  } else if (difficulty === 'medium') {
    numRegions = Math.floor(8 + Math.random() * 4); // 8–11
    subdivisions = 2;
  } else if (difficulty === 'hard') {
    numRegions = Math.floor(12 + Math.random() * 4); // 12–15
    subdivisions = 3;
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
    complexity: Math.min(complexity + (level - 1) * 0.05, 0.9),
    subdivisions
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

function subdividePolygon(vertices: Point[], numIntermediates: number): Point[] {
  const newVertices: Point[] = [];
  const numVerts = vertices.length;
  for (let i = 0; i < numVerts; i++) {
    const A = vertices[i];
    const B = vertices[(i + 1) % numVerts];
    newVertices.push(A);
    for (let j = 1; j <= numIntermediates; j++) {
      const t = j / (numIntermediates + 1);
      const x = A.x + t * (B.x - A.x);
      const y = A.y + t * (B.y - A.y);
      newVertices.push({ x, y });
    }
  }
  return newVertices;
}

export function drawRegions(regions: Region[], canvas: HTMLCanvasElement, config: DifficultyConfig) {
  const rc = rough.canvas(canvas);
  const numIntermediates = config.subdivisions;
  regions.forEach(region => {
    const subdividedVertices = subdividePolygon(region.vertices, numIntermediates);
    const points = subdividedVertices.map(v => [v.x, v.y] as [number, number]);
    rc.polygon(points, {
      stroke: 'black',
      strokeWidth: 3,
      roughness: 2.5,
      bowing: 2.0,
      fill: 'none'
    });
  });
}

export const generateLargeComplexShape = (width: number, height: number, difficulty: Difficulty, level: number = 1): Region[] => {
  const config = getDifficultyConfig(difficulty, level);
  const numRegions = config.numRegions;

  const graphCalculator = new GraphColoringCalculator();
  graphCalculator.generatePlanarGraph(numRegions);

  const regions = generateGeometricRegionsFromGraph(graphCalculator, width, height);
  updateGeometricAdjacencies(regions);

  return regions;
};

const generateGeometricRegionsFromGraph = (
  graphCalculator: GraphColoringCalculator, 
  width: number, 
  height: number
): Region[] => {
  const nodes = graphCalculator.getNodes();
  const regions: Region[] = [];
  const margin = 60;
  const numNodes = nodes.length;

  // Create organic blob-like shapes
  const centers: Point[] = [];
  const usedWidth = width - 2 * margin;
  const usedHeight = height - 2 * margin;

  // Generate centers with organic spacing
  for (let i = 0; i < numNodes; i++) {
    let center: Point;
    let attempts = 0;
    do {
      center = {
        x: margin + Math.random() * usedWidth,
        y: margin + Math.random() * usedHeight
      };
      attempts++;
    } while (attempts < 50 && centers.some(c => distance(c, center) < Math.min(usedWidth, usedHeight) / (numNodes * 0.3)));
    
    centers.push(center);
  }

  // Create organic shapes for each center
  for (let i = 0; i < centers.length; i++) {
    const center = centers[i];
    const vertices = createOrganicShape(center, width, height, i, numNodes);
    
    if (vertices.length >= 3) {
      regions.push({
        id: nodes[i].id,
        vertices,
        center,
        color: null,
        adjacentRegions: []
      });
    }
  }

  return regions;
};

const createOrganicShape = (center: Point, width: number, height: number, index: number, totalShapes: number): Point[] => {
  const vertices: Point[] = [];
  const baseRadius = Math.min(width, height) / (totalShapes * 0.6);
  const numVertices = 8 + Math.floor(Math.random() * 6); // 8-14 vertices for organic shape
  
  // Create organic blob using noise and randomness
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    
    // Add multiple noise layers for organic variation
    const noise1 = Math.sin(angle * 2 + index) * 0.4;
    const noise2 = Math.sin(angle * 3 + index * 1.3) * 0.3;
    const noise3 = Math.sin(angle * 5 + index * 2.1) * 0.2;
    const randomNoise = (Math.random() - 0.5) * 0.6;
    
    const radiusVariation = 1 + noise1 + noise2 + noise3 + randomNoise;
    const radius = baseRadius * Math.max(0.3, radiusVariation);
    
    // Add angular variation for more organic shapes
    const angleVariation = (Math.random() - 0.5) * 0.4;
    const adjustedAngle = angle + angleVariation;
    
    const x = center.x + Math.cos(adjustedAngle) * radius;
    const y = center.y + Math.sin(adjustedAngle) * radius;
    
    // Keep within bounds with some margin
    const margin = 60;
    const clampedX = Math.max(margin, Math.min(width - margin, x));
    const clampedY = Math.max(margin, Math.min(height - margin, y));
    
    vertices.push({ x: clampedX, y: clampedY });
  }
  
  // Apply smoothing to make shapes more organic
  const smoothed = smoothOrganicShape(vertices);
  return smoothed;
};

const smoothOrganicShape = (vertices: Point[]): Point[] => {
  const smoothed: Point[] = [];
  const numVertices = vertices.length;
  
  for (let i = 0; i < numVertices; i++) {
    const prev = vertices[(i - 1 + numVertices) % numVertices];
    const curr = vertices[i];
    const next = vertices[(i + 1) % numVertices];
    
    // Simple smoothing using weighted average
    const smoothX = 0.1 * prev.x + 0.8 * curr.x + 0.1 * next.x;
    const smoothY = 0.1 * prev.y + 0.8 * curr.y + 0.1 * next.y;
    
    smoothed.push({ x: smoothX, y: smoothY });
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