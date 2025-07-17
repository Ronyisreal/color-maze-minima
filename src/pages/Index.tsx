
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GameBoard } from "@/components/GameBoard";
import { LandingPage } from "@/components/LandingPage";

const Index = () => {
  const [gameVisible, setGameVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.showGame) {
      setGameVisible(true);
    }
    // Clear the state after use to prevent unwanted navigation
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="app-container">
      {/* Animated Background Throughout */}
      <div className="global-bg">
        <div className="stars"></div>
        <div className="ufo ufo-1"></div>
        <div className="ufo ufo-2"></div>
        <div className="ufo ufo-3"></div>
        <div className="shooting-star shooting-star-1"></div>
        <div className="shooting-star shooting-star-2"></div>
      </div>
      
      <LandingPage onStartGame={() => setGameVisible(true)} gameVisible={gameVisible} />
      {gameVisible && (
        <div id="game-section" className="game-section">
          <GameBoard />
        </div>
      )}
    </div>
  );
};

export default Index;
