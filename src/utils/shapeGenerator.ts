
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
  const margin = 80;
  const usableWidth = boardWidth - 2 * margin;
  const usableHeight = boardHeight - 2 * margin;
  
  // Determine complexity based on difficulty
  const complexity = {
    easy: { regions: 6, subdivisions: 2, irregularity: 0.3 },
    medium: { regions: 10, subdivisions: 3, irregularity: 0.5 },
    hard: { regions: 15, subdivisions: 4, irregularity: 0.7 }
  }[difficulty];

  // Create a large organic base shape
  const baseShape = createOrganicBaseShape(
    margin + usableWidth / 2,
    margin + usableHeight / 2,
    Math.min(usableWidth, usableHeight) * 0.8,
    complexity.irregularity
  );

  // Subdivide the base shape into regions using Voronoi-like approach
  const regionCenters = generateRegionCenters(
    baseShape,
    complexity.regions,
    margin,
    usableWidth,
    usableHeight
  );

  // Create regions by subdividing the base shape
  regionCenters.forEach((center, index) => {
    const regionVertices = createRegionFromCenter(
      center,
      baseShape,
      regionCenters,
      index,
      complexity.subdivisions,
      complexity.irregularity
    );

    regions.push({
      id: `region-${index}`,
      vertices: regionVertices,
      center,
      adjacentRegions: [],
      color: null
    });
  });

  // Calculate adjacency between regions
  calculateRegionAdjacency(regions);

  return regions;
};

const createOrganicBaseShape = (
  centerX: number,
  centerY: number,
  size: number,
  irregularity: number
): ShapeVertex[] => {
  const vertices: ShapeVertex[] = [];
  const vertexCount = 20 + Math.floor(Math.random() * 15);

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i * 2 * Math.PI) / vertexCount;
    
    // Create organic, brain-like outer boundary
    const radiusVariation = 0.6 + Math.random() * 0.8;
    const roughness = 0.8 + Math.random() * 0.4;
    const bumpFactor = Math.sin(angle * 4 + Math.random() * Math.PI) * irregularity;
    const noiseFactor = Math.sin(angle * 8 + Math.random() * Math.PI) * (irregularity * 0.3);
    
    const radius = (size / 2) * radiusVariation * roughness * (1 + bumpFactor + noiseFactor);
    
    // Add angular distortion
    const angleDistortion = (Math.random() - 0.5) * irregularity;
    const distortedAngle = angle + angleDistortion;
    
    // Add positional jitter
    const jitterX = (Math.random() - 0.5) * size * irregularity * 0.1;
    const jitterY = (Math.random() - 0.5) * size * irregularity * 0.1;
    
    const x = centerX + Math.cos(distortedAngle) * radius + jitterX;
    const y = centerY + Math.sin(distortedAngle) * radius + jitterY;
    
    vertices.push({ x, y });
  }

  return vertices;
};

const generateRegionCenters = (
  baseShape: ShapeVertex[],
  regionCount: number,
  margin: number,
  usableWidth: number,
  usableHeight: number
): { x: number; y: number }[] => {
  const centers: { x: number; y: number }[] = [];
  
  // Calculate bounds of the base shape
  const bounds = {
    minX: Math.min(...baseShape.map(v => v.x)),
    maxX: Math.max(...baseShape.map(v => v.x)),
    minY: Math.min(...baseShape.map(v => v.y)),
    maxY: Math.max(...baseShape.map(v => v.y))
  };

  // Generate region centers within the base shape bounds
  for (let i = 0; i < regionCount; i++) {
    let attempts = 0;
    let center: { x: number; y: number };
    
    do {
      center = {
        x: bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
        y: bounds.minY + Math.random() * (bounds.maxY - bounds.minY)
      };
      attempts++;
    } while (attempts < 50 && !isPointInPolygon(center, baseShape));
    
    centers.push(center);
  }

  return centers;
};

const createRegionFromCenter = (
  center: { x: number; y: number },
  baseShape: ShapeVertex[],
  allCenters: { x: number; y: number }[],
  regionIndex: number,
  subdivisions: number,
  irregularity: number
): ShapeVertex[] => {
  const vertices: ShapeVertex[] = [];
  const baseRadius = 40 + Math.random() * 30;
  const vertexCount = 6 + Math.floor(Math.random() * (subdivisions * 2));

  for (let i = 0; i < vertexCount; i++) {
    const angle = (i * 2 * Math.PI) / vertexCount;
    
    // Create irregular region boundaries
    const radiusVariation = 0.5 + Math.random() * 0.8;
    const organicFactor = Math.sin(angle * 3 + Math.random() * Math.PI) * irregularity * 0.5;
    const noiseFactor = Math.sin(angle * 7 + Math.random() * Math.PI) * irregularity * 0.2;
    
    const radius = baseRadius * radiusVariation * (1 + organicFactor + noiseFactor);
    
    // Add distortion
    const angleDistortion = (Math.random() - 0.5) * irregularity * 0.5;
    const distortedAngle = angle + angleDistortion;
    
    const x = center.x + Math.cos(distortedAngle) * radius;
    const y = center.y + Math.sin(distortedAngle) * radius;
    
    vertices.push({ x, y });
  }

  // Add some random bulges for extra complexity
  for (let i = 0; i < subdivisions; i++) {
    const insertIndex = Math.floor(Math.random() * vertices.length);
    const prevVertex = vertices[insertIndex];
    const nextVertex = vertices[(insertIndex + 1) % vertices.length];
    
    const midX = (prevVertex.x + nextVertex.x) / 2;
    const midY = (prevVertex.y + nextVertex.y) / 2;
    
    const bulgeDirection = Math.random() * Math.PI * 2;
    const bulgeMagnitude = (Math.random() - 0.3) * baseRadius * irregularity;
    
    const bulgeX = midX + Math.cos(bulgeDirection) * bulgeMagnitude;
    const bulgeY = midY + Math.sin(bulgeDirection) * bulgeMagnitude;
    
    vertices.splice(insertIndex + 1, 0, { x: bulgeX, y: bulgeY });
  }

  return vertices;
};

const calculateRegionAdjacency = (regions: Region[]) => {
  regions.forEach((region, index) => {
    regions.forEach((otherRegion, otherIndex) => {
      if (index !== otherIndex) {
        // Check if regions are adjacent by checking if their boundaries are close
        const distance = Math.sqrt(
          Math.pow(region.center.x - otherRegion.center.x, 2) +
          Math.pow(region.center.y - otherRegion.center.y, 2)
        );
        
        // More generous adjacency for organic shapes
        const threshold = 80 + Math.random() * 40;
        
        if (distance < threshold) {
          if (!region.adjacentRegions.includes(otherRegion.id)) {
            region.adjacentRegions.push(otherRegion.id);
          }
        }
      }
    });
  });
};

const isPointInPolygon = (point: { x: number; y: number }, polygon: ShapeVertex[]): boolean => {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (
      ((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
      (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)
    ) {
      inside = !inside;
    }
  }
  
  return inside;
};

export const getDifficultyConfig = (difficulty: Difficulty, level: number) => {
  const configs = {
    easy: {
      regionCount: Math.min(6 + level, 8),
      complexity: 0.3,
      minColors: 3,
    },
    medium: {
      regionCount: Math.min(10 + level, 13),
      complexity: 0.5,
      minColors: 4,
    },
    hard: {
      regionCount: Math.min(15 + level, 18),
      complexity: 0.7,
      minColors: 5,
    },
  };
  
  return configs[difficulty];
};
