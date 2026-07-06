/**
 * Statistics domain types.
 *
 * All statistics are derived from match history — nothing is persisted.
 * `PlayerMatchResult` is the minimal input needed by the calculator.
 * `PlayerStats` is the calculated output.
 *
 * Two-tier model:
 *   Match-level — outcomes counted per match (won/lost/draw/win%)
 *   Score-level — raw scores accumulated across matches (games won/lost/diff)
 */

/** A single match result from one player's perspective. */
export type PlayerMatchResult = {
  matchId: string
  myScore: number
  opponentScore: number
}

/** Calculated statistics for a player, derived from their match history. */
export type PlayerStats = {
  // ── Match-level ────────────────────────────────────────────────────────────
  matchesPlayed: number
  /** Matches where myScore > opponentScore. */
  matchesWon: number
  /** Matches where myScore < opponentScore. */
  matchesLost: number
  /** Matches where myScore === opponentScore. Stored for completeness. */
  matchesDraw: number
  /** Round integer 0–100. Zero when no matches played. */
  matchWinPercentage: number
  // ── Score-level ────────────────────────────────────────────────────────────
  /** Sum of myScore across all matches. */
  gamesWon: number
  /** Sum of opponentScore across all matches. */
  gamesLost: number
  /** gamesWon − gamesLost. Negative when opponent total exceeds own total. */
  gameDifference: number
}
