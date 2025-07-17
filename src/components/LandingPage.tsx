import React, { useEffect, useState } from 'react';
import { ChevronDown, Trophy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

interface LandingPageProps {
  onStartGame: () => void;
  gameVisible: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartGame, gameVisible }) => {
  const [marioVisible, setMarioVisible] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);
  const navigate = useNavigate();
  const { username, setUsername } = useUser();

  useEffect(() => {
    setTimeout(() => setMarioVisible(true), 500);
  }, []);

  const handleStartGame = () => {
    onStartGame();
    setTimeout(() => {
      const gameSection = document.getElementById('game-section');
      gameSection?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSubmit = () => {
    if (inputUsername.trim()) {
      setUsername(inputUsername.trim());
      setIsSubmitted(true);
    }
  };

  return (
    <div className="landing-container">
      {/* Main Content */}
      <div className="landing-content">
        {/* Welcome Text */}
        <div className="welcome-text">
          {/* Simple Mario Head (CSS-based) */}
          <div className={`mario-head ${marioVisible ? 'mario-visible' : ''}`}>
            <div className="mario-cap">
              <div className="cap-main"></div>
              <div className="cap-visor"></div>
              <div className="mario-logo">M</div>
            </div>
            <div className="mario-face">
              <div className="mario-eyes">
                <div className="eye left-eye"></div>
                <div className="eye right-eye"></div>
              </div>
              <div className="mario-nose"></div>
              <div className="mario-mustache"></div>
            </div>
          </div>
          
          <h1 className="main-title">Welcome to</h1>
          <h2 className="game-title">COLOR MAZE MINIMA</h2>
          <p className="subtitle">A Super Fun Puzzle Adventure!</p>
          
          {/* Username Input */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={placeholderVisible ? "Enter your username" : ""}
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  onFocus={() => setPlaceholderVisible(false)}
                  className="pl-10 text-center text-lg py-3 bg-white/90 backdrop-blur-sm border-2 border-white/20 focus:border-white/50 text-black placeholder:text-center placeholder:text-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && inputUsername.trim() && handleSubmit()}
                />
              </div>
              
              {/* Submit Button - appears when typing */}
              {inputUsername.trim() && !isSubmitted && (
                <Button 
                  onClick={handleSubmit}
                  className="bg-primary/80 backdrop-blur-sm hover:bg-primary text-lg px-8 py-3"
                >
                  Submit
                </Button>
              )}
              
               {/* Start Playing and View Leaderboard - appear after submit, but only show appropriate button based on game state */}
               {isSubmitted && !gameVisible && (
                 <>
                   <Button 
                     onClick={handleStartGame}
                     className="bg-primary/80 backdrop-blur-sm hover:bg-primary text-lg px-8 py-3 gap-3"
                   >
                     Start Playing
                   </Button>
                   
                   <Button 
                     onClick={() => navigate('/leaderboard')}
                     className="bg-warning/80 backdrop-blur-sm hover:bg-warning text-warning-foreground text-lg px-8 py-3 gap-3"
                   >
                     <Trophy className="w-5 h-5" />
                     View Leaderboard
                   </Button>
                 </>
               )}
               
               {/* Only View Leaderboard when game is visible */}
               {gameVisible && (
                 <Button 
                   onClick={() => navigate('/leaderboard')}
                   className="bg-warning/80 backdrop-blur-sm hover:bg-warning text-warning-foreground text-lg px-8 py-3 gap-3"
                 >
                   <Trophy className="w-5 h-5" />
                   View Leaderboard
                 </Button>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};