
import { useState } from "react";
import { GameBoard } from "@/components/GameBoard";
import { LandingPage } from "@/components/LandingPage";

const Index = () => {
  const [gameVisible, setGameVisible] = useState(false);

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
