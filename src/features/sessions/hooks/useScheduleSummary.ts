import { useQuery } from '@tanstack/react-query'
import { schedulePersistenceService } from '../services/schedule-persistence.service'

/**
 * Read-only schedule summary queries — Dashboard only. Distinct from
 * useSchedule.ts, which owns full runtime state/mutations for one session's
 * live workspace; these are lightweight, cache-friendly reads with no
 * mutation surface.
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

/** The live session's persisted schedule — used for the Dashboard's Active Session card. */
export function useLiveScheduleQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['sessions', sessionId, 'liveScheduleSummary'] as const,
    queryFn: () => schedulePersistenceService.loadSchedule(sessionId!),
    enabled: Boolean(sessionId),
  })
}
