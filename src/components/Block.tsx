
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
    return block.color || '#ffffff';
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
      />
    );
  };

  return (
    <g>
      {renderShape()}
      <text
        x={block.center.x}
        y={block.center.y}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-lg font-bold pointer-events-none select-none"
        fill={block.color ? '#ffffff' : '#1f2937'}
        stroke={block.color ? '#000000' : '#ffffff'}
        strokeWidth="0.5"
        style={{ fontSize: '18px', fontWeight: 'bold' }}
      >
        {block.id.split('-')[1]}
      </text>
    </g>
  );
};
