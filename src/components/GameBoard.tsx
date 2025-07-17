
import React, { useState, useEffect } from 'react';
import { Block } from './Block';
import { ColorPalette } from './ColorPalette';
import { GameStats } from './GameStats';
import { DifficultySelector, Difficulty } from './DifficultySelector';
import { CongratulationsScreen } from './CongratulationsScreen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Lightbulb, Trophy, Timer, Frown, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { generateLargeComplexShape, getDifficultyConfig, Region } from '@/utils/shapeGenerator';
import { calculateScore, ScoreData } from '@/utils/scoreCalculator';
import { useUser } from '@/contexts/UserContext';

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
  const { username, gameProgress, updateModeCompletion } = useUser();
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
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
  const [modeStartTime, setModeStartTime] = useState<number>(0);
  const [showCongratulations, setShowCongratulations] = useState(false);

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
    
    // Log all adjacencies for debugging
    console.log('=== Region Adjacencies ===');
    newRegions.forEach(region => {
      console.log(`Region ${region.id}: adjacent to [${region.adjacentRegions.join(', ')}]`);
    });
    
    const minColors = calculateMinimumColorsBacktracking(newRegions);
    console.log('Calculated minimum colors:', minColors);
    
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

  const calculateMinimumColorsBacktracking = (regions: Region[]): number => {
    if (regions.length === 0) return 0;
    if (regions.length === 1) return 1;
    
    // Try coloring with k colors, starting from 1
    for (let k = 1; k <= regions.length; k++) {
      if (canColorWithKColorsBacktrack(regions, k)) {
        return k;
      }
    }
    
    // Fallback (should never reach here for valid graphs)
    return regions.length;
  };

  const canColorWithKColorsBacktrack = (regions: Region[], k: number): boolean => {
    const coloring = new Map<string, number>();
    return backtrackColoringRegions(regions, 0, k, coloring);
  };

  const backtrackColoringRegions = (regions: Region[], regionIndex: number, k: number, coloring: Map<string, number>): boolean => {
    // Base case: all regions are colored
    if (regionIndex === regions.length) {
      return true;
    }

    const currentRegion = regions[regionIndex];
    
    // Try each color from 1 to k
    for (let color = 1; color <= k; color++) {
      if (isSafeColorAssignment(currentRegion, color, coloring)) {
        // Assign color to current region
        coloring.set(currentRegion.id, color);
        
        // Recursively try to color remaining regions
        if (backtrackColoringRegions(regions, regionIndex + 1, k, coloring)) {
          return true;
        }
        
        // Backtrack: remove color assignment
        coloring.delete(currentRegion.id);
      }
    }
    
    // No valid coloring found
    return false;
  };

  const isSafeColorAssignment = (region: Region, color: number, coloring: Map<string, number>): boolean => {
    // Check if any adjacent region has the same color
    for (const adjacentId of region.adjacentRegions) {
      if (coloring.has(adjacentId) && coloring.get(adjacentId) === color) {
        return false;
      }
    }
    return true;
  };

  const isColorConflict = (regionId: string, color: string, allRegions: Region[]): boolean => {
    const currentRegion = allRegions.find(r => r.id === regionId);
    if (!currentRegion) {
      console.log(`Region ${regionId} not found in allRegions`);
      return false;
    }
    
    console.log(`Checking color conflict for region ${regionId} with color ${color}`);
    console.log(`Region ${regionId} adjacents:`, currentRegion.adjacentRegions);
    
    // Check all regions to see their current colors
    allRegions.forEach(region => {
      if (region.color === color) {
        console.log(`Region ${region.id} already has color ${color}`);
      }
    });
    
    // Use the adjacency information already calculated during region generation
    for (const adjacentId of currentRegion.adjacentRegions) {
      const adjacentRegion = allRegions.find(r => r.id === adjacentId);
      if (adjacentRegion && adjacentRegion.color === color) {
        console.log(`CONFLICT: Region ${regionId} conflicts with adjacent region ${adjacentId} (both have color ${color})`);
        return true;
      }
    }
    
    console.log(`No conflict found for region ${regionId} with color ${color}`);
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
      // Mode completed - calculate total time spent on this mode
      const timeLimit = getTimeLimit(difficulty);
      const currentTime = Date.now();
      const totalModeTimeMs = currentTime - modeStartTime;
      const totalModeTime = Math.floor(totalModeTimeMs / 1000); // Convert to seconds
      
      // Update completion in context
      updateModeCompletion(difficulty, totalModeTime);
      
      toast({
        title: "Mode Completed! 🎊",
        description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} mode completed in ${formatTime(totalModeTime)}! Great job!`,
        duration: 5000,
      });

      // Check if all modes are completed after state update
      setTimeout(() => {
        // This will trigger after the context state is updated
        if (gameProgress.allModesCompleted || 
            (gameProgress.easy.completed && gameProgress.medium.completed && gameProgress.hard.completed)) {
          setShowCongratulations(true);
        }
      }, 100);
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
    setModeStartTime(Date.now());
    
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
    setModeStartTime(Date.now());
    generateNewPuzzle(difficulty, level);
  }, []);

  // Check for all modes completion
  useEffect(() => {
    if (gameProgress.allModesCompleted && !showCongratulations) {
      setTimeout(() => setShowCongratulations(true), 1000);
    }
  }, [gameProgress.allModesCompleted]);

  // Show congratulations screen if all modes completed
  if (showCongratulations) {
    return (
      <CongratulationsScreen
        totalTime={gameProgress.overallTotalTime}
        onClose={() => setShowCongratulations(false)}
      />
    );
  }

  // Don't render game if no username is set
  if (!username) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
              <User className="w-16 h-16 mx-auto mb-4 text-white/60" />
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Player!</h2>
              <p className="text-white/80">Please enter your username above to start playing.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xl font-bold text-white">Welcome, {username}!</span>
          </div>
          <p className="text-white">Master the art of graph coloring! Color adjacent pieces with different colors using the minimum possible colors.</p>
          <div className="flex justify-center items-center gap-6 mt-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold text-emerald-400">Current Score: {currentScore}</span>
              <span className="text-lg font-semibold text-violet-400">Total Score: {regions.length * 10}</span>
            </div>
            
            {/* Mode Progress Display */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm text-white/80">Mode Progress:</span>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs ${gameProgress.easy.completed ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  Easy {gameProgress.easy.completed ? `✓ ${formatTime(gameProgress.easy.totalTime)}` : '○'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${gameProgress.medium.completed ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  Medium {gameProgress.medium.completed ? `✓ ${formatTime(gameProgress.medium.totalTime)}` : '○'}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${gameProgress.hard.completed ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
                  Hard {gameProgress.hard.completed ? `✓ ${formatTime(gameProgress.hard.totalTime)}` : '○'}
                </span>
              </div>
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
                    const isHovered = hoveredRegion === region.id;
                    return (
                      <g key={region.id}>
                        <polygon
                          points={points}
                          fill={region.color || '#f3f4f6'}
                          stroke={isHovered ? '#000000' : (region.color ? '#374151' : '#1f2937')}
                          strokeWidth={isHovered ? '6' : '2'}
                          className={`cursor-pointer transition-all duration-200 ${gameEnded ? 'pointer-events-none' : ''}`}
                          onClick={() => handleRegionColor(region.id)}
                          onMouseEnter={() => setHoveredRegion(region.id)}
                          onMouseLeave={() => setHoveredRegion(null)}
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
