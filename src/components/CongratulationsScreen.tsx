import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CongratulationsScreenProps {
  totalTime: number;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const CongratulationsScreen: React.FC<CongratulationsScreenProps> = ({
  totalTime,
  onClose,
}) => {
  const navigate = useNavigate();

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-secondary to-accent/30 z-50 flex items-center justify-center">
      {/* Global animated background */}
      <div className="global-bg">
        <div className="stars"></div>
        <div className="ufo ufo-1"></div>
        <div className="ufo ufo-2"></div>
        <div className="ufo ufo-3"></div>
        <div className="shooting-star shooting-star-1"></div>
        <div className="shooting-star shooting-star-2"></div>
      </div>

      <div className="relative z-10 text-center animate-scale-in">
        {/* Main congratulations message */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-8xl md:text-9xl font-bold text-white mb-6 drop-shadow-2xl animate-pulse">
            Congratulations
          </h1>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-xl">
            on dominating the color kingdom!
          </h2>
          <div className="flex items-center justify-center gap-4 text-6xl animate-bounce">
            <Smile className="w-16 h-16 text-yellow-400 fill-yellow-300" />
          </div>
        </div>

        {/* Total completion time */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/20 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Clock className="w-8 h-8 text-cyan-400" />
            <span className="text-2xl font-bold text-white">Total Completion Time</span>
          </div>
          <div className="text-5xl font-mono font-bold text-cyan-400 mb-2">
            {formatTime(totalTime)}
          </div>
          <p className="text-white/80 text-lg">
            Across all difficulty modes
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button
            onClick={handleViewLeaderboard}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-4 text-xl font-bold shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105"
          >
            <Trophy className="w-6 h-6 mr-2" />
            View Leaderboard
          </Button>
          
          <Button
            onClick={onClose}
            variant="secondary"
            size="lg"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-4 text-xl font-bold border border-white/30 transition-all duration-300 hover:scale-105"
          >
            Continue Playing
          </Button>
        </div>
      </div>
    </div>
  );
};