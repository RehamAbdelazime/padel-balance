/**
 * Session domain types — derived from the approved Database schema.
 */
import type { Database } from '@/infrastructure/supabase/types'

type Tables = Database['public']['Tables']

// ── Raw table row types (from DB) ─────────────────────────────────────────────

export type Session          = Tables['sessions']['Row']
export type CreateSessionInput = Tables['sessions']['Insert']
export type UpdateSessionInput = Tables['sessions']['Update']

/** Session lifecycle phase, persisted on the session row (Sprint F22). */
export type SessionStatus = Session['status']

export type SessionPlayer       = Tables['session_players']['Row']
export type CreateAttendanceInput = Tables['session_players']['Insert']

export type Match          = Tables['matches']['Row']
export type MatchTeam      = Tables['match_teams']['Row']
export type MatchTeamPlayer = Tables['match_team_players']['Row']

/** Opaque session identifier — prevents cross-entity ID mix-ups. */
export type SessionId = string & { readonly __brand: unique symbol }

// ── Joined types for nested queries ──────────────────────────────────────────
// These represent the shape of Supabase nested-select results.
// They cannot be auto-derived from Database types without the Supabase CLI.

/** session_players row with the related player object included. */
export type SessionAttendee = {
  id: string
  session_id: string
  player_id: string
  created_at: string
  players: {
    id: string
    name: string
    phone: string | null
  }
}

/** match_team_players row with the related player object included. */
export type MatchTeamPlayerWithPlayer = {
  player_id: string
  players: {
    id: string
    name: string
  }
}

/** match_teams row with nested team players. */
export type MatchTeamWithPlayers = {
  id: string
  match_id: string
  team_number: number
  score: number
  created_at: string
  match_team_players: MatchTeamPlayerWithPlayer[]
}

/**
 * Full match row with both teams (sorted by team_number) and their players.
 * team_number 1 is always match_teams[0], team_number 2 is always match_teams[1].
 */
export type MatchWithTeams = {
  id: string
  session_id: string
  created_at: string
  updated_at: string
  match_teams: [MatchTeamWithPlayers, MatchTeamWithPlayers]
}

/** Input passed to matchesService.createMatch. */
export type CreateMatchData = {
  team1PlayerIds: [string, string]
  team1Score: number
  team2PlayerIds: [string, string]
  team2Score: number
}

// ── Session schedule (Sprint 9 — Live Session Manager) ────────────────────────
export type {
  PlannedMatchOrigin,
  PlannedMatchProtection,
  SessionPhase,
  PlayerRuntimeStatus,
  MatchRuntimeStatus,
  MatchScore,
  LiveMatchScore,
  PlannedMatch,
  ScheduleQualityDimension,
  ScheduleQuality,
  PlayerRuntimeState,
  SessionSchedule,
} from './schedule'
