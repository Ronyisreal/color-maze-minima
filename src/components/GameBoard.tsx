
import React, { useState, useEffect } from 'react';
import { Block } from './Block';
import { ColorPalette } from './ColorPalette';
import { GameStats } from './GameStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Lightbulb, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export interface BlockData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string | null;
  adjacentBlocks: string[];
  shape: 'circle' | 'rectangle' | 'polygon';
  vertices?: { x: number; y: number }[];
}

const AVAILABLE_COLORS = [
  { name: 'Red', value: '#ef4444', hex: '#ef4444' },
  { name: 'Blue', value: '#3b82f6', hex: '#3b82f6' },
  { name: 'Green', value: '#10b981', hex: '#10b981' },
  { name: 'Yellow', value: '#f59e0b', hex: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6', hex: '#8b5cf6' },
  { name: 'Orange', value: '#f97316', hex: '#f97316' },
];

export const GameBoard: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [colorsUsed, setColorsUsed] = useState(0);
  const [minimumColors, setMinimumColors] = useState(0);
  const [level, setLevel] = useState(1);

  const generateRandomBlocks = (count: number = 8) => {
    const newBlocks: BlockData[] = [];
    const boardWidth = 600;
    const boardHeight = 400;

    for (let i = 0; i < count; i++) {
      const shape = Math.random() > 0.3 ? 'polygon' : 'circle';
      const x = Math.random() * (boardWidth - 100) + 50;
      const y = Math.random() * (boardHeight - 100) + 50;
      const size = 40 + Math.random() * 40;

      let vertices: { x: number; y: number }[] = [];
      if (shape === 'polygon') {
        const sides = 3 + Math.floor(Math.random() * 4); // 3-6 sides
        for (let j = 0; j < sides; j++) {
          const angle = (j * 2 * Math.PI) / sides;
          vertices.push({
            x: x + Math.cos(angle) * size,
            y: y + Math.sin(angle) * size,
          });
        }
      }

      newBlocks.push({
        id: `block-${i}`,
        x,
        y,
        width: size,
        height: size,
        color: null,
        adjacentBlocks: [],
        shape,
        vertices: shape === 'polygon' ? vertices : undefined,
      });
    }

    // Calculate adjacency based on distance and overlap
    newBlocks.forEach((block, index) => {
      newBlocks.forEach((otherBlock, otherIndex) => {
        if (index !== otherIndex) {
          const distance = Math.sqrt(
            Math.pow(block.x - otherBlock.x, 2) + Math.pow(block.y - otherBlock.y, 2)
          );
          const threshold = (block.width + otherBlock.width) / 2.5; // Adjust for overlap detection
          
          if (distance < threshold) {
            if (!block.adjacentBlocks.includes(otherBlock.id)) {
              block.adjacentBlocks.push(otherBlock.id);
            }
          }
        }
      });
    });

    // Calculate minimum colors needed using a simple greedy approach
    const minColors = calculateMinimumColors(newBlocks);
    setMinimumColors(minColors);
    setBlocks(newBlocks);
  };

  const calculateMinimumColors = (blocks: BlockData[]): number => {
    // Simple greedy coloring to estimate minimum colors
    const tempBlocks = [...blocks];
    const colorMap = new Map<string, number>();
    let colorCount = 0;

    tempBlocks.forEach(block => {
      const usedColors = new Set<number>();
      block.adjacentBlocks.forEach(adjId => {
        if (colorMap.has(adjId)) {
          usedColors.add(colorMap.get(adjId)!);
        }
      });

      let color = 0;
      while (usedColors.has(color)) {
        color++;
      }

      colorMap.set(block.id, color);
      colorCount = Math.max(colorCount, color + 1);
    });

    return colorCount;
  };

  const handleBlockColor = (blockId: string, color: string) => {
    if (!selectedColor) {
      toast({
        title: "Select a color first",
        description: "Choose a color from the palette before coloring blocks.",
        variant: "destructive",
      });
      return;
    }

    const updatedBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return { ...block, color: selectedColor };
      }
      return block;
    });

    // Check for adjacency conflicts
    const targetBlock = updatedBlocks.find(b => b.id === blockId);
    if (targetBlock) {
      const hasConflict = targetBlock.adjacentBlocks.some(adjId => {
        const adjBlock = updatedBlocks.find(b => b.id === adjId);
        return adjBlock && adjBlock.color === selectedColor;
      });

      if (hasConflict) {
        toast({
          title: "Invalid move!",
          description: "Adjacent blocks cannot have the same color.",
          variant: "destructive",
        });
        return;
      }
    }

    setBlocks(updatedBlocks);
    checkGameCompletion(updatedBlocks);
  };

  const checkGameCompletion = (currentBlocks: BlockData[]) => {
    const allColored = currentBlocks.every(block => block.color !== null);
    if (allColored) {
      const uniqueColors = new Set(currentBlocks.map(block => block.color).filter(Boolean));
      setColorsUsed(uniqueColors.size);
      setGameCompleted(true);
      
      const efficiency = minimumColors === uniqueColors.size ? "Perfect!" : "Good job!";
      toast({
        title: "Puzzle Completed! 🎉",
        description: `${efficiency} You used ${uniqueColors.size} colors (minimum: ${minimumColors})`,
      });
    }
  };

  const resetGame = () => {
    setGameCompleted(false);
    setColorsUsed(0);
    setSelectedColor(null);
    generateRandomBlocks(6 + level * 2);
  };

  const nextLevel = () => {
    setLevel(level + 1);
    resetGame();
  };

  const showHint = () => {
    toast({
      title: "Hint 💡",
      description: `Try to use exactly ${minimumColors} colors. Start with blocks that have the most neighbors!`,
    });
  };

  useEffect(() => {
    generateRandomBlocks(8);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Color Block Maze Solver</h1>
          <p className="text-gray-600">Color all blocks using the minimum number of colors. Adjacent blocks cannot share the same color!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Game Stats */}
          <div className="lg:col-span-1">
            <Card className="p-4 mb-4">
              <GameStats 
                level={level}
                minimumColors={minimumColors}
                colorsUsed={colorsUsed}
                gameCompleted={gameCompleted}
              />
            </Card>
            
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-3">Color Palette</h3>
              <ColorPalette
                colors={AVAILABLE_COLORS}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            </Card>

            <div className="space-y-2">
              <Button onClick={resetGame} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
              <Button onClick={showHint} className="w-full" variant="outline">
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </Button>
              {gameCompleted && (
                <Button onClick={nextLevel} className="w-full">
                  <Trophy className="w-4 h-4 mr-2" />
                  Next Level
                </Button>
              )}
            </div>
          </div>

          {/* Game Board */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden" style={{ height: '500px' }}>
                <svg width="100%" height="100%" className="absolute inset-0">
                  {/* Draw connection lines */}
                  {blocks.map(block => 
                    block.adjacentBlocks.map(adjId => {
                      const adjBlock = blocks.find(b => b.id === adjId);
                      if (adjBlock && block.id < adjId) { // Avoid duplicate lines
                        return (
                          <line
                            key={`${block.id}-${adjId}`}
                            x1={block.x}
                            y1={block.y}
                            x2={adjBlock.x}
                            y2={adjBlock.y}
                            stroke="#e5e7eb"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        );
                      }
                      return null;
                    })
                  )}
                  
                  {/* Render blocks */}
                  {blocks.map(block => (
                    <Block
                      key={block.id}
                      block={block}
                      onColor={handleBlockColor}
                      isSelected={false}
                    />
                  ))}
                </svg>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
