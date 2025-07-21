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

  // Generate geometric regions first
  const regions = generateGeometricRegions(numRegions, width, height);
  
  // Calculate adjacencies based on actual geometric boundaries
  updateGeometricAdjacencies(regions);

  return regions;
};

const generateGeometricRegions = (
  numRegions: number, 
  width: number, 
  height: number
): Region[] => {
  const regions: Region[] = [];
  const margin = 60;
  const usedWidth = width - 2 * margin;
  const usedHeight = height - 2 * margin;

  // Create node objects for compatibility
  const nodes = [];
  for (let i = 1; i <= numRegions; i++) {
    nodes.push({ id: `region-${i}` });
  }

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
  
  // Create random internal divisions like the reference image
  return createRandomDivisions(baseShape, nodes, width, height, margin);
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


const createRandomDivisions = (
  baseShape: Point[],
  nodes: { id: string }[],
  width: number,
  height: number,
  margin: number
): Region[] => {
  const regions: Region[] = [];
  const numRegions = nodes.length;
  
  // For simple cases, handle directly
  if (numRegions === 1) {
    return [{
      id: nodes[0].id,
      vertices: baseShape,
      center: calculateCentroid(baseShape),
      color: null,
      adjacentRegions: []
    }];
  }
  
  // Create regions by recursive subdivision that ensures shared edges
  return subdivideShapeRecursively(baseShape, nodes, 0);
};

const subdivideShapeRecursively = (
  shape: Point[],
  nodes: { id: string }[],
  depth: number
): Region[] => {
  if (nodes.length <= 1) {
    return nodes.length === 1 ? [{
      id: nodes[0].id,
      vertices: shape,
      center: calculateCentroid(shape),
      color: null,
      adjacentRegions: []
    }] : [];
  }
  
  if (nodes.length === 2) {
    const [part1, part2] = dividePoly(shape);
    return [
      {
        id: nodes[0].id,
        vertices: part1,
        center: calculateCentroid(part1),
        color: null,
        adjacentRegions: []
      },
      {
        id: nodes[1].id,
        vertices: part2,
        center: calculateCentroid(part2),
        color: null,
        adjacentRegions: []
      }
    ];
  }
  
  // For more than 2 regions, divide recursively
  const [part1, part2] = dividePoly(shape);
  const mid = Math.floor(nodes.length / 2);
  const nodes1 = nodes.slice(0, mid);
  const nodes2 = nodes.slice(mid);
  
  const regions1 = subdivideShapeRecursively(part1, nodes1, depth + 1);
  const regions2 = subdivideShapeRecursively(part2, nodes2, depth + 1);
  
  return [...regions1, ...regions2];
};

const dividePoly = (shape: Point[]): [Point[], Point[]] => {
  if (shape.length < 4) {
    // If too few points, create a simple division
    const mid = Math.floor(shape.length / 2);
    return [shape.slice(0, mid + 1), shape.slice(mid)];
  }
  
  const center = calculateCentroid(shape);
  
  // Create more random and interesting division patterns
  const numPoints = shape.length;
  const startIdx = Math.floor(Math.random() * numPoints);
  
  // Instead of opposite points, create more varied divisions
  const minSeparation = Math.floor(numPoints / 4);
  const maxSeparation = Math.floor(numPoints * 3 / 4);
  const separation = minSeparation + Math.floor(Math.random() * (maxSeparation - minSeparation));
  const endIdx = (startIdx + separation) % numPoints;
  
  const startPoint = shape[startIdx];
  const endPoint = shape[endIdx];
  
  // Create multiple interconnected division lines for more complex shapes
  const primaryDivision = createDivisionLine(startPoint, endPoint, center);
  
  // Add branch lines occasionally for more complexity
  const branchDivisions = createBranchDivisions(primaryDivision, shape, center);
  
  // Combine all division points
  const allDivisionPoints = [...primaryDivision, ...branchDivisions];
  
  // Split the polygon along this complex line
  return splitPolygonAlongComplexLine(shape, startIdx, endIdx, allDivisionPoints);
};

const createBranchDivisions = (mainLine: Point[], shape: Point[], center: Point): Point[] => {
  const branches: Point[] = [];
  
  // Reduce chance of branch lines to prevent creating very thin regions
  if (Math.random() < 0.15 && mainLine.length > 2) { // Reduced from 30% to 15%
    const branchStart = mainLine[Math.floor(mainLine.length / 2)];
    
    // Find a random point on the perimeter for branch end
    const branchEndIdx = Math.floor(Math.random() * shape.length);
    const branchEnd = shape[branchEndIdx];
    
    // Create a shorter, more curved branch
    const branchPoints = createShortCurvyLine(branchStart, branchEnd, center);
    branches.push(...branchPoints);
  }
  
  return branches;
};

const createShortCurvyLine = (start: Point, end: Point, center: Point): Point[] => {
  const points: Point[] = [];
  const numPoints = 2 + Math.floor(Math.random() * 2); // 2-3 points
  
  for (let i = 1; i < numPoints; i++) {
    const t = i / numPoints;
    const baseX = start.x + t * (end.x - start.x);
    const baseY = start.y + t * (end.y - start.y);
    
    // Add curved variation
    const curve = Math.sin(t * Math.PI) * (Math.random() - 0.5) * 40;
    const perpX = -(end.y - start.y);
    const perpY = (end.x - start.x);
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
    
    if (perpLength > 0) {
      points.push({
        x: baseX + (perpX / perpLength) * curve,
        y: baseY + (perpY / perpLength) * curve
      });
    }
  }
  
  return points;
};

const createDivisionLine = (start: Point, end: Point, center: Point): Point[] => {
  const divisionPoints: Point[] = [start];
  
  // Reduce complexity to avoid extremely thin regions
  const numIntermediatePoints = 2 + Math.floor(Math.random() * 3); // 2-4 points instead of 4-7
  
  for (let i = 1; i < numIntermediatePoints; i++) {
    const t = i / numIntermediatePoints;
    const baseX = start.x + t * (end.x - start.x);
    const baseY = start.y + t * (end.y - start.y);
    
    // Reduce the dramatic curves to prevent extremely thin regions
    const toCenterX = center.x - baseX;
    const toCenterY = center.y - baseY;
    
    // Reduce curvature complexity and amplitude
    const curvature1 = Math.sin(t * Math.PI * 2) * (Math.random() - 0.5) * 0.4; // Reduced from 0.8
    const curvature2 = Math.sin(t * Math.PI * 3) * (Math.random() - 0.5) * 0.2; // Reduced from 0.4
    
    const totalCurvature = curvature1 + curvature2;
    
    // Reduce perpendicular offset to avoid thin regions
    const perpX = -(end.y - start.y);
    const perpY = (end.x - start.x);
    const perpLength = Math.sqrt(perpX * perpX + perpY * perpY);
    const normalizedPerpX = perpLength > 0 ? perpX / perpLength : 0;
    const normalizedPerpY = perpLength > 0 ? perpY / perpLength : 0;
    
    // Reduced tangent offset to prevent extremely thin regions
    const tangentOffset = (Math.random() - 0.5) * 30; // Reduced from 60
    
    divisionPoints.push({
      x: baseX + toCenterX * totalCurvature + normalizedPerpX * tangentOffset,
      y: baseY + toCenterY * totalCurvature + normalizedPerpY * tangentOffset
    });
  }
  
  divisionPoints.push(end);
  return divisionPoints;
};

const removeDuplicatePoints = (points: Point[]): Point[] => {
  const tolerance = 5;
  const uniquePoints: Point[] = [];
  
  for (const point of points) {
    const isDuplicate = uniquePoints.some(existing => 
      distance(point, existing) < tolerance
    );
    if (!isDuplicate) {
      uniquePoints.push(point);
    }
  }
  
  return uniquePoints;
};

const splitPolygonAlongComplexLine = (
  shape: Point[], 
  startIdx: number, 
  endIdx: number, 
  allDivisionPoints: Point[]
): [Point[], Point[]] => {
  const part1: Point[] = [];
  const part2: Point[] = [];
  
  // Add points from start to end (clockwise)
  let currentIdx = startIdx;
  while (currentIdx !== endIdx) {
    part1.push(shape[currentIdx]);
    currentIdx = (currentIdx + 1) % shape.length;
  }
  part1.push(shape[endIdx]);
  
  // Add division line points in reverse for part1 - but filter for unique points
  const uniqueDivisionPoints = removeDuplicatePoints(allDivisionPoints);
  for (let i = uniqueDivisionPoints.length - 1; i >= 0; i--) {
    part1.push(uniqueDivisionPoints[i]);
  }
  
  // Add points from end to start (continuing clockwise)
  currentIdx = endIdx;
  while (currentIdx !== startIdx) {
    part2.push(shape[currentIdx]);
    currentIdx = (currentIdx + 1) % shape.length;
  }
  part2.push(shape[startIdx]);
  
  // Add division line points for part2
  for (const point of uniqueDivisionPoints) {
    part2.push(point);
  }
  
  // Clean up and ensure valid polygons
  const cleanPart1 = removeDuplicatePoints(part1);
  const cleanPart2 = removeDuplicatePoints(part2);
  
  if (cleanPart1.length < 3) {
    return [shape, []];
  }
  if (cleanPart2.length < 3) {
    return [shape, []];
  }
  
  return [cleanPart1, cleanPart2];
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