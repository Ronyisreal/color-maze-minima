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
      return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-400" />;
    case 2:
      return <Medal className="w-6 h-6 text-gray-400 fill-gray-300" />;
    case 3:
      return <Award className="w-6 h-6 text-amber-600 fill-amber-500" />;
    default:
      return null;
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
            <Card key={entry.id} className={`relative overflow-hidden bg-gradient-to-br ${
              index === 0 ? 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 md:order-2' : 
              index === 1 ? 'from-gray-400/20 to-gray-500/10 border-gray-400/50 md:order-1' : 
              'from-amber-600/20 to-amber-700/10 border-amber-600/50 md:order-3'
            } backdrop-blur-sm border-2 shadow-xl`}>
              <CardContent className="p-8 text-center">
                <div className="mb-6 flex justify-center">
                  <div className={`p-4 rounded-full ${
                    index === 0 ? 'bg-yellow-500/20' : 
                    index === 1 ? 'bg-gray-400/20' : 
                    'bg-amber-600/20'
                  }`}>
                    {getTrophyIcon(entry.rank)}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-card-foreground mb-4">
                  {entry.username}
                </h3>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span className="text-xl font-bold">{entry.completionTime}</span>
                </div>
                <div className={`absolute top-4 right-4 ${
                  index === 0 ? 'bg-yellow-500' : 
                  index === 1 ? 'bg-gray-400' : 
                  'bg-amber-600'
                } text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg shadow-lg`}>
                  {entry.rank}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Rankings Table */}
        <Card className="bg-card/90 backdrop-blur-sm border-border shadow-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-primary/20 to-secondary/20">
                  <tr>
                    <th className="px-8 py-6 text-left text-primary font-bold text-lg">Rank</th>
                    <th className="px-8 py-6 text-left text-primary font-bold text-lg">Player</th>
                    <th className="px-8 py-6 text-right text-primary font-bold text-lg">Completion Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mockLeaderboardData.map((entry, index) => (
                    <tr key={entry.id} className={`border-b border-border/50 hover:bg-accent/30 transition-all duration-200 ${
                      index < 3 ? 'bg-gradient-to-r from-accent/10 to-secondary/5' : 'hover:bg-muted/20'
                    }`}>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                          index === 0 ? 'bg-yellow-500 text-white shadow-lg' :
                          index === 1 ? 'bg-gray-400 text-white shadow-lg' :
                          index === 2 ? 'bg-amber-600 text-white shadow-lg' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          #{entry.rank}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-card-foreground text-lg">{entry.username}</span>
                          {getTrophyIcon(entry.rank)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Clock className="w-5 h-5 text-muted-foreground" />
                          <span className="font-mono text-xl font-bold text-card-foreground bg-accent/30 px-4 py-2 rounded-lg">
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