
import React, { useState, useEffect } from 'react';
import { Block } from './Block';
import { ColorPalette } from './ColorPalette';
import { GameStats } from './GameStats';
import { DifficultySelector, Difficulty } from './DifficultySelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Lightbulb, Trophy, Timer, Frown } from 'lucide-react';
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

const getTimeLimit = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'easy': return 180; // 3 minutes
    case 'medium': return 420; // 7 minutes
    case 'hard': return 600; // 10 minutes
    default: return 180;
  }
};

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
  const [currentScore, setCurrentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getTimeLimit('easy'));
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [availableColors, setAvailableColors] = useState(AVAILABLE_COLORS.slice(0, 3));

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
    console.log('generateNewPuzzle called:', { difficulty, level });
    const boardWidth = 800;
    const boardHeight = 600;
    
    const config = getDifficultyConfig(difficulty, level);
    const newRegions = generateLargeComplexShape(boardWidth, boardHeight, difficulty, level);
    console.log('Generated regions:', newRegions.length);
    
    const minColors = calculateMinimumColorsWelshPowell(newRegions);
    const finalMinColors = minColors; // Use actual calculated chromatic number
    
    setMinimumColors(finalMinColors);
    setRegions(newRegions);
    
    // Generate random colors for the palette based on minimum colors needed
    const shuffledColors = [...AVAILABLE_COLORS].sort(() => Math.random() - 0.5);
    const selectedColors = shuffledColors.slice(0, finalMinColors);
    setAvailableColors(selectedColors);
    
    // Reset current score to 0 for new puzzle
    setCurrentScore(0);
    
    console.log('Puzzle generation complete');
  };

  const calculateMinimumColorsWelshPowell = (regions: Region[]): number => {
    const sortedRegions = [...regions].sort((a, b) => b.adjacentRegions.length - a.adjacentRegions.length);
    const colorMap = new Map<string, number>();
    let maxColor = 0;

    sortedRegions.forEach(region => {
      const usedColors = new Set<number>();
      
      region.adjacentRegions.forEach(adjId => {
        if (colorMap.has(adjId)) {
          usedColors.add(colorMap.get(adjId)!);
        }
      });

      let color = 1;
      while (usedColors.has(color)) {
        color++;
      }

      colorMap.set(region.id, color);
      maxColor = Math.max(maxColor, color);
    });

    return maxColor;
  };

  const isColorConflict = (regionId: string, color: string, allRegions: Region[]): boolean => {
    const currentRegion = allRegions.find(r => r.id === regionId);
    if (!currentRegion) return false;
    
    // Use the adjacency information already calculated during region generation
    for (const adjacentId of currentRegion.adjacentRegions) {
      const adjacentRegion = allRegions.find(r => r.id === adjacentId);
      if (adjacentRegion && adjacentRegion.color === color) {
        console.log(`Conflict detected: Region ${regionId} conflicts with adjacent region ${adjacentId}`);
        return true;
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

    if (isColorConflict(regionId, selectedColor, updatedRegions)) {
      toast({
        title: "Invalid move!",
        description: "This color shares a border with another region of the same color.",
        variant: "destructive",
      });
      return;
    }

    // Add 10 points for successfully coloring a region
    setCurrentScore(prev => prev + 10);
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
      
      // Simple scoring: just the points from coloring regions
      const finalScore = currentScore;
      
      const scoreData: ScoreData = { 
        baseScore: 0, 
        efficiencyBonus: 0, 
        difficultyMultiplier: 1, 
        totalScore: finalScore, 
        grade: 'S' 
      };
      setScore(scoreData);
      setTotalScore(prev => prev + finalScore);
      
      const efficiency = usedColors === minimumColors ? "Perfect efficiency!" : "Good job!";
      toast({
        title: `Puzzle Completed! 🎉`,
        description: `Score: ${finalScore} points (${usedColors} colors used, minimum: ${minimumColors}) - ${efficiency}`,
      });
    }
  };

  const resetGame = () => {
    console.log('resetGame called - generating new puzzle');
    setGameCompleted(false);
    setGameEnded(false);
    setGameStarted(false);
    setColorsUsed(0);
    setSelectedColor(null);
    setScore(null);
    setTimeLeft(getTimeLimit(difficulty));
    
    // Force immediate puzzle generation with current values
    setTimeout(() => {
      console.log('Generating new puzzle after state reset');
      generateNewPuzzle(difficulty, level);
    }, 0);
  };

  const bailOut = () => {
    setGameStarted(false);
    setGameEnded(false);
    setTimeLeft(getTimeLimit(difficulty));
    const resetRegions = regions.map(region => ({ ...region, color: null }));
    setRegions(resetRegions);
    setSelectedColor(null);
    // Reset score to 0
    setCurrentScore(0);
    
    toast({
      title: "Game Reset",
      description: "Timer and progress reset. Try again!",
    });
  };

  const nextLevel = () => {
    const maxLevel = 3; // Each difficulty has 3 levels
    if (level < maxLevel) {
      setLevel(level + 1);
      resetGame();
    } else {
      toast({
        title: "Difficulty Completed! 🎊",
        description: `You've completed all levels in ${difficulty} mode! Try a harder difficulty for more challenge.`,
      });
    }
  };

  const showHint = () => {
    const regionWithMostConnections = regions.reduce((max, region) => 
      region.adjacentRegions.length > max.adjacentRegions.length ? region : max
    );
    
    toast({
      title: "Hint 💡",
      description: `Try coloring region ${regionWithMostConnections.id.split('-')[1]} first - it has ${regionWithMostConnections.adjacentRegions.length} connections!`,
    });
  };

  const changeDifficulty = (newDifficulty: Difficulty) => {
    console.log('changeDifficulty called with:', newDifficulty);
    setDifficulty(newDifficulty);
    setLevel(1);
    setTotalScore(0);
    setCurrentScore(0);
    setGameCompleted(false);
    setGameEnded(false);
    setGameStarted(false);
    setScore(null);
    setTimeLeft(getTimeLimit(newDifficulty));
    
    // Use setTimeout to ensure state updates are processed
    setTimeout(() => {
      console.log('Generating puzzle for new difficulty:', newDifficulty);
      generateNewPuzzle(newDifficulty, 1);
    }, 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setCurrentScore(0);
    generateNewPuzzle(difficulty, level);
  }, []);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <p className="text-white">Master the art of graph coloring! Color adjacent pieces with different colors using the fewest possible colors.</p>
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-emerald-400">Current Score: {currentScore}</span>
              <span className="text-lg font-semibold text-violet-400">Total Score: {totalScore}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-cyan-400" />
              <span className={`text-lg font-bold transition-colors duration-300 ${
                timeLeft <= 30 ? 'text-red-400 animate-pulse' : 
                timeLeft <= 60 ? 'text-orange-400' : 
                'text-cyan-400'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            <Button 
              onClick={bailOut} 
              size="sm" 
              variant="default" 
              disabled={gameEnded || !gameStarted}
              className="text-sm bg-white text-black hover:bg-gray-200"
            >
              <Frown className="w-4 h-4 mr-1" />
              I bail
            </Button>
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
                currentScore={currentScore}
                regions={regions}
              />
            </Card>
            
            {/* Color palette moved under canvas */}

            <div className="space-y-2">
              <Button onClick={resetGame} className="w-full" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                New Puzzle
              </Button>
              <Button onClick={showHint} className="w-full" variant="outline" disabled={gameEnded}>
                <Lightbulb className="w-4 h-4 mr-2" />
                Hint
              </Button>
              {gameCompleted && level < 3 && (
                <Button onClick={nextLevel} className="w-full bg-red-500 hover:bg-red-600 text-white">
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
                      <Button onClick={resetGame}>Try Again</Button>
                    </div>
                  </div>
                )}
                <svg width="100%" height="100%" className="absolute inset-0" viewBox="0 0 800 600">
                  {/* Removed adjacency lines - they shouldn't be visible to players */}
                  
                  {regions.map(region => {
                    const points = region.vertices.map(v => `${v.x},${v.y}`).join(' ');
                    return (
                      <g key={region.id}>
                        <polygon
                          points={points}
                          fill={region.color || '#f3f4f6'}
                          stroke={region.color ? '#374151' : '#1f2937'}
                          strokeWidth="2"
                          className={`cursor-pointer hover:stroke-gray-800 transition-all duration-200 ${gameEnded ? 'pointer-events-none' : ''}`}
                          onClick={() => handleRegionColor(region.id)}
                        />
                        <text
                          x={region.center.x}
                          y={region.center.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-base font-bold pointer-events-none select-none"
                          fill={region.color ? '#ffffff' : '#000000'}
                          stroke={region.color ? '#000000' : '#ffffff'}
                          strokeWidth="0.5"
                        >
                          {region.id.split('-')[1]}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>
            
            {/* Color Palette under canvas */}
            <Card className="p-4 mt-4">
              <h3 className="font-semibold mb-3">Color Palette</h3>
              <ColorPalette
                colors={availableColors}
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
