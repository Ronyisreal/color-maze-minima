import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  setUsername: (name: string) => void;
  gameProgress: GameProgress;
  updateModeCompletion: (mode: 'easy' | 'medium' | 'hard', totalTime: number) => void;
  resetProgress: () => void;
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
  const [username, setUsername] = useState<string>('');
  const [gameProgress, setGameProgress] = useState<GameProgress>(initialGameProgress);

  const updateModeCompletion = (mode: 'easy' | 'medium' | 'hard', totalTime: number) => {
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
      resetProgress 
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