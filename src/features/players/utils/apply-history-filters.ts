/** Player History filters (Section 8) — pure, applied once to the match history list. */
import type { PlayerMatchHistoryRow } from '../types/player-history'

export type PlayerHistoryFilters = {
  readonly sessionId:  string | null
  readonly formatId:   string | null
  readonly partnerId:  string | null
  readonly opponentId: string | null
  /** ISO date strings (yyyy-mm-dd), inclusive range. */
  readonly fromDate:   string | null
  readonly toDate:     string | null
}

export const EMPTY_PLAYER_HISTORY_FILTERS: PlayerHistoryFilters = {
  sessionId:  null,
  formatId:   null,
  partnerId:  null,
  opponentId: null,
  fromDate:   null,
  toDate:     null,
}

export function hasActiveHistoryFilters(filters: PlayerHistoryFilters): boolean {
  return Object.values(filters).some(v => v !== null)
}

export function filterMatchHistory(
  rows: readonly PlayerMatchHistoryRow[],
  filters: PlayerHistoryFilters,
): PlayerMatchHistoryRow[] {
  return rows.filter(row => {
    if (filters.sessionId && row.sessionId !== filters.sessionId) return false
    if (filters.formatId && row.formatId !== filters.formatId) return false
    if (filters.partnerId && row.partnerId !== filters.partnerId) return false
    if (filters.opponentId && !row.opponentIds.includes(filters.opponentId)) return false
    if (filters.fromDate && row.scheduledAt.slice(0, 10) < filters.fromDate) return false
    if (filters.toDate && row.scheduledAt.slice(0, 10) > filters.toDate) return false
    return true
  })
}
