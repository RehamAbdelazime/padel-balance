import { supabase } from '@/infrastructure/supabase/client'
import type { PlayerMatchResult } from '../types'

/**
 * Shape of the Supabase nested-select result from the second query.
 * `match_teams` here is the team the player was ON.
 * `matches.match_teams` is the array of ALL teams for that match.
 */
type MyTeamRow = {
  team_number: number
  score: number
  matches: {
    id: string
    match_teams: Array<{
      team_number: number
      score: number
    }>
  }
}

/**
 * Returns all match results for a player as [myScore, opponentScore] pairs.
 *
 * Two-query strategy:
 *   1. `match_team_players` → get the match_team IDs the player belongs to.
 *   2. `match_teams` (with nested match + all teams) → resolve scores.
 *
 * Using two queries rather than a single deeply-nested select avoids
 * the ambiguity of `match_teams → matches → match_teams` (same table at
 * two nesting levels), and keeps each query's shape explicit and typed.
 */
async function getPlayerMatchResults(playerId: string): Promise<PlayerMatchResult[]> {
  // ── Query 1: which teams did this player play on? ─────────────────────────
  const { data: teamMemberships, error: e1 } = await supabase
    .from('match_team_players')
    .select('match_team_id')
    .eq('player_id', playerId)

  if (e1) throw new Error(e1.message)
  if (!teamMemberships || teamMemberships.length === 0) return []

  const teamIds = teamMemberships.map((r) => r.match_team_id)

  // ── Query 2: get those teams with their match data ────────────────────────
  // Includes all teams for each match so we can find the opponent's score.
  const { data: myTeams, error: e2 } = await supabase
    .from('match_teams')
    .select(`
      team_number,
      score,
      matches (
        id,
        match_teams (
          team_number,
          score
        )
      )
    `)
    .in('id', teamIds)

  if (e2) throw new Error(e2.message)
  if (!myTeams) return []

  const rows = myTeams as unknown as MyTeamRow[]

  return rows.map((row) => {
    const opponentTeam = row.matches.match_teams.find(
      (t) => t.team_number !== row.team_number,
    )
    return {
      matchId: row.matches.id,
      myScore: row.score,
      opponentScore: opponentTeam?.score ?? 0,
    }
  })
}

export const playerStatsService = { getPlayerMatchResults } as const
