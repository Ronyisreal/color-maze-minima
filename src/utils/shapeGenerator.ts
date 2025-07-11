import { Difficulty } from '@/components/DifficultySelector';

export interface ShapeVertex {
  x: number;
  y: number;
}

export interface Region {
  id: string;
  vertices: ShapeVertex[];
  center: { x: number; y: number };
  adjacentRegions: string[];
  color: string | null;
}

export const generateLargeComplexShape = (
  boardWidth: number,
  boardHeight: number,
  difficulty: Difficulty
): Region[] => {
  const regions: Region[] = [];
  const margin = 40;
  const usableWidth = boardWidth - 2 * margin;
  const usableHeight = boardHeight - 2 * margin;
  
  // Determine complexity based on difficulty
  const complexity = {
    easy: { regions: 8, gridSize: 3, irregularity: 0.4 },
    medium: { regions: 12, gridSize: 4, irregularity: 0.6 },
    hard: { regions: 16, gridSize: 5, irregularity: 0.8 }
  }[difficulty];

  // Create a grid-based interconnected shape that fills the canvas
  const gridWidth = usableWidth / complexity.gridSize;
  const gridHeight = usableHeight / complexity.gridSize;
  
  // Generate interconnected regions using a modified Voronoi approach
  const regionCenters = generateInterconnectedCenters(
    margin,
    usableWidth,
    usableHeight,
    complexity.regions,
    complexity.gridSize
  );

  // Create the main interconnected shape boundary
  const mainBoundary = createMainShapeBoundary(
    margin,
    usableWidth,
    usableHeight,
    complexity.irregularity
  );

  // Create regions by subdividing the main shape
  regionCenters.forEach((center, index) => {
    const regionVertices = createInterconnectedRegion(
      center,
      regionCenters,
      index,
      mainBoundary,
      complexity.irregularity,
      gridWidth,
      gridHeight
    );

    regions.push({
      id: `region-${index}`,
      vertices: regionVertices,
      center,
      adjacentRegions: [],
      color: null
    });
  });

  // Ensure all regions are properly connected
  calculateProperAdjacency(regions);
  
  // Fix any disconnected regions
  ensureConnectivity(regions);

  return regions;
};

const generateInterconnectedCenters = (
  margin: number,
  usableWidth: number,
  usableHeight: number,
  regionCount: number,
  gridSize: number
): { x: number; y: number }[] => {
  const centers: { x: number; y: number }[] = [];
  const cellWidth = usableWidth / gridSize;
  const cellHeight = usableHeight / gridSize;
  
  // Create a more distributed pattern across the entire canvas
  for (let i = 0; i < regionCount; i++) {
    const row = Math.floor(i / Math.ceil(Math.sqrt(regionCount)));
    const col = i % Math.ceil(Math.sqrt(regionCount));
    
    const baseX = margin + (col * usableWidth) / Math.ceil(Math.sqrt(regionCount));
    const baseY = margin + (row * usableHeight) / Math.ceil(Math.sqrt(regionCount));
    
    // Add some randomization but keep regions spread out
    const jitterX = (Math.random() - 0.5) * (usableWidth / regionCount) * 0.8;
    const jitterY = (Math.random() - 0.5) * (usableHeight / regionCount) * 0.8;
    
    centers.push({
      x: Math.max(margin + 50, Math.min(margin + usableWidth - 50, baseX + jitterX)),
      y: Math.max(margin + 50, Math.min(margin + usableHeight - 50, baseY + jitterY))
    });
  }
  
  return centers;
};

const createMainShapeBoundary = (
  margin: number,
  usableWidth: number,
  usableHeight: number,
  irregularity: number
): ShapeVertex[] => {
  const vertices: ShapeVertex[] = [];
  const centerX = margin + usableWidth / 2;
  const centerY = margin + usableHeight / 2;
  const vertexCount = 24 + Math.floor(Math.random() * 16);

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i * 2 * Math.PI) / vertexCount;
    
    // Create boundary that uses most of the canvas
    const baseRadiusX = (usableWidth / 2) * 0.9;
    const baseRadiusY = (usableHeight / 2) * 0.9;
    
    // Add organic variation
    const radiusVariationX = 0.7 + Math.random() * 0.6;
    const radiusVariationY = 0.7 + Math.random() * 0.6;
    
    const organicFactor = Math.sin(angle * 3 + Math.random() * Math.PI) * irregularity * 0.3;
    const noiseFactor = Math.sin(angle * 7 + Math.random() * Math.PI) * irregularity * 0.15;
    
    const radiusX = baseRadiusX * radiusVariationX * (1 + organicFactor + noiseFactor);
    const radiusY = baseRadiusY * radiusVariationY * (1 + organicFactor + noiseFactor);
    
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY;
    
    vertices.push({ x, y });
  }

  return vertices;
};

