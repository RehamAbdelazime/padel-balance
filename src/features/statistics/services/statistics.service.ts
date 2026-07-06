import type { PlayerMatchResult, PlayerStats } from '../types'

/**
 * Calculates player statistics from an array of match results.
 *
 * Pure function: no side effects, no network calls, no React.
 *
 * Two-tier model:
 *
 *   Match-level stats count outcomes per match:
 *     matchesWon  = results where myScore > opponentScore
 *     matchesLost = results where myScore < opponentScore
 *     matchesDraw = results where myScore === opponentScore
 *     matchWinPercentage = round(matchesWon / matchesPlayed × 100)
 *
 *   Score-level stats accumulate raw scores across all matches:
 *     gamesWon      = Σ myScore
 *     gamesLost     = Σ opponentScore
 *     gameDifference = gamesWon − gamesLost
 */
export function calculatePlayerStats(results: PlayerMatchResult[]): PlayerStats {
  const matchesPlayed = results.length

  if (matchesPlayed === 0) {
    return {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      matchesDraw: 0,
      matchWinPercentage: 0,
      gamesWon: 0,
      gamesLost: 0,
      gameDifference: 0,
    }
  }

  // ── Match-level ────────────────────────────────────────────────────────────
  const matchesWon  = results.filter((r) => r.myScore > r.opponentScore).length
  const matchesLost = results.filter((r) => r.myScore < r.opponentScore).length
  const matchesDraw = results.filter((r) => r.myScore === r.opponentScore).length
  const matchWinPercentage = Math.round((matchesWon / matchesPlayed) * 100)

  // ── Score-level ────────────────────────────────────────────────────────────
  const gamesWon  = results.reduce((sum, r) => sum + r.myScore, 0)
  const gamesLost = results.reduce((sum, r) => sum + r.opponentScore, 0)
  const gameDifference = gamesWon - gamesLost

  return {
    matchesPlayed,
    matchesWon,
    matchesLost,
    matchesDraw,
    matchWinPercentage,
    gamesWon,
    gamesLost,
    gameDifference,
  }
}
