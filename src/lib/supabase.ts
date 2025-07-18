import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not set. Database features will not work.')
  console.warn('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment variables.')
  
  // Create a dummy client to prevent crashes
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
      order: () => Promise.resolve({ data: [], error: null })
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

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