
import React from 'react';
import { BlockData } from './GameBoard';

interface BlockProps {
  block: BlockData;
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
    return block.color || '#ffffff';
  };

  const renderShape = () => {
    if (block.shape === 'circle') {
      return (
        <circle
          cx={block.x}
          cy={block.y}
          r={block.width / 2}
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={isSelected ? 3 : 2}
          className="cursor-pointer hover:stroke-gray-800 transition-all duration-200"
          onClick={handleClick}
        />
      );
    } else if (block.shape === 'polygon' && block.vertices) {
      const points = block.vertices.map(v => `${v.x},${v.y}`).join(' ');
      return (
        <polygon
          points={points}
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={isSelected ? 3 : 2}
          className="cursor-pointer hover:stroke-gray-800 transition-all duration-200"
          onClick={handleClick}
        />
      );
    } else {
      return (
        <rect
          x={block.x - block.width / 2}
          y={block.y - block.height / 2}
          width={block.width}
          height={block.height}
          fill={getFill()}
          stroke={getStroke()}
          strokeWidth={isSelected ? 3 : 2}
          className="cursor-pointer hover:stroke-gray-800 transition-all duration-200"
          onClick={handleClick}
        />
      );
    }
  };

  return (
    <g>
      {renderShape()}
      {/* Block ID label for debugging */}
      <text
        x={block.x}
        y={block.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-semibold pointer-events-none select-none"
        fill={block.color ? '#ffffff' : '#374151'}
      >
        {block.id.split('-')[1]}
      </text>
    </g>
  );
};
