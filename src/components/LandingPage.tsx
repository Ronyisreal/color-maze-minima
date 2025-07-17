import React, { useEffect, useState } from 'react';
import { ChevronDown, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [marioVisible, setMarioVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMarioVisible(true), 500);
  }, []);

  const scrollToGame = () => {
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
          
          {/* Leaderboard Button */}
          <div className="mt-8">
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
        <div className="scroll-indicator" onClick={scrollToGame}>
          <span>Scroll Down to Play</span>
          <ChevronDown className="scroll-arrow" />
        </div>
      </div>
    </div>
  );
};