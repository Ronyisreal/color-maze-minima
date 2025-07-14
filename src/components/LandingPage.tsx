import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [marioVisible, setMarioVisible] = useState(false);

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