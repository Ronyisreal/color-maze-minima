import { supabase } from '@/lib/supabase'

export interface Player {
  id: number
  username: string
  created_at: string
}

export interface LeaderboardEntry {
  id: number
  user_id: number
  difficulty_level: 'easy' | 'medium' | 'hard'
  completion_time: number
  completed_at: string
  username?: string
}

export const gameService = {
  // Create or get player
  async createPlayer(username: string): Promise<Player> {
    // First check if player exists
    const { data: existingPlayer } = await supabase
      .from("Player's table")
      .select('*')
      .eq('username', username)
      .single()

    if (existingPlayer) {
      return existingPlayer
    }

    // Create new player
    const { data, error } = await supabase
      .from("Player's table")
      .insert({ username })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Save game completion
  async saveGameCompletion(
    userId: number,
    difficulty: 'easy' | 'medium' | 'hard',
    completionTime: number
  ): Promise<void> {
    const { error } = await supabase
      .from('Leaderboard')
      .insert({
        user_id: userId,
        difficulty_level: difficulty,
        completion_time: completionTime
      })

    if (error) throw error
  },

  // Get leaderboard data
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('Leaderboard')
      .select('*, players:user_id(username)')
      .order('completion_time', { ascending: true })

    if (error) throw error

    return (data as any[]).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      difficulty_level: entry.difficulty_level,
      completion_time: entry.completion_time,
      completed_at: entry.completed_at,
      username: entry.players?.username || 'Unknown'
    }))
  },

  // Get player's best times
  async getPlayerStats(userId: number) {
    const { data, error } = await supabase
      .from('Leaderboard')
      .select('*')
      .eq('user_id', userId)
      .order('completion_time', { ascending: true })

    if (error) throw error
    return data
  }
}