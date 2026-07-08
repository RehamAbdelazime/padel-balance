import { supabase } from '@/infrastructure/supabase/client'
import type { SessionAttendee, SessionPlayer, Session } from '../types'

/**
 * Attendance service.
 * Manages the session_players junction table.
 * Adding attendance is idempotent via the UNIQUE(session_id, player_id) constraint.
 * Removing attendance hard-deletes the junction row — the player and session are preserved.
 *
 * All operations are group-scoped: session_players has no group_id column of
 * its own, so group membership is enforced via the related session and player rows.
 */

/** Throws unless the session belongs to groupId. */
async function assertSessionInGroup(groupId: string, sessionId: string): Promise<void> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('group_id', groupId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Session does not belong to the current group')
}

/** Throws unless the player belongs to groupId. */
async function assertPlayerInGroup(groupId: string, playerId: string): Promise<void> {
  const { data, error } = await supabase
    .from('players')
    .select('id')
    .eq('id', playerId)
    .eq('group_id', groupId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Player does not belong to the current group')
}

/**
 * Returns all attendees for a session with their player details, ordered by player name.
 * Uses a nested select to join session_players with the players table.
 */
async function getSessionAttendees(groupId: string, sessionId: string): Promise<SessionAttendee[]> {
  await assertSessionInGroup(groupId, sessionId)

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
 *
 * Sessions outside groupId are silently excluded.
 */
async function getAttendanceForSessions(
  groupId: string,
  sessionIds: readonly string[],
): Promise<Array<{ session_id: string; player_id: string }>> {
  if (sessionIds.length === 0) return []

  const { data, error } = await supabase
    .from('session_players')
    .select('session_id, player_id, sessions!inner(group_id)')
    .in('session_id', sessionIds)
    .eq('sessions.group_id', groupId)

  if (error) throw new Error(error.message)
  return (data as unknown as Array<{ session_id: string; player_id: string }>).map(
    ({ session_id, player_id }) => ({ session_id, player_id }),
  )
}

/**
 * Full attendee rows (with player name/phone) for several sessions in one
 * query — used by Player History (Sprint H1) to build partner/opponent name
 * lookups and per-session player counts from a single request, instead of
 * one `getSessionAttendees` call per attended session.
 *
 * Sessions outside groupId are silently excluded.
 */
async function getAttendeesForSessions(
  groupId: string,
  sessionIds: readonly string[],
): Promise<SessionAttendee[]> {
  if (sessionIds.length === 0) return []

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
      ),
      sessions!inner (
        group_id
      )
    `)
    .in('session_id', sessionIds)
    .eq('sessions.group_id', groupId)

  if (error) throw new Error(error.message)
  return data as unknown as SessionAttendee[]
}

/**
 * Every non-archived session a player has ever attended — used by Player
 * History (Sprint H1) as the seed for session/match/partner/opponent
 * history. `sessions!inner(...)` makes the archived filter apply to the
 * joined session row, not the attendance row.
 */
async function getSessionsForPlayer(groupId: string, playerId: string): Promise<Session[]> {
  await assertPlayerInGroup(groupId, playerId)

  const { data, error } = await supabase
    .from('session_players')
    .select('sessions!inner(*)')
    .eq('player_id', playerId)
    .eq('sessions.archived', false)
    .eq('sessions.group_id', groupId)

  if (error) throw new Error(error.message)
  return (data as unknown as Array<{ sessions: Session }>).map(row => row.sessions)
}

/** Adds a player to a session. The DB UNIQUE constraint prevents duplicates. */
async function addPlayer(groupId: string, sessionId: string, playerId: string): Promise<SessionPlayer> {
  await assertSessionInGroup(groupId, sessionId)
  await assertPlayerInGroup(groupId, playerId)

  const { data, error } = await supabase
    .from('session_players')
    .insert({ session_id: sessionId, player_id: playerId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Removes a player from a session by the session_players row id. */
async function removePlayer(groupId: string, sessionPlayerId: string): Promise<void> {
  const { data, error } = await supabase
    .from('session_players')
    .select('id, sessions!inner(group_id)')
    .eq('id', sessionPlayerId)
    .eq('sessions.group_id', groupId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Attendance record does not belong to the current group')

  const { error: deleteError } = await supabase
    .from('session_players')
    .delete()
    .eq('id', sessionPlayerId)

  if (deleteError) throw new Error(deleteError.message)
}

export const attendanceService = {
  getSessionAttendees,
  getAttendanceForSessions,
  getAttendeesForSessions,
  getSessionsForPlayer,
  addPlayer,
  removePlayer,
} as const
