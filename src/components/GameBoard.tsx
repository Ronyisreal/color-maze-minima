import React, { useState, useEffect } from 'react';
import { Block } from './Block';
import { ColorPalette } from './ColorPalette';
import { GameStats } from './GameStats';
import { DifficultySelector, Difficulty } from './DifficultySelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Lightbulb, Trophy, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateRandomShape, getDifficultyConfig, ShapeVertex } from '@/utils/shapeGenerator';
import { calculateScore, ScoreData } from '@/utils/scoreCalculator';

export interface BlockData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string | null;
  adjacentBlocks: string[];
  shape: string;
  vertices?: ShapeVertex[];
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
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState<ScoreData | null>(null);
  const [totalScore, setTotalScore] = useState(0);

  const generateRandomBlocks = (difficulty: Difficulty, level: number) => {
    const config = getDifficultyConfig(difficulty, level);
    const newBlocks: BlockData[] = [];
    const boardWidth = 600;
    const boardHeight = 400;
    const margin = 40; // Reduced margin for more crowded look

    // Generate blocks with chaotic, brain-like positioning
    for (let i = 0; i < config.blockCount; i++) {
      let x, y, attempts = 0;
      let validPosition = false;

      // Create clusters and tangles
      if (i > 0 && Math.random() < 0.6) {
        // 60% chance to place near existing blocks for clustering
        const existingBlock = newBlocks[Math.floor(Math.random() * newBlocks.length)];
        const clusterDistance = config.minSize * (0.8 + Math.random() * 0.6);
        const clusterAngle = Math.random() * Math.PI * 2;
        
        x = existingBlock.x + Math.cos(clusterAngle) * clusterDistance;
        y = existingBlock.y + Math.sin(clusterAngle) * clusterDistance;
        
        // Keep within bounds
        x = Math.max(margin, Math.min(boardWidth - margin, x));
        y = Math.max(margin, Math.min(boardHeight - margin, y));
      } else {
        // Random positioning for seed blocks
        x = margin + Math.random() * (boardWidth - 2 * margin);
        y = margin + Math.random() * (boardHeight - 2 * margin);
      }

      // Check for severe overlaps only (allow some overlap for tangled look)
      validPosition = newBlocks.every(block => {
        const distance = Math.sqrt(Math.pow(x - block.x, 2) + Math.pow(y - block.y, 2));
        return distance > (config.minSize * 0.3); // Allow much closer positioning
      });

      if (!validPosition && attempts < 20) {
        // If position is invalid, try a few more times but don't be too strict
        attempts++;
        if (attempts < 20) {
          i--; // Retry this block
          continue;
        }
      }

      const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
      const { shape, vertices } = generateRandomShape(x, y, size, difficulty);

      newBlocks.push({
        id: `block-${i}`,
        x,
        y,
        width: size,
        height: size,
        color: null,
        adjacentBlocks: [],
        shape,
        vertices,
      });
    }

    // Calculate adjacency with more liberal rules for tangled effect
    newBlocks.forEach((block, index) => {
      newBlocks.forEach((otherBlock, otherIndex) => {
        if (index !== otherIndex) {
          // Check if shapes actually overlap or are very close
          const distance = Math.sqrt(
            Math.pow(block.x - otherBlock.x, 2) + Math.pow(block.y - otherBlock.y, 2)
          );
          
          // More generous adjacency detection for organic shapes
          const baseThreshold = (block.width + otherBlock.width) / 2;
          const organicMultiplier = difficulty === 'easy' ? 1.4 : difficulty === 'medium' ? 1.3 : 1.2;
          const threshold = baseThreshold * organicMultiplier;
          
          if (distance < threshold) {
            if (!block.adjacentBlocks.includes(otherBlock.id)) {
              block.adjacentBlocks.push(otherBlock.id);
            }
          }
        }
      });
    });

    // Calculate minimum colors using Welsh-Powell algorithm
    const minColors = calculateMinimumColorsWelshPowell(newBlocks);
    setMinimumColors(Math.max(2, minColors)); // Ensure minimum is at least 2
    setBlocks(newBlocks);
  };

  const calculateMinimumColorsWelshPowell = (blocks: BlockData[]): number => {
    // Sort blocks by degree (number of adjacent blocks) in descending order
    const sortedBlocks = [...blocks].sort((a, b) => b.adjacentBlocks.length - a.adjacentBlocks.length);
    const colorMap = new Map<string, number>();
    let maxColor = 0;

    sortedBlocks.forEach(block => {
      const usedColors = new Set<number>();
      
      // Find colors used by adjacent blocks
      block.adjacentBlocks.forEach(adjId => {
        if (colorMap.has(adjId)) {
          usedColors.add(colorMap.get(adjId)!);
        }
      });

      // Find the smallest available color
      let color = 1;
      while (usedColors.has(color)) {
        color++;
      }

      colorMap.set(block.id, color);
      maxColor = Math.max(maxColor, color);
    });

    return maxColor;
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
      const usedColors = uniqueColors.size;
      setColorsUsed(usedColors);
      setGameCompleted(true);
      
      const scoreData = calculateScore(difficulty, minimumColors, usedColors, level);
      setScore(scoreData);
      setTotalScore(prev => prev + scoreData.totalScore);
      
      toast({
        title: `Puzzle Completed! Grade: ${scoreData.grade} 🎉`,
        description: `Score: ${scoreData.totalScore} points (${usedColors} colors used, minimum: ${minimumColors})`,
      });
    }
  };

  const resetGame = () => {
    setGameCompleted(false);
    setColorsUsed(0);
    setSelectedColor(null);
    setScore(null);
    generateRandomBlocks(difficulty, level);
  };

  const nextLevel = () => {
    setLevel(level + 1);
    resetGame();
  };

  const showHint = () => {
    // Find the block with most connections for hint
    const blockWithMostConnections = blocks.reduce((max, block) => 
      block.adjacentBlocks.length > max.adjacentBlocks.length ? block : max
    );
    
    toast({
      title: "Hint 💡",
      description: `Try coloring block ${blockWithMostConnections.id.split('-')[1]} first - it has ${blockWithMostConnections.adjacentBlocks.length} connections!`,
    });
  };

  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setLevel(1);
    setTotalScore(0);
    setGameCompleted(false);
    setScore(null);
    generateRandomBlocks(newDifficulty, 1);
  };

  useEffect(() => {
    generateRandomBlocks(difficulty, level);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Color Block Maze Solver</h1>
          <p className="text-gray-600">Color all blocks using the minimum number of colors. Adjacent blocks cannot share the same color!</p>
          {totalScore > 0 && (
            <div className="mt-2">
              <span className="text-lg font-semibold text-purple-600">Total Score: {totalScore}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <DifficultySelector 
              selectedDifficulty={difficulty}
              onDifficultyChange={changeDifficulty}
            />
            
            <Card className="p-4">
              <GameStats 
                level={level}
                minimumColors={minimumColors}
                colorsUsed={colorsUsed}
                gameCompleted={gameCompleted}
                score={score}
              />
            </Card>
            
            <Card className="p-4">
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

          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden" style={{ height: '500px' }}>
                <svg width="100%" height="100%" className="absolute inset-0">
                  {blocks.map(block => 
                    block.adjacentBlocks.map(adjId => {
                      const adjBlock = blocks.find(b => b.id === adjId);
                      if (adjBlock && block.id < adjId) {
                        return (
                          <line
                            key={`${block.id}-${adjId}`}
                            x1={block.x}
                            y1={block.y}
                            x2={adjBlock.x}
                            y2={adjBlock.y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                            opacity="0.6"
                          />
                        );
                      }
                      return null;
                    })
                  )}
                  
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
