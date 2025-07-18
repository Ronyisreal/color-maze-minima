import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      "Player's table": {
        Row: {
          id: number
          username: string
          created_at: string
        }
        Insert: {
          username: string
        }
        Update: {
          username?: string
        }
      }
      Leaderboard: {
        Row: {
          id: number
          user_id: number
          difficulty_level: 'easy' | 'medium' | 'hard'
          completion_time: number
          completed_at: string
        }
        Insert: {
          user_id: number
          difficulty_level: 'easy' | 'medium' | 'hard'
          completion_time: number
        }
        Update: {
          completion_time?: number
        }
      }
    }
  }
}