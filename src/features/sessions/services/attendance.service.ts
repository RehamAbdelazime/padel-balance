import { supabase } from '@/infrastructure/supabase/client'
import type { SessionAttendee, SessionPlayer } from '../types'

/**
 * Attendance service.
 * Manages the session_players junction table.
 * Adding attendance is idempotent via the UNIQUE(session_id, player_id) constraint.
 * Removing attendance hard-deletes the junction row — the player and session are preserved.
 */

/**
 * Returns all attendees for a session with their player details, ordered by player name.
 * Uses a nested select to join session_players with the players table.
 */
async function getSessionAttendees(sessionId: string): Promise<SessionAttendee[]> {
  const { data, error } = await supabase
    .from('session_players')
    .select(`
      id,
      session_id,
      player_id,
      created_at,
      players (
        id,
        name,
        phone
      )
    `)
    .eq('session_id', sessionId)

  if (error) throw new Error(error.message)

  const attendees = (data as unknown as SessionAttendee[])
  // Sort by player name client-side (nested column ordering is unreliable in PostgREST)
  return [...attendees].sort((a, b) => a.players.name.localeCompare(b.players.name))
}

/**
 * Returns the raw (session_id, player_id) attendance rows for several
 * sessions in one query — used by the Dashboard to derive both per-session
 * registered-player counts and a distinct today's-players count from a
 * single request, instead of one query per session.
 */
async function getAttendanceForSessions(
  sessionIds: readonly string[],
): Promise<Array<{ session_id: string; player_id: string }>> {
  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from('session_players')
    .select('session_id, player_id')
    .in('session_id', sessionIds)

  if (error) throw new Error(error.message)
  return data
}

/** Adds a player to a session. The DB UNIQUE constraint prevents duplicates. */
async function addPlayer(sessionId: string, playerId: string): Promise<SessionPlayer> {
  const { data, error } = await supabase
    .from('session_players')
    .insert({ session_id: sessionId, player_id: playerId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Removes a player from a session by the session_players row id. */
async function removePlayer(sessionPlayerId: string): Promise<void> {
  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('id', sessionPlayerId)

  if (error) throw new Error(error.message)
}

export const attendanceService = {
  getSessionAttendees,
  getAttendanceForSessions,
  addPlayer,
  removePlayer,
} as const
