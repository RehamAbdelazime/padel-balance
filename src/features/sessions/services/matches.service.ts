import { supabase } from '@/infrastructure/supabase/client'
import type { MatchWithTeams, CreateMatchData } from '../types'

/**
 * Matches service.
 *
 * Known limitation, deferred by design: createMatch performs 5 sequential
 * Supabase inserts with no surrounding transaction. If a later insert fails
 * (e.g. network drop between steps), earlier rows (the match, or one of its
 * two match_teams rows) are left orphaned — and cannot be cleaned up
 * client-side, because `matches`/`match_teams`/`match_team_players` are
 * insert-only by RLS policy (migration 002: "matches: insert-only in Sprint
 * 2; match editing deferred" — no DELETE policy exists on any of the three
 * tables). A real fix requires a single Postgres RPC wrapping all 5 inserts
 * in one transaction, which is a schema migration requiring its own
 * explicit sprint approval — not attempted here.
 *
 * All operations are group-scoped: match_teams/match_team_players have no
 * group_id column of their own, so group membership is enforced via the
 * related matches/sessions rows.
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

/** Throws unless the match belongs to groupId. */
async function assertMatchInGroup(groupId: string, matchId: string): Promise<void> {
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('id', matchId)
    .eq('group_id', groupId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('Match does not belong to the current group')
}

async function getSessionMatches(groupId: string, sessionId: string): Promise<MatchWithTeams[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      id,
      session_id,
      created_at,
      updated_at,
      match_teams (
        id,
        match_id,
        team_number,
        score,
        created_at,
        match_team_players (
          player_id,
          players (
            id,
            name
          )
        )
      )
    `)
    .eq('session_id', sessionId)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const raw = data as unknown as MatchWithTeams[]

  return raw.map((match) => ({
    ...match,
    match_teams: [...match.match_teams].sort(
      (a, b) => a.team_number - b.team_number,
    ) as MatchWithTeams['match_teams'],
  }))
}

async function createMatch(groupId: string, sessionId: string, input: CreateMatchData): Promise<void> {
  await assertSessionInGroup(groupId, sessionId)

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .insert({ session_id: sessionId, group_id: groupId })
    .select('id')
    .single()
  if (matchErr) throw new Error(matchErr.message)

  const { data: team1, error: team1Err } = await supabase
    .from('match_teams')
    .insert({ match_id: match.id, team_number: 1, score: input.team1Score })
    .select('id')
    .single()
  if (team1Err) throw new Error(team1Err.message)

  const { data: team2, error: team2Err } = await supabase
    .from('match_teams')
    .insert({ match_id: match.id, team_number: 2, score: input.team2Score })
    .select('id')
    .single()
  if (team2Err) throw new Error(team2Err.message)

  const { error: tp1Err } = await supabase
    .from('match_team_players')
    .insert([
      { match_team_id: team1.id, player_id: input.team1PlayerIds[0] },
      { match_team_id: team1.id, player_id: input.team1PlayerIds[1] },
    ])
  if (tp1Err) throw new Error(tp1Err.message)

  const { error: tp2Err } = await supabase
    .from('match_team_players')
    .insert([
      { match_team_id: team2.id, player_id: input.team2PlayerIds[0] },
      { match_team_id: team2.id, player_id: input.team2PlayerIds[1] },
    ])
  if (tp2Err) throw new Error(tp2Err.message)
}

/**
 * Updates both team scores for a match.
 * Team composition is immutable — only scores are changed.
 * Requires the mt_update_all RLS policy from migration 003.
 */
async function updateScores(
  groupId: string,
  matchId: string,
  team1Score: number,
  team2Score: number,
): Promise<void> {
  await assertMatchInGroup(groupId, matchId)

  const { error: e1 } = await supabase
    .from('match_teams')
    .update({ score: team1Score })
    .eq('match_id', matchId)
    .eq('team_number', 1)
  if (e1) throw new Error(e1.message)

  const { error: e2 } = await supabase
    .from('match_teams')
    .update({ score: team2Score })
    .eq('match_id', matchId)
    .eq('team_number', 2)
  if (e2) throw new Error(e2.message)
}

export const matchesService = { getSessionMatches, createMatch, updateScores } as const
