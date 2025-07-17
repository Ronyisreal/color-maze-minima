import React from 'react';
import { Trophy, Medal, Award, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  id: string;
  username: string;
  completionTime: string;
  rank: number;
}

// Mock data - replace with actual data source
const mockLeaderboardData: LeaderboardEntry[] = [
  { id: '1', username: 'SpeedMaster', completionTime: '2:34', rank: 1 },
  { id: '2', username: 'ColorWiz', completionTime: '2:47', rank: 2 },
  { id: '3', username: 'PuzzlePro', completionTime: '3:12', rank: 3 },
  { id: '4', username: 'GameChamp', completionTime: '3:28', rank: 4 },
  { id: '5', username: 'MazeRunner', completionTime: '3:45', rank: 5 },
  { id: '6', username: 'QuickSolver', completionTime: '4:02', rank: 6 },
  { id: '7', username: 'PuzzleNinja', completionTime: '4:15', rank: 7 },
  { id: '8', username: 'ColorMaster', completionTime: '4:33', rank: 8 },
  { id: '9', username: 'BrainPower', completionTime: '4:58', rank: 9 },
  { id: '10', username: 'LogicLord', completionTime: '5:12', rank: 10 },
];

const getTrophyIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-8 h-8 text-yellow-500" />;
    case 2:
      return <Medal className="w-8 h-8 text-gray-400" />;
    case 3:
      return <Award className="w-8 h-8 text-amber-600" />;
    default:
      return <div className="w-8 h-8 flex items-center justify-center text-muted-foreground font-bold">{rank}</div>;
  }
};

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-secondary to-accent/30 relative">
      {/* Global animated background */}
      <div className="global-bg">
        <div className="stars"></div>
        <div className="ufo ufo-1"></div>
        <div className="ufo ufo-2"></div>
        <div className="ufo ufo-3"></div>
        <div className="shooting-star shooting-star-1"></div>
        <div className="shooting-star shooting-star-2"></div>
      </div>

      <div className="container mx-auto p-6 relative z-10">
        {/* Back button */}
        <div className="mb-6">
          <Button 
            variant="secondary" 
            onClick={() => navigate('/')}
            className="bg-secondary/80 backdrop-blur-sm hover:bg-secondary"
          >
            ← Back to Game
          </Button>
        </div>

        {/* Doodle Header */}
        <div className="text-center mb-12">
          <h1 className="doodle-header text-6xl md:text-8xl font-bold text-white mb-4">
            Leaderboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Champions who conquered all difficulty modes
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {mockLeaderboardData.slice(0, 3).map((entry, index) => (
            <Card key={entry.id} className={`relative overflow-hidden bg-card/80 backdrop-blur-sm border-2 ${
              index === 0 ? 'border-yellow-500 md:order-2' : 
              index === 1 ? 'border-gray-400 md:order-1' : 
              'border-amber-600 md:order-3'
            }`}>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  {getTrophyIcon(entry.rank)}
                </div>
                <h3 className="text-2xl font-bold text-card-foreground mb-2">
                  {entry.username}
                </h3>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-lg font-semibold">{entry.completionTime}</span>
                </div>
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  {entry.rank}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Rankings Table */}
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-muted-foreground font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left text-muted-foreground font-semibold">Player</th>
                    <th className="px-6 py-4 text-right text-muted-foreground font-semibold">Completion Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mockLeaderboardData.map((entry, index) => (
                    <tr key={entry.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${
                      index < 3 ? 'bg-accent/20' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getTrophyIcon(entry.rank)}
                          <span className="font-semibold text-card-foreground">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-card-foreground">{entry.username}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-lg font-semibold text-card-foreground">
                            {entry.completionTime}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;