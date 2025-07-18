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
  let numRegions = 6;
  let subdivisions = 2;
  let minColors: number;
  let complexity: number;

  // Much harder difficulty levels as requested
  if (difficulty === 'easy') {
    // Easy made "very hard" - 6-8 pieces across 3 levels
    if (level === 1) numRegions = 6;
    else if (level === 2) numRegions = 7;
    else numRegions = 8; // Level 3
    subdivisions = 2;
    minColors = 4;
    complexity = 0.6;
  } else if (difficulty === 'medium') {
    // Medium made "crazy hard" - 10-14 pieces across 3 levels
    if (level === 1) numRegions = 10;
    else if (level === 2) numRegions = 12;
    else numRegions = 14; // Level 3
    subdivisions = 3;
    minColors = 6;
    complexity = 0.8;
  } else if (difficulty === 'hard') {
    // Hard made "teeth grinding hard" - 16-22 pieces across 3 levels
    if (level === 1) numRegions = 16;
    else if (level === 2) numRegions = 19;
    else numRegions = 22; // Level 3
    subdivisions = 4;
    minColors = 8;
    complexity = 0.9;
  } else {
    // Default fallback
    numRegions = 6;
    subdivisions = 2;
    minColors = 4;
    complexity = 0.6;
  }

  return {
    numRegions,
    minColors,
    complexity: Math.min(complexity + (level - 1) * 0.05, 0.95),
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
  graphCalculator.generatePlanarGraph(numRegions, 2); // Use reasonable connectivity

  const regions = generateGeometricRegionsFromGraph(graphCalculator, width, height);
  
  // Use the logical graph structure instead of geometric adjacencies
  applyLogicalAdjacencies(regions, graphCalculator);

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
  const usedWidth = width - 2 * margin;
  const usedHeight = height - 2 * margin;

  // Create scattered regions instead of wedges
  const scatteredRegions = createScatteredRegions(nodes, margin, usedWidth, usedHeight);

  return scatteredRegions;
};

const createScatteredRegions = (
  nodes: { id: string }[], 
  margin: number, 
  width: number, 
  height: number
): Region[] => {
  const regions: Region[] = [];
  
  // Create a single large shape that fills the canvas without white spaces
  const baseShape = createBaseShape(margin, width, height);
  
  // Use Voronoi-like division to create connected regions without gaps
  return createConnectedRegionsFromShape(baseShape, nodes, width, height, margin);
};

const createConnectedRegionsFromShape = (
  baseShape: Point[],
  nodes: { id: string }[],
  width: number,
  height: number,
  margin: number
): Region[] => {
  const regions: Region[] = [];
  const numRegions = nodes.length;
  
  if (numRegions === 1) {
    return [{
      id: nodes[0].id,
      vertices: baseShape,
      center: calculateCentroid(baseShape),
      color: null,
      adjacentRegions: []
    }];
  }
  
  // Create regions by dividing the base shape
  const center = calculateCentroid(baseShape);
  
  for (let i = 0; i < numRegions; i++) {
    const regionVertices = createConnectedSubShape(baseShape, i, numRegions, center);
    
    regions.push({
      id: nodes[i].id,
      vertices: regionVertices,
      center: calculateCentroid(regionVertices),
      color: null,
      adjacentRegions: []
    });
  }
  
  return regions;
};

const createIrregularPolygon = (center: Point, radiusX: number, radiusY: number): Point[] => {
  const vertices: Point[] = [];
  const numVertices = 6 + Math.floor(Math.random() * 3); // 6-8 vertices
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    
    // Add irregularity
    const radiusVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
    const angleVariation = (Math.random() - 0.5) * 0.3; // Small angle variation
    
    const finalAngle = angle + angleVariation;
    const finalRadiusX = radiusX * radiusVariation;
    const finalRadiusY = radiusY * radiusVariation;
    
    const x = center.x + Math.cos(finalAngle) * finalRadiusX;
    const y = center.y + Math.sin(finalAngle) * finalRadiusY;
    
    vertices.push({ x, y });
  }
  
  return vertices;
};

const createBaseShape = (margin: number, width: number, height: number): Point[] => {
  const vertices: Point[] = [];
  const centerX = margin + width / 2;
  const centerY = margin + height / 2;
  const numVertices = 16;
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI;
    const radiusX = (width / 2) * 0.8;
    const radiusY = (height / 2) * 0.8;
    
    // Add organic variation
    const noise = Math.sin(angle * 3) * 0.1 + Math.sin(angle * 5) * 0.05;
    const radius = (1 + noise) * Math.min(radiusX, radiusY);
    
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    vertices.push({ x, y });
  }
  
  return vertices;
};

