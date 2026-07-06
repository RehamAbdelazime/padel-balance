import { useQuery } from '@tanstack/react-query'
import { playerStatsService } from '../services/player-stats.service'
import { calculatePlayerStats } from '../services/statistics.service'

// ── Query key factory ─────────────────────────────────────────────────────────

export const playerStatsQueryKeys = {
  /** Raw match results for a player — the cache source for derived queries. */
  matchResults: (playerId: string) =>
    ['player-stats', 'match-results', playerId] as const,
} as const

// ── Read hooks ────────────────────────────────────────────────────────────────

/**
 * Returns raw `PlayerMatchResult[]` for a player.
 *
 * Exposed as a standalone hook so future features (ratings, confidence scores)
 * can consume the raw results without re-fetching.
 */
export function usePlayerMatchResultsQuery(playerId: string) {
  return useQuery({
    queryKey: playerStatsQueryKeys.matchResults(playerId),
    queryFn:  () => playerStatsService.getPlayerMatchResults(playerId),
    enabled:  Boolean(playerId),
  })
}

/**
 * Returns calculated `PlayerStats` derived from the player's match history.
 *
 * Uses the same query key as `usePlayerMatchResultsQuery` — the `select`
 * option transforms the cached `PlayerMatchResult[]` to `PlayerStats` on
 * the client during render. No additional network call is made when both
 * hooks are mounted.
 */
export function usePlayerStatsQuery(playerId: string) {
  return useQuery({
    queryKey: playerStatsQueryKeys.matchResults(playerId),
    queryFn:  () => playerStatsService.getPlayerMatchResults(playerId),
    select:   calculatePlayerStats,
    enabled:  Boolean(playerId),
  })
}
