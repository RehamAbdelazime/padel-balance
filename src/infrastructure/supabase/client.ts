import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error(
    '[PadelBalance] VITE_SUPABASE_URL is not defined. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials.',
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    '[PadelBalance] VITE_SUPABASE_ANON_KEY is not defined. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials.',
  )
}

/**
 * Typed Supabase client.
 * Import this singleton — never call createClient() directly in feature code.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
