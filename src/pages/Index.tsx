
import { GameBoard } from "@/components/GameBoard";
import { LandingPage } from "@/components/LandingPage";

const Index = () => {
  return (
    <div>
      <LandingPage />
      <div id="game-section">
        <GameBoard />
      </div>
    </div>
  );
};

export default Index;
