import React, { createContext, useContext, useState, ReactNode } from 'react';
import { gameService, Player } from '@/services/gameService';
import { useToast } from '@/hooks/use-toast';

export interface ModeCompletion {
  completed: boolean;
  totalTime: number; // in seconds
  completedAt?: Date;
}

export interface GameProgress {
  easy: ModeCompletion;
  medium: ModeCompletion;
  hard: ModeCompletion;
  allModesCompleted: boolean;
  overallTotalTime: number;
}

interface UserContextType {
  username: string;
  setUsername: (name: string) => Promise<void>;
  gameProgress: GameProgress;
  updateModeCompletion: (mode: 'easy' | 'medium' | 'hard', totalTime: number) => Promise<void>;
  resetProgress: () => void;
  player: Player | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialGameProgress: GameProgress = {
  easy: { completed: false, totalTime: 0 },
  medium: { completed: false, totalTime: 0 },
  hard: { completed: false, totalTime: 0 },
  allModesCompleted: false,
  overallTotalTime: 0,
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsernameState] = useState<string>('');
  const [gameProgress, setGameProgress] = useState<GameProgress>(initialGameProgress);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const setUsername = async (name: string): Promise<void> => {
    try {
      setIsLoading(true);
      const playerData = await gameService.createPlayer(name);
      setPlayer(playerData);
      setUsernameState(name);
      
      toast({
        title: "Welcome",
        description: `${name} is ready to play!`,
      });
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: "Error",
        description: "Failed to create player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateModeCompletion = async (mode: 'easy' | 'medium' | 'hard', totalTime: number): Promise<void> => {
    if (!player) {
      toast({
        title: "Error",
        description: "No player found. Please enter a username first.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save to database
      await gameService.saveGameCompletion(player.id, mode, totalTime);
      
      // Update local state
      setGameProgress(prev => {
        const updated = {
          ...prev,
          [mode]: {
            completed: true,
            totalTime,
            completedAt: new Date(),
          },
        };
        
        // Check if all modes are completed
        const allCompleted = updated.easy.completed && updated.medium.completed && updated.hard.completed;
        updated.allModesCompleted = allCompleted;
        
        if (allCompleted) {
          updated.overallTotalTime = updated.easy.totalTime + updated.medium.totalTime + updated.hard.totalTime;
        }
        
        return updated;
      });

      toast({
        title: "Achievement Unlocked!",
        description: `${mode.charAt(0).toUpperCase() + mode.slice(1)} mode completed in ${Math.floor(totalTime / 60)}:${(totalTime % 60).toString().padStart(2, '0')}!`,
      });
    } catch (error) {
      console.error('Error saving game completion:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetProgress = () => {
    setGameProgress(initialGameProgress);
  };

  return (
    <UserContext.Provider value={{ 
      username, 
      setUsername, 
      gameProgress, 
      updateModeCompletion, 
      resetProgress,
      player,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};