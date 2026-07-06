import { supabase } from '@/infrastructure/supabase/client'
import { computeQuality } from '../generators/custom.generator'
import type { SessionSchedule, PlannedMatch, LiveMatchScore, PlayerRuntimeState } from '../types'

/**
 * schedule-persistence.service — Supabase CRUD only for the Planning-phase
 * SessionSchedule (session_schedules / session_schedule_matches /
 * session_schedule_player_states — see migration 007).
 *
 * Normalized storage, not a JSON blob on `sessions`: one row per match and
 * per player-state, so future Live Runtime features can query them directly.
 *
 * Quality is never persisted — it is a pure function of (matches, playerIds)
 * and is recomputed on every load via computeQuality().
 *
 * Replace-all strategy: every save deletes and re-inserts every match/state
 * row for the schedule. Schedules are small (a handful to a few dozen rows)
 * and edited by a single organiser, so this is simple and always correct,
 * at the cost of not being a single atomic transaction (same accepted
 * tradeoff already documented elsewhere in this codebase).
 */

export type PersistedSchedule = {
  readonly schedule: SessionSchedule
  readonly formatId: string
}

// ── Load ──────────────────────────────────────────────────────────────────────

async function loadSchedule(sessionId: string): Promise<PersistedSchedule | null> {
  const { data: scheduleRow, error: scheduleError } = await supabase
    .from('session_schedules')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (scheduleError) throw new Error(scheduleError.message)
  if (!scheduleRow) return null

  const [{ data: matchRows, error: matchError }, { data: stateRows, error: stateError }] = await Promise.all([
    supabase
      .from('session_schedule_matches')
      .select('*')
      .eq('schedule_id', scheduleRow.id)
      .order('position', { ascending: true }),
    supabase
      .from('session_schedule_player_states')
      .select('*')
      .eq('schedule_id', scheduleRow.id),
  ])

  if (matchError) throw new Error(matchError.message)
  if (stateError)  throw new Error(stateError.message)

  const matches: PlannedMatch[] = (matchRows ?? []).map(row => {
    const result: LiveMatchScore | undefined =
      row.result_team1 !== null || row.result_team2 !== null
        ? { team1: row.result_team1, team2: row.result_team2 }
        : undefined

    return {
      id:           row.match_id,
      origin:       row.origin,
      protection:   row.protection,
      modified:     row.modified,
      courtNumber:  row.court_number,
      teamA:        [row.team_a_player1, row.team_a_player2],
      teamB:        [row.team_b_player1, row.team_b_player2],
      explanation:  row.explanation,
      warnings:     row.warnings,
      isCompleted:  row.is_completed,
      ...(result ? { result } : {}),
      matchStatus:  row.match_status,
    }
  })

  const playerStates = new Map<string, PlayerRuntimeState>(
    (stateRows ?? []).map(row => [
      row.player_id,
      {
        playerId: row.player_id,
        status:   row.status,
        ...(row.replaced_by_player_id ? { replacedByPlayerId: row.replaced_by_player_id } : {}),
      },
    ]),
  )

  const playerIds = [...playerStates.keys()]
  const quality   = computeQuality(matches, playerIds)

  const schedule: SessionSchedule = {
    sessionId,
    phase:              'PLANNING',
    version:             scheduleRow.version,
    matches,
    quality,
    targetCount:         scheduleRow.target_count,
    playerStates,
    currentMatchIndex:   scheduleRow.current_match_index,
  }

  return { schedule, formatId: scheduleRow.format_id }
}

/**
 * Returns each session's format_id in one query — used by the Dashboard's
 * Upcoming/Recent sessions lists instead of loading a full schedule (with
 * all its matches and player states) per session just to read one column.
 * Sessions with no schedule yet are simply absent from the returned map.
 */
async function getFormatIdsForSessions(
  sessionIds: readonly string[],
): Promise<Map<string, string>> {
  if (sessionIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('session_schedules')
    .select('session_id, format_id')
    .in('session_id', sessionIds)

  if (error) throw new Error(error.message)
  return new Map(data.map(row => [row.session_id, row.format_id]))
}

// ── Save (replace-all) ────────────────────────────────────────────────────────

/**
 * Persists a schedule. `formatId` is required the first time a session's
 * schedule is saved (schedule creation); every later mutation (regenerate,
 * lock, swap, ...) may omit it — the existing row's format_id is preserved.
 */
async function saveSchedule(
  sessionId: string,
  schedule: SessionSchedule,
  formatId?: string,
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('session_schedules')
    .select('id, format_id')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  const effectiveFormatId = existing?.format_id ?? formatId
  if (!effectiveFormatId) {
    throw new Error(
      `saveSchedule: no schedule exists yet for session ${sessionId} and no formatId was provided.`,
    )
  }

  const { data: scheduleRow, error: upsertError } = await supabase
    .from('session_schedules')
    .upsert(
      {
        session_id:          sessionId,
        format_id:           effectiveFormatId,
        version:             schedule.version,
        target_count:        schedule.targetCount,
        current_match_index: schedule.currentMatchIndex,
      },
      { onConflict: 'session_id' },
    )
    .select()
    .single()

  if (upsertError) throw new Error(upsertError.message)

  const scheduleId = scheduleRow.id

  const { error: deleteMatchesError } = await supabase
    .from('session_schedule_matches')
    .delete()
    .eq('schedule_id', scheduleId)
  if (deleteMatchesError) throw new Error(deleteMatchesError.message)

  if (schedule.matches.length > 0) {
    const matchRows = schedule.matches.map((match, position) => ({
      schedule_id:    scheduleId,
      match_id:       match.id,
      position,
      origin:         match.origin,
      protection:     match.protection,
      modified:       match.modified,
      court_number:   match.courtNumber,
      team_a_player1: match.teamA[0],
      team_a_player2: match.teamA[1],
      team_b_player1: match.teamB[0],
      team_b_player2: match.teamB[1],
      explanation:    [...match.explanation],
      warnings:       [...match.warnings],
      is_completed:   match.isCompleted,
      result_team1:   match.result?.team1 ?? null,
      result_team2:   match.result?.team2 ?? null,
      match_status:   match.matchStatus,
    }))

    const { error: insertMatchesError } = await supabase
      .from('session_schedule_matches')
      .insert(matchRows)
    if (insertMatchesError) throw new Error(insertMatchesError.message)
  }

  const { error: deleteStatesError } = await supabase
    .from('session_schedule_player_states')
    .delete()
    .eq('schedule_id', scheduleId)
  if (deleteStatesError) throw new Error(deleteStatesError.message)

  const stateRows = [...schedule.playerStates.values()].map(state => ({
    schedule_id:           scheduleId,
    player_id:             state.playerId,
    status:                state.status,
    replaced_by_player_id: state.replacedByPlayerId ?? null,
  }))

  if (stateRows.length > 0) {
    const { error: insertStatesError } = await supabase
      .from('session_schedule_player_states')
      .insert(stateRows)
    if (insertStatesError) throw new Error(insertStatesError.message)
  }
}

export const schedulePersistenceService = {
  loadSchedule,
  getFormatIdsForSessions,
  saveSchedule,
} as const
