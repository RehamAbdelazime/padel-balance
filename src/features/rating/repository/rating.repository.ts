import { supabase } from '@/infrastructure/supabase/client'
import { RATING } from '../constants/rating.constants'
import { processMatch } from '../services/rating-engine'
import type { RatingState, RatingMatch, RatingUpdate } from '../types/rating'

// ── DB row types (repository-internal) ────────────────────────────────────────
// These reflect only the columns the repository needs from Supabase.
// They are intentionally narrower than the session feature's MatchWithTeams —
// player names are not required here.

type MatchTeamPlayerRow = {
  player_id: string
}

type MatchTeamRow = {
  team_number: number
  score: number
  match_team_players: MatchTeamPlayerRow[]
}

type MatchRow = {
  id: string
  created_at: string
  match_teams: MatchTeamRow[]
}

// ── Repository ────────────────────────────────────────────────────────────────

/**
 * Rebuilds every player's RatingState entirely from match history.
 *
 * Responsibilities:
 *   - Fetch all matches from the database
 *   - Sort chronologically before processing (order is correctness-critical)
 *   - Feed each match into processMatch() sequentially
 *   - Maintain in-memory state: Map<playerId, RatingState>
 *   - Expose read-only access to computed ratings
 *
 * The repository is orchestration-only. It contains no math. All rating
 * logic lives in the engine (processMatch) and math modules.
 *
 * API is future-proof for caching: rebuildRatings() is the one place
 * where staleness checking, TTL logic, or event-driven invalidation can
 * be added without touching getPlayerRating() or getPlayersRatings().
 */
export class RatingRepository {
  private _ratings: Map<string, RatingState> = new Map()

  // ── Private helpers ──────────────────────────────────────────────────────────

  /**
   * The initial state assigned to any player encountered for the first time.
   * This is what the engine receives as the player's "history" on their debut match.
   */
  private static defaultState(): RatingState {
    return {
      mu: RATING.INITIAL_MU,
      sigma: RATING.INITIAL_SIGMA,
      n: 0,
      form: 0,
      lastMatchAt: null,
    }
  }

  /** Returns the stored rating for a player, or the default if not yet seen. */
  private getOrDefault(playerId: string): RatingState {
    return this._ratings.get(playerId) ?? RatingRepository.defaultState()
  }

  /**
   * Applies a single RatingUpdate to a player's stored state.
   *
   * deltaMu is additive; all other fields are replacements.
   * lastMatchAt is always set to the match's playedAt date — the engine
   * requires this for inactivity drift and form effective-days on the
   * next call.
   */
  private applyUpdate(
    playerId: string,
    current: RatingState,
    update: RatingUpdate,
    playedAt: Date,
  ): void {
    this._ratings.set(playerId, {
      mu:          current.mu + update.deltaMu,
      sigma:       update.nextSigma,
      n:           update.nextN,
      form:        update.nextForm,
      lastMatchAt: playedAt,
    })
  }

  /**
   * Converts one MatchRow into a RatingMatch, feeds it to processMatch(),
   * and applies the result to the in-memory state.
   *
   * The player-ID → position mapping is established once (in the RatingMatch
   * construction) and reused immediately (in applyUpdate), so the engine's
   * positional result indices always correspond to the correct player IDs.
   *
   * Skips silently if the match is structurally malformed (missing teams or
   * non-standard player counts). This preserves rebuild integrity at the cost
   * of excluding the malformed match from all subsequent calculations.
   */
  private processMatchRow(row: MatchRow): void {
    // Teams must be sorted so team_number 1 is always index 0.
    const teams = [...row.match_teams].sort((a, b) => a.team_number - b.team_number)

    const team1 = teams[0]
    const team2 = teams[1]

    if (team1 === undefined || team2 === undefined) return

    const t1p = team1.match_team_players
    const t2p = team2.match_team_players

    // A valid padel match has exactly 2 players per team.
    if (t1p.length !== 2 || t2p.length !== 2) return

    const playedAt = new Date(row.created_at)

    // Build the RatingMatch using current in-memory states.
    // Player IDs at each position are tracked to correctly route updates back.
    const idA1 = t1p[0]!.player_id, idA2 = t1p[1]!.player_id
    const idB1 = t2p[0]!.player_id, idB2 = t2p[1]!.player_id

    const stateA1 = this.getOrDefault(idA1)
    const stateA2 = this.getOrDefault(idA2)
    const stateB1 = this.getOrDefault(idB1)
    const stateB2 = this.getOrDefault(idB2)

    const ratingMatch: RatingMatch = {
      teamA: { player1: stateA1, player2: stateA2, score: team1.score },
      teamB: { player1: stateB1, player2: stateB2, score: team2.score },
      playedAt,
    }

    const result = processMatch(ratingMatch)

    // Apply — indices mirror the assignment above.
    this.applyUpdate(idA1, stateA1, result.teamA.player1, playedAt)
    this.applyUpdate(idA2, stateA2, result.teamA.player2, playedAt)
    this.applyUpdate(idB1, stateB1, result.teamB.player1, playedAt)
    this.applyUpdate(idB2, stateB2, result.teamB.player2, playedAt)
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  /**
   * Rebuilds all player ratings from scratch by replaying the full match history.
   *
   * Steps:
   *   1. Reset in-memory state
   *   2. Fetch all matches with team and player data
   *   3. Sort chronologically (SQL ORDER BY + client-side defensive sort)
   *   4. Process each match sequentially via the engine
   *
   * Calling this method replaces any previously cached state entirely.
   * It must complete before getPlayerRating() or getPlayersRatings() return
   * meaningful values.
   *
   * Future extension point: add a staleness check here so callers can invoke
   * this method freely; it will skip the rebuild when the cache is still valid.
   *
   * @throws {Error} if the Supabase query fails.
   */
  async rebuildRatings(): Promise<void> {
    this._ratings = new Map()

    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        created_at,
        match_teams (
          team_number,
          score,
          match_team_players (
            player_id
          )
        )
      `)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)

    const rows = (data ?? []) as unknown as MatchRow[]

    // Client-side sort is a defensive guarantee: chronological order is
    // correctness-critical and cannot silently fail due to query behaviour.
    rows.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    for (const row of rows) {
      this.processMatchRow(row)
    }
  }

  /**
   * Returns the current RatingState for a player.
   * Returns the default initial state if the player has no recorded matches
   * or if rebuildRatings() has not yet been called.
   */
  getPlayerRating(playerId: string): RatingState {
    return this._ratings.get(playerId) ?? RatingRepository.defaultState()
  }

  /**
   * Returns a Map of RatingState for the requested player IDs.
   * Players with no recorded matches receive the default initial state.
   * The returned Map contains exactly the requested IDs (no extras, no gaps).
   */
  getPlayersRatings(playerIds: string[]): Map<string, RatingState> {
    const result = new Map<string, RatingState>()
    for (const id of playerIds) {
      result.set(id, this.getPlayerRating(id))
    }
    return result
  }
}