const createInterconnectedRegion = (
  center: { x: number; y: number },
  allCenters: { x: number; y: number }[],
  regionIndex: number,
  mainBoundary: ShapeVertex[],
  irregularity: number,
  gridWidth: number,
  gridHeight: number
): ShapeVertex[] => {
  const vertices: ShapeVertex[] = [];
  
  // Create regions that connect to nearby regions
  const nearbyRegions = allCenters
    .map((otherCenter, index) => ({ center: otherCenter, index, distance: Math.sqrt(Math.pow(center.x - otherCenter.x, 2) + Math.pow(center.y - otherCenter.y, 2)) }))
    .filter(item => item.index !== regionIndex)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4); // Connect to 4 nearest regions

  // Create Voronoi-like cell boundaries but with organic shapes
  const baseRadius = Math.min(gridWidth, gridHeight) * 0.4;
  const vertexCount = 8 + Math.floor(Math.random() * 6);

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i * 2 * Math.PI) / vertexCount;
    
    // Create organic, interconnected boundaries
    let radius = baseRadius;
    
    // Adjust radius based on nearby regions to create connections
    nearbyRegions.forEach(nearby => {
      const angleToNearby = Math.atan2(nearby.center.y - center.y, nearby.center.x - center.x);
      const angleDiff = Math.abs(angle - angleToNearby);
      const normalizedAngleDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);
      
      if (normalizedAngleDiff < Math.PI / 3) {
        // Extend towards nearby regions
        radius *= (1 + 0.3 * (1 - normalizedAngleDiff / (Math.PI / 3)));
      }
    });
    
    // Add organic variation
    const organicFactor = Math.sin(angle * 4 + regionIndex) * irregularity * 0.4;
    const noiseFactor = Math.sin(angle * 8 + regionIndex * 2) * irregularity * 0.2;
    
    radius *= (0.6 + Math.random() * 0.8) * (1 + organicFactor + noiseFactor);
    
    // Add some angular distortion
    const angleDistortion = (Math.random() - 0.5) * irregularity * 0.3;
    const distortedAngle = angle + angleDistortion;
    
    const x = center.x + Math.cos(distortedAngle) * radius;
    const y = center.y + Math.sin(distortedAngle) * radius;
    
    vertices.push({ x, y });
  }

  // Add some irregular bulges for complexity
  const bulgeCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < bulgeCount; i++) {
    const insertIndex = Math.floor(Math.random() * vertices.length);
    const prevVertex = vertices[insertIndex];
    const nextVertex = vertices[(insertIndex + 1) % vertices.length];
    
    const midX = (prevVertex.x + nextVertex.x) / 2;
    const midY = (prevVertex.y + nextVertex.y) / 2;
    
    const bulgeDirection = Math.random() * Math.PI * 2;
    const bulgeMagnitude = (Math.random() - 0.2) * baseRadius * irregularity * 0.5;
    
    const bulgeX = midX + Math.cos(bulgeDirection) * bulgeMagnitude;
    const bulgeY = midY + Math.sin(bulgeDirection) * bulgeMagnitude;
    
    vertices.splice(insertIndex + 1, 0, { x: bulgeX, y: bulgeY });
  }

  return vertices;
};

const calculateProperAdjacency = (regions: Region[]) => {
  regions.forEach((region, index) => {
    regions.forEach((otherRegion, otherIndex) => {
      if (index !== otherIndex) {
        // Check if regions share boundaries or are very close
        const distance = Math.sqrt(
          Math.pow(region.center.x - otherRegion.center.x, 2) +
          Math.pow(region.center.y - otherRegion.center.y, 2)
        );
        
        // More generous adjacency threshold for interconnected shapes
        const threshold = 120 + Math.random() * 30;
        
        if (distance < threshold) {
          // Also check if polygons actually intersect or are very close
          if (regionsAreAdjacent(region, otherRegion)) {
            if (!region.adjacentRegions.includes(otherRegion.id)) {
              region.adjacentRegions.push(otherRegion.id);
            }
          }
        }
      }
    });
  });
};

const regionsAreAdjacent = (region1: Region, region2: Region): boolean => {
  // Check if any vertex of region1 is close to any edge of region2
  for (const vertex1 of region1.vertices) {
    for (let i = 0; i < region2.vertices.length; i++) {
      const vertex2a = region2.vertices[i];
      const vertex2b = region2.vertices[(i + 1) % region2.vertices.length];
      
      const distance = pointToLineDistance(vertex1, vertex2a, vertex2b);
      if (distance < 25) return true;
    }
  }
  
  // Check if any vertex of region2 is close to any edge of region1
  for (const vertex2 of region2.vertices) {
    for (let i = 0; i < region1.vertices.length; i++) {
      const vertex1a = region1.vertices[i];
      const vertex1b = region1.vertices[(i + 1) % region1.vertices.length];
      
      const distance = pointToLineDistance(vertex2, vertex1a, vertex1b);
      if (distance < 25) return true;
    }
  }
  
  return false;
};

const pointToLineDistance = (point: ShapeVertex, lineStart: ShapeVertex, lineEnd: ShapeVertex): number => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

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

const ensureConnectivity = (regions: Region[]) => {
  // Ensure each region has at least 2 connections to avoid isolated regions
  regions.forEach(region => {
    if (region.adjacentRegions.length < 2) {
      // Find the closest regions and force connections
      const distances = regions
        .filter(other => other.id !== region.id && !region.adjacentRegions.includes(other.id))
        .map(other => ({
          region: other,
          distance: Math.sqrt(
            Math.pow(region.center.x - other.center.x, 2) +
            Math.pow(region.center.y - other.center.y, 2)
          )
        }))
        .sort((a, b) => a.distance - b.distance);
      
      // Add connections to the closest regions
      const connectionsNeeded = Math.max(0, 2 - region.adjacentRegions.length);
      for (let i = 0; i < Math.min(connectionsNeeded, distances.length); i++) {
        const targetRegion = distances[i].region;
        region.adjacentRegions.push(targetRegion.id);
        if (!targetRegion.adjacentRegions.includes(region.id)) {
          targetRegion.adjacentRegions.push(region.id);
        }
      }
    }
  });
};

export const getDifficultyConfig = (difficulty: Difficulty, level: number) => {
  const configs = {
    easy: {
      regionCount: Math.min(8 + level, 10),
      complexity: 0.4,
      minColors: 3,
    },
    medium: {
      regionCount: Math.min(12 + level, 15),
      complexity: 0.6,
      minColors: 4,
    },
    hard: {
      regionCount: Math.min(16 + level, 20),
      complexity: 0.8,
      minColors: 5,
    },
  };
  
  return configs[difficulty];
};
