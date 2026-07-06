/**
 * Report filters (Section 7) — pure, applied once at the page level so
 * every section reads already-filtered data instead of each re-implementing
 * the same predicate.
 */
import type { MatchReportRow, RoundReportGroup, PlayerReportStats } from '../types'

export type ReportFiltersState = {
  readonly playerId:    string | null
  readonly roundNumber: number | null
  readonly court:       number | null
  readonly search:      string
}

export const EMPTY_REPORT_FILTERS: ReportFiltersState = {
  playerId: null,
  roundNumber: null,
  court: null,
  search: '',
}

export function hasActiveFilters(filters: ReportFiltersState): boolean {
  return filters.playerId !== null || filters.roundNumber !== null || filters.court !== null || filters.search.trim() !== ''
}

function matchIncludesPlayer(match: MatchReportRow, playerId: string): boolean {
  return match.teamA.includes(playerId) || match.teamB.includes(playerId)
}

/** Round/court/player/search all apply — a match must satisfy every active filter. */
export function filterRounds(
  rounds: readonly RoundReportGroup[],
  filters: ReportFiltersState,
  playerName: (id: string) => string,
): RoundReportGroup[] {
  const search = filters.search.trim().toLowerCase()

  return rounds
    .filter(round => filters.roundNumber === null || round.roundNumber === filters.roundNumber)
    .map(round => ({
      roundNumber: round.roundNumber,
      matches: round.matches.filter(match => {
        if (filters.court !== null && match.courtNumber !== filters.court) return false
        if (filters.playerId !== null && !matchIncludesPlayer(match, filters.playerId)) return false
        if (search) {
          const names = [...match.teamA, ...match.teamB].map(playerName).join(' ').toLowerCase()
          if (!names.includes(search)) return false
        }
        return true
      }),
    }))
    .filter(round => round.matches.length > 0)
}

/** Round/court are match-level facets, not player attributes — only player + search apply here. */
export function filterPlayers(
  players: readonly PlayerReportStats[],
  filters: ReportFiltersState,
): PlayerReportStats[] {
  const search = filters.search.trim().toLowerCase()

  return players.filter(player => {
    if (filters.playerId !== null && player.playerId !== filters.playerId) return false
    if (search && !player.name.toLowerCase().includes(search)) return false
    return true
  })
}