const recursivelyDivideShape = (
  shape: Point[], 
  numRegions: number, 
  nodes: { id: string }[], 
  width: number, 
  height: number
): Region[] => {
  if (numRegions === 1) {
    return [{
      id: nodes[0].id,
      vertices: shape,
      center: calculateCentroid(shape),
      color: null,
      adjacentRegions: []
    }];
  }

  const regions: Region[] = [];
  const center = calculateCentroid(shape);
  
  // Create connected regions by dividing the shape into wedges
  for (let i = 0; i < Math.min(numRegions, nodes.length); i++) {
    const subShape = createConnectedSubShape(shape, i, numRegions, center);
    regions.push({
      id: nodes[i].id,
      vertices: subShape,
      center: calculateCentroid(subShape),
      color: null,
      adjacentRegions: []
    });
  }

  return regions;
};

const createConnectedSubShape = (
  baseShape: Point[], 
  regionIndex: number, 
  totalRegions: number, 
  center: Point
): Point[] => {
  const vertices: Point[] = [];
  
  // Create wedge-like divisions that share boundaries
  const anglePerRegion = (2 * Math.PI) / totalRegions;
  const startAngle = regionIndex * anglePerRegion;
  const endAngle = (regionIndex + 1) * anglePerRegion;
  
  // Add center point
  vertices.push(center);
  
  // Add boundary points along the perimeter
  const perimeterPoints = [];
  for (let i = 0; i < baseShape.length; i++) {
    const point = baseShape[i];
    const angle = Math.atan2(point.y - center.y, point.x - center.x);
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    
    // Check if point is within this region's angle range
    if (normalizedAngle >= startAngle && normalizedAngle <= endAngle) {
      perimeterPoints.push(point);
    }
  }
  
  // Add start and end boundary lines
  const startBoundaryPoint = createBoundaryPoint(baseShape, startAngle, center);
  const endBoundaryPoint = createBoundaryPoint(baseShape, endAngle, center);
  
  // Assemble the shape
  vertices.push(startBoundaryPoint);
  vertices.push(...perimeterPoints);
  vertices.push(endBoundaryPoint);
  
  return vertices.length >= 3 ? vertices : createFallbackShape(center, regionIndex, totalRegions);
};

const createBoundaryPoint = (baseShape: Point[], angle: number, center: Point): Point => {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  
  // Find intersection with base shape perimeter
  let maxDistance = 0;
  let boundaryPoint = center;
  
  for (const point of baseShape) {
    const distance = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
    const pointAngle = Math.atan2(point.y - center.y, point.x - center.x);
    const angleDiff = Math.abs(pointAngle - angle);
    
    if (angleDiff < 0.1 && distance > maxDistance) {
      maxDistance = distance;
      boundaryPoint = point;
    }
  }
  
  // If no close point found, create one
  if (maxDistance === 0) {
    const avgRadius = baseShape.reduce((sum, p) => sum + Math.sqrt((p.x - center.x) ** 2 + (p.y - center.y) ** 2), 0) / baseShape.length;
    boundaryPoint = {
      x: center.x + direction.x * avgRadius,
      y: center.y + direction.y * avgRadius
    };
  }
  
  return boundaryPoint;
};

const createFallbackShape = (center: Point, regionIndex: number, totalRegions: number): Point[] => {
  const vertices: Point[] = [];
  const baseRadius = 80;
  const numVertices = 6;
  
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * 2 * Math.PI + (regionIndex * Math.PI / totalRegions);
    const radius = baseRadius * (0.8 + Math.random() * 0.4);
    
    vertices.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    });
  }
  
  return vertices;
};

const applyLogicalAdjacencies = (regions: Region[], graphCalculator: GraphColoringCalculator): void => {
  // Reset adjacencies
  regions.forEach(region => {
    region.adjacentRegions = [];
  });

  // Apply adjacencies from the logical graph structure
  const nodes = graphCalculator.getNodes();
  nodes.forEach(node => {
    const region = regions.find(r => r.id === node.id);
    if (region) {
      region.adjacentRegions = Array.from(node.adjacents);
    }
  });
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