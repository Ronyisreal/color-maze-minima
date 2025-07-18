
import React from 'react';
import { Region } from '@/utils/shapeGenerator';

interface BlockProps {
  block: Region;
  onColor: (blockId: string, color: string) => void;
  isSelected: boolean;
}

export const Block: React.FC<BlockProps> = ({ block, onColor, isSelected }) => {
  const handleClick = () => {
    onColor(block.id, block.color || '');
  };

  const getStroke = () => {
    if (isSelected) return '#000000';
    if (block.color) return '#374151';
    return '#9ca3af';
  };

  const getFill = () => {
    return block.color || '#eee'; // visible gray for debugging
  };

  const renderShape = () => {
    const strokeWidth = isSelected ? 3 : 2;
    const className = "cursor-pointer hover:stroke-gray-800 transition-all duration-200";

    const points = block.vertices.map(v => `${v.x},${v.y}`).join(' ');
    return (
      <polygon
        points={points}
        fill={getFill()}
        stroke={getStroke()}
        strokeWidth={strokeWidth}
        className={className}
        onClick={handleClick}
        opacity={0.8}
      />
    );
  };

  // Calculate a better center position that's guaranteed to be inside the polygon
  const getTextPosition = () => {
    // Use the calculated centroid, but ensure it's well within the shape
    const centroid = block.center;
    
    // For better visibility, we can slightly adjust the position
    // by moving it towards the center of the bounding box
    const minX = Math.min(...block.vertices.map(v => v.x));
    const maxX = Math.max(...block.vertices.map(v => v.x));
    const minY = Math.min(...block.vertices.map(v => v.y));
    const maxY = Math.max(...block.vertices.map(v => v.y));
    
    const boxCenter = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };
    
    // Use a weighted average to ensure the text is well inside
    const adjustedCenter = {
      x: centroid.x * 0.7 + boxCenter.x * 0.3,
      y: centroid.y * 0.7 + boxCenter.y * 0.3
    };
    
    return adjustedCenter;
  };

  const textPosition = getTextPosition();

  return (
    <g>
      {renderShape()}
      <text
        x={textPosition.x}
        y={textPosition.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-lg font-bold pointer-events-none select-none"
        fill={block.color ? '#ffffff' : '#1f2937'}
        stroke={block.color ? '#000000' : '#ffffff'}
        strokeWidth="0.5"
        style={{ fontSize: '20px', fontWeight: 'bold' }}
      >
        {block.id.split('-')[1]}
      </text>
    </g>
  );
};
