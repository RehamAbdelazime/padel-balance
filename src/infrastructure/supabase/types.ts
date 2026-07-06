/**
 * Supabase Database type definitions.
 *
 * Sprint 2: sessions, session_players, matches, match_teams, match_team_players added.
 * Regenerate in later sprints with:
 *   npx supabase gen types typescript --project-id <ref> > src/infrastructure/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Mirrors the `sessions.status` CHECK constraint (see migrations 004, 005). */
export type SessionStatusRow = 'PLANNING' | 'LIVE' | 'FINISHED' | 'CANCELLED'

/** Mirrors the CHECK constraints in migration 007 (session_schedule_matches / _player_states). */
export type PlannedMatchOriginRow     = 'AUTO' | 'MANUAL'
export type PlannedMatchProtectionRow = 'LOCKED' | 'UNLOCKED'
/** Mirrors the CHECK constraint widened by migration 011. */
export type MatchRuntimeStatusRow     = 'PENDING' | 'LIVE' | 'FINISHED' | 'CANCELLED'
/** Mirrors the CHECK constraint updated by migration 010 (Sprint F26). */
export type PlayerRuntimeStatusRow    = 'AVAILABLE' | 'RESTING' | 'ABSENT' | 'LEFT' | 'REPLACED'
/** Mirrors the session_runtime_events.event_type CHECK constraint (migration 010). */
/** Mirrors the CHECK constraint widened by migration 011. */
export type RuntimeEventTypeRow =
  | 'REST' | 'RETURN' | 'LEAVE' | 'ABSENT' | 'REPLACE'
  | 'SESSION_STARTED' | 'ROUND_STARTED' | 'ROUND_FINISHED'
  | 'MATCH_FINISHED' | 'MATCH_CANCELLED' | 'SESSION_FINISHED'

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string
          name: string
          phone: string | null
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          name: string
          /** @deprecated Superseded by scheduled_at (migration 009). Retained for history only. */
          session_date: string | null  // DATE returned as YYYY-MM-DD string
          /** @deprecated Superseded by scheduled_at (migration 009). Retained for history only. */
          start_time: string | null  // TIME returned as HH:MM:SS string
          scheduled_at: string  // TIMESTAMPTZ returned as ISO string
          notes: string | null
          status: SessionStatusRow
          court_count: number
          booking_duration: number
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          session_date?: string | null
          start_time?: string | null
          scheduled_at: string
          notes?: string | null
          status?: SessionStatusRow
          court_count?: number
          booking_duration?: number
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          session_date?: string | null
          start_time?: string | null
          scheduled_at?: string
          notes?: string | null
          status?: SessionStatusRow
          court_count?: number
          booking_duration?: number
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_players: {
        Row: {
          id: string
          session_id: string
          player_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          player_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          player_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'session_players_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'session_players_player_id_fkey'
            columns: ['player_id']
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      matches: {
        Row: {
          id: string
          session_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'matches_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      match_teams: {
        Row: {
          id: string
          match_id: string
          team_number: number
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          team_number: number
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          team_number?: number
          score?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'match_teams_match_id_fkey'
            columns: ['match_id']
            referencedRelation: 'matches'
            referencedColumns: ['id']
          },
        ]
      }
      match_team_players: {
        Row: {
          id: string
          match_team_id: string
          player_id: string
        }
        Insert: {
          id?: string
          match_team_id: string
          player_id: string
        }
        Update: {
          id?: string
          match_team_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'match_team_players_match_team_id_fkey'
            columns: ['match_team_id']
            referencedRelation: 'match_teams'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'match_team_players_player_id_fkey'
            columns: ['player_id']
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      session_schedules: {
        Row: {
          id: string
          session_id: string
          format_id: string
          version: number
          target_count: number
          current_match_index: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          format_id: string
          version?: number
          target_count: number
          current_match_index?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          format_id?: string
          version?: number
          target_count?: number
          current_match_index?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'session_schedules_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
      session_schedule_matches: {
        Row: {
          id: string
          schedule_id: string
          match_id: string
          position: number
          origin: PlannedMatchOriginRow
          protection: PlannedMatchProtectionRow
          modified: boolean
          court_number: number | null
          team_a_player1: string
          team_a_player2: string
          team_b_player1: string
          team_b_player2: string
          explanation: string[]
          warnings: string[]
          is_completed: boolean
          result_team1: number | null
          result_team2: number | null
          match_status: MatchRuntimeStatusRow
        }
        Insert: {
          id?: string
          schedule_id: string
          match_id: string
          position: number
          origin: PlannedMatchOriginRow
          protection: PlannedMatchProtectionRow
          modified?: boolean
          court_number?: number | null
          team_a_player1: string
          team_a_player2: string
          team_b_player1: string
          team_b_player2: string
          explanation?: string[]
          warnings?: string[]
          is_completed?: boolean
          result_team1?: number | null
          result_team2?: number | null
          match_status?: MatchRuntimeStatusRow
        }
        Update: {
          id?: string
          schedule_id?: string
          match_id?: string
          position?: number
          origin?: PlannedMatchOriginRow
          protection?: PlannedMatchProtectionRow
          modified?: boolean
          court_number?: number | null
          team_a_player1?: string
          team_a_player2?: string
          team_b_player1?: string
          team_b_player2?: string
          explanation?: string[]
          warnings?: string[]
          is_completed?: boolean
          result_team1?: number | null
          result_team2?: number | null
          match_status?: MatchRuntimeStatusRow
        }
        Relationships: [
          {
            foreignKeyName: 'session_schedule_matches_schedule_id_fkey'
            columns: ['schedule_id']
            referencedRelation: 'session_schedules'
            referencedColumns: ['id']
          },
        ]
      }
      session_schedule_player_states: {
        Row: {
          schedule_id: string
          player_id: string
          status: PlayerRuntimeStatusRow
          replaced_by_player_id: string | null
        }
        Insert: {
          schedule_id: string
          player_id: string
          status: PlayerRuntimeStatusRow
          replaced_by_player_id?: string | null
        }
        Update: {
          schedule_id?: string
          player_id?: string
          status?: PlayerRuntimeStatusRow
          replaced_by_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'session_schedule_player_states_schedule_id_fkey'
            columns: ['schedule_id']
            referencedRelation: 'session_schedules'
            referencedColumns: ['id']
          },
        ]
      }
      session_runtime_events: {
        Row: {
          id: string
          session_id: string
          event_type: RuntimeEventTypeRow
          player_id: string | null
          related_player_id: string | null
          round_number: number | null
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          event_type: RuntimeEventTypeRow
          player_id?: string | null
          related_player_id?: string | null
          round_number?: number | null
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          event_type?: RuntimeEventTypeRow
          player_id?: string | null
          related_player_id?: string | null
          round_number?: number | null
          message?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'session_runtime_events_session_id_fkey'
            columns: ['session_id']
            referencedRelation: 'sessions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
