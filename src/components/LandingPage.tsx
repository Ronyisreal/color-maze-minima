import React, { useEffect, useState } from 'react';
import { ChevronDown, Trophy, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

export const LandingPage: React.FC = () => {
  const [marioVisible, setMarioVisible] = useState(false);
  const [inputUsername, setInputUsername] = useState('');
  const navigate = useNavigate();
  const { username, setUsername } = useUser();

  useEffect(() => {
    setTimeout(() => setMarioVisible(true), 500);
  }, []);

  const scrollToGame = () => {
    if (!inputUsername.trim()) {
      return; // Don't scroll if no username
    }
    setUsername(inputUsername.trim());
    const gameSection = document.getElementById('game-section');
    gameSection?.scrollIntoView({ behavior: 'smooth' });
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
                  placeholder="Enter your username to start playing"
                  value={inputUsername}
                  onChange={(e) => setInputUsername(e.target.value)}
                  className="pl-10 text-center text-lg py-3 bg-white/90 backdrop-blur-sm border-2 border-white/20 focus:border-white/50"
                  onKeyPress={(e) => e.key === 'Enter' && inputUsername.trim() && scrollToGame()}
                />
              </div>
              <Button 
                onClick={scrollToGame}
                disabled={!inputUsername.trim()}
                className="bg-primary/80 backdrop-blur-sm hover:bg-primary text-lg px-8 py-3 gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Playing
              </Button>
            </div>
          </div>
          
          {/* Leaderboard Button */}
          <div className="mt-6">
            <Button 
              onClick={() => navigate('/leaderboard')}
              variant="secondary"
              className="bg-secondary/80 backdrop-blur-sm hover:bg-secondary text-lg px-8 py-3 gap-3"
            >
              <Trophy className="w-5 h-5" />
              View Leaderboard
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        {inputUsername.trim() && (
          <div className="scroll-indicator" onClick={scrollToGame}>
            <span>Scroll Down to Play</span>
            <ChevronDown className="scroll-arrow" />
          </div>
        )}
      </div>
    </div>
  );
};