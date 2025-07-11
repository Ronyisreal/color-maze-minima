
import React, { useState, useEffect } from 'react';
import { Block } from './Block';
import { ColorPalette } from './ColorPalette';
import { GameStats } from './GameStats';
import { DifficultySelector, Difficulty } from './DifficultySelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Lightbulb, Trophy, Timer } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateLargeComplexShape, getDifficultyConfig, Region } from '@/utils/shapeGenerator';
import { calculateScore, ScoreData } from '@/utils/scoreCalculator';

const AVAILABLE_COLORS = [
  { name: 'Red', value: '#ef4444', hex: '#ef4444' },
  { name: 'Blue', value: '#3b82f6', hex: '#3b82f6' },
  { name: 'Green', value: '#10b981', hex: '#10b981' },
  { name: 'Yellow', value: '#f59e0b', hex: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6', hex: '#8b5cf6' },
  { name: 'Orange', value: '#f97316', hex: '#f97316' },
];

const GAME_TIME_LIMIT = 60; // 1 minute for all difficulty levels

export const GameBoard: React.FC = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [colorsUsed, setColorsUsed] = useState(0);
  const [minimumColors, setMinimumColors] = useState(0);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState<ScoreData | null>(null);
  const [totalScore, setTotalScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(100); // Starting score of 100
  const [timeLeft, setTimeLeft] = useState(GAME_TIME_LIMIT);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  // Timer effect
  useEffect(() => {
    if (gameStarted && !gameCompleted && !gameEnded && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameEnded(true);
            toast({
              title: "Time's Up! ⏰",
              description: "Game over! Try again to beat the clock.",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameStarted, gameCompleted, gameEnded, timeLeft]);

  const generateNewPuzzle = (difficulty: Difficulty, level: number) => {
    const boardWidth = 800;
    const boardHeight = 600;
    
    const newRegions = generateLargeComplexShape(boardWidth, boardHeight, difficulty);
    
    // Calculate minimum colors using Welsh-Powell algorithm
    const minColors = calculateMinimumColorsWelshPowell(newRegions);
    const config = getDifficultyConfig(difficulty, level);
    setMinimumColors(Math.max(config.minColors, minColors));
    setRegions(newRegions);
  };

  const calculateMinimumColorsWelshPowell = (regions: Region[]): number => {
    // Sort regions by degree (number of adjacent regions) in descending order
    const sortedRegions = [...regions].sort((a, b) => b.adjacentRegions.length - a.adjacentRegions.length);
    const colorMap = new Map<string, number>();
    let maxColor = 0;

    sortedRegions.forEach(region => {
      const usedColors = new Set<number>();
      
      // Find colors used by adjacent regions
      region.adjacentRegions.forEach(adjId => {
        if (colorMap.has(adjId)) {
          usedColors.add(colorMap.get(adjId)!);
        }
      });

      // Find the smallest available color
      let color = 1;
      while (usedColors.has(color)) {
        color++;
      }

      colorMap.set(region.id, color);
      maxColor = Math.max(maxColor, color);
    });

    return maxColor;
  };

  // New adjacency checking logic - any connection path between same colors is invalid
  const isColorConflict = (regionId: string, color: string, allRegions: Region[]): boolean => {
    const visited = new Set<string>();
    const queue: string[] = [regionId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const currentRegion = allRegions.find(r => r.id === currentId);
      if (!currentRegion) continue;
      
      // Check all adjacent regions
      for (const adjId of currentRegion.adjacentRegions) {
        const adjRegion = allRegions.find(r => r.id === adjId);
        if (adjRegion && adjRegion.color === color && adjId !== regionId) {
          return true; // Found a conflict - same color is connected
        }
        
        // Continue traversal through connected regions
        if (!visited.has(adjId)) {
          queue.push(adjId);
        }
      }
    }
    
    return false;
  };

  const handleRegionColor = (regionId: string) => {
    if (gameEnded) {
      toast({
        title: "Game Over",
        description: "Time's up! Start a new game to continue playing.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedColor) {
      toast({
        title: "Select a color first",
        description: "Choose a color from the palette before coloring regions.",
        variant: "destructive",
      });
      return;
    }

    if (!gameStarted) {
      setGameStarted(true);
    }

    const updatedRegions = regions.map(region => {
      if (region.id === regionId) {
        return { ...region, color: selectedColor };
      }
      return region;
    });

    // Check for conflicts using the new logic
    if (isColorConflict(regionId, selectedColor, updatedRegions)) {
      // Deduct 10 points for invalid move
      setCurrentScore(prev => Math.max(0, prev - 10));
      toast({
        title: "Invalid move! (-10 points)",
        description: "This color is connected to another region with the same color.",
        variant: "destructive",
      });
      return;
    }

    setRegions(updatedRegions);
    checkGameCompletion(updatedRegions);
  };

  const checkGameCompletion = (currentRegions: Region[]) => {
    const allColored = currentRegions.every(region => region.color !== null);
    if (allColored) {
      const uniqueColors = new Set(currentRegions.map(region => region.color).filter(Boolean));
      const usedColors = uniqueColors.size;
      setColorsUsed(usedColors);
      setGameCompleted(true);
      setGameStarted(false);
      
      const scoreData = calculateScore(difficulty, minimumColors, usedColors, level);
      const finalScore = { ...scoreData, totalScore: scoreData.totalScore + currentScore };
      setScore(finalScore);
      setTotalScore(prev => prev + finalScore.totalScore);
      
      toast({
        title: `Puzzle Completed! Grade: ${scoreData.grade} 🎉`,
        description: `Score: ${finalScore.totalScore} points (${usedColors} colors used, minimum: ${minimumColors})`,
      });
    }
  };

  const resetGame = () => {
    setGameCompleted(false);
    setGameEnded(false);
    setGameStarted(false);
    setColorsUsed(0);
    setSelectedColor(null);
    setScore(null);
    setCurrentScore(100);
    setTimeLeft(GAME_TIME_LIMIT);
    generateNewPuzzle(difficulty, level);
  };

  const nextLevel = () => {
    setLevel(level + 1);
    resetGame();
  };

  const showHint = () => {
    // Find the region with most connections for hint
    const regionWithMostConnections = regions.reduce((max, region) => 
      region.adjacentRegions.length > max.adjacentRegions.length ? region : max
    );
    
    toast({
      title: "Hint 💡",
      description: `Try coloring region ${regionWithMostConnections.id.split('-')[1]} first - it has ${regionWithMostConnections.adjacentRegions.length} connections!`,
    });
  };

  const changeDifficulty = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setLevel(1);
    setTotalScore(0);
    setGameCompleted(false);
    setGameEnded(false);
    setGameStarted(false);
    setScore(null);
    setCurrentScore(100);
    setTimeLeft(GAME_TIME_LIMIT);
    generateNewPuzzle(newDifficulty, 1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    generateNewPuzzle(difficulty, level);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Color Block Maze Solver</h1>
          <p className="text-gray-600">Color all blocks using the minimum number of colors. No same colors can be connected!</p>
          <div className="flex justify-center items-center gap-6 mt-4">
            {totalScore > 0 && (
              <span className="text-lg font-semibold text-purple-600">Total Score: {totalScore}</span>
            )}
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-600" />
              <span className={`text-lg font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-green-600">Current Score: {currentScore}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
              <Button onClick={showHint} className="w-full" variant="outline" disabled={gameEnded}>
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

          <div className="lg:col-span-4">
            <Card className="p-6">
              <div className="relative bg-white rounded-lg border-2 border-gray-200 overflow-hidden" style={{ height: '700px' }}>
                {gameEnded && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                    <div className="bg-white p-6 rounded-lg text-center">
                      <h2 className="text-2xl font-bold text-red-600 mb-2">Time's Up!</h2>
                      <p className="text-gray-600 mb-4">Final Score: {currentScore}</p>
                      <Button onClick={resetGame}>Try Again</Button>
                    </div>
                  </div>
                )}
                <svg width="100%" height="100%" className="absolute inset-0" viewBox="0 0 800 600">
                  {regions.map(region => 
                    region.adjacentRegions.map(adjId => {
                      const adjRegion = regions.find(r => r.id === adjId);
                      if (adjRegion && region.id < adjId) {
                        return (
                          <line
                            key={`${region.id}-${adjId}`}
                            x1={region.center.x}
                            y1={region.center.y}
                            x2={adjRegion.center.x}
                            y2={adjRegion.center.y}
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
                  
                  {regions.map(region => {
                    const points = region.vertices.map(v => `${v.x},${v.y}`).join(' ');
                    return (
                      <g key={region.id}>
                        <polygon
                          points={points}
                          fill={region.color || '#ffffff'}
                          stroke={region.color ? '#374151' : '#9ca3af'}
                          strokeWidth="2"
                          className={`cursor-pointer hover:stroke-gray-800 transition-all duration-200 ${gameEnded ? 'pointer-events-none' : ''}`}
                          onClick={() => handleRegionColor(region.id)}
                        />
                        <text
                          x={region.center.x}
                          y={region.center.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs font-semibold pointer-events-none select-none"
                          fill={region.color ? '#ffffff' : '#374151'}
                        >
                          {region.id.split('-')[1]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
