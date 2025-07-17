import React from 'react';
import { Trophy, Clock } from 'lucide-react';
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
  { id: '1', username: 'SpeedMaster', completionTime: '9:34', rank: 1 },
  { id: '2', username: 'ColorWiz', completionTime: '11:47', rank: 2 },
  { id: '3', username: 'PuzzlePro', completionTime: '13:12', rank: 3 },
  { id: '4', username: 'GameChamp', completionTime: '15:28', rank: 4 },
  { id: '5', username: 'MazeRunner', completionTime: '17:45', rank: 5 },
  { id: '6', username: 'QuickSolver', completionTime: '19:02', rank: 6 },
  { id: '7', username: 'PuzzleNinja', completionTime: '21:15', rank: 7 },
  { id: '8', username: 'ColorMaster', completionTime: '23:33', rank: 8 },
  { id: '9', username: 'BrainPower', completionTime: '25:58', rank: 9 },
  { id: '10', username: 'LogicLord', completionTime: '28:12', rank: 10 },
];

const getTrophyIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-6 h-6 text-yellow-500 fill-yellow-400" />;
    case 2:
      return <Trophy className="w-6 h-6 text-gray-400 fill-gray-300" />;
    case 3:
      return <Trophy className="w-6 h-6 text-amber-600 fill-amber-500" />;
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
          <p className="text-xl text-black font-bold px-6 py-3 bg-white/90 backdrop-blur-sm rounded-lg border-2 border-black shadow-lg inline-block">
            Champions who conquered the color kingdom in lowest total time across all difficulty modes
          </p>
        </div>

        {/* Top 3 Podium - Vertical Layout */}
        <div className="space-y-6 mb-12 max-w-2xl mx-auto">
          {mockLeaderboardData.slice(0, 3).map((entry, index) => (
            <Card key={entry.id} className={`relative overflow-hidden bg-gradient-to-br ${
              index === 0 ? 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/50' : 
              index === 1 ? 'from-gray-400/20 to-gray-500/10 border-gray-400/50' : 
              'from-amber-600/20 to-amber-700/10 border-amber-600/50'
            } backdrop-blur-sm border-2 shadow-xl`}>
              <CardContent className="p-8">
                <div className="flex items-center gap-6">
                  <div className={`p-4 rounded-full ${
                    index === 0 ? 'bg-yellow-500/20' : 
                    index === 1 ? 'bg-gray-400/20' : 
                    'bg-amber-600/20'
                  }`}>
                    {getTrophyIcon(entry.rank)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-card-foreground mb-2">
                      {entry.username}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-5 h-5" />
                      <span className="text-xl font-bold">{entry.completionTime}</span>
                    </div>
                  </div>
                  <div className={`${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    'bg-amber-600'
                  } text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl shadow-lg`}>
                    {entry.rank}
                  </div>
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
                    <th className="px-8 py-6 text-right text-primary font-bold text-lg">Total Completion Time</th>
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