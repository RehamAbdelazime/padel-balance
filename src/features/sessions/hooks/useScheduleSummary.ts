import { useQuery } from '@tanstack/react-query'
import { schedulePersistenceService } from '../services/schedule-persistence.service'

/**
 * Read-only schedule summary queries — used by the Dashboard and by Session
 * Reports. Distinct from useSchedule.ts, which owns full runtime
 * state/mutations for one session's live workspace; these are lightweight,
 * cache-friendly reads with no mutation surface, safe for a read-only
 * consumer like a report to depend on.
 */

/**
 * Each session's format_id in one request — used for the Upcoming/Recent
 * sessions lists instead of loading a full schedule per session.
 */
export function useFormatIdsForSessionsQuery(sessionIds: readonly string[]) {
  const key = [...sessionIds].sort()
  return useQuery({
    queryKey: ['sessions', 'formatIdsForSessions', key] as const,
    queryFn: () => schedulePersistenceService.getFormatIdsForSessions(key),
    enabled: key.length > 0,
  })
}

/**
 * A session's persisted schedule (any phase — LIVE for the Dashboard's
 * Active Session card, FINISHED for a Session Report). One shared query key
 * per session id, so a Dashboard view and a Report for the same session
 * reuse the same cache entry instead of fetching it twice.
 */
export function useSessionScheduleQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', sessionId, 'scheduleSummary'] as const,
    queryFn: () => schedulePersistenceService.loadSchedule(sessionId!),
    enabled: Boolean(sessionId),
  })
}
