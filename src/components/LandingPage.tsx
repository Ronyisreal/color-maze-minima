import React, { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Mario3D } from './Mario3D';

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
      {/* Animated Background with UFOs */}
      <div className="landing-bg">
        <div className="stars"></div>
        <div className="ufo ufo-1"></div>
        <div className="ufo ufo-2"></div>
        <div className="ufo ufo-3"></div>
        <div className="shooting-star shooting-star-1"></div>
        <div className="shooting-star shooting-star-2"></div>
      </div>

      {/* Main Content */}
      <div className="landing-content">
        {/* 3D Super Mario Head */}
        <div className={`mario-3d-wrapper ${marioVisible ? 'mario-visible' : ''}`}>
          <Mario3D />
        </div>

        {/* Welcome Text */}
        <div className="welcome-text">
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