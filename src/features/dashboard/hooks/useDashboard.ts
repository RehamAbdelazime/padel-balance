import { useSessionsQuery } from '@/features/sessions/hooks/useSessions'
import { useSessionAttendanceQuery, useAttendanceForSessionsQuery } from '@/features/sessions/hooks/useAttendance'
import { useFormatIdsForSessionsQuery, useLiveScheduleQuery } from '@/features/sessions/hooks/useScheduleSummary'
import { usePlayersQuery, useArchivedPlayerCountQuery } from '@/features/players/hooks/usePlayers'
import type { Session } from '@/features/sessions/types'
import { UPCOMING_SESSIONS_LIMIT, RECENT_SESSIONS_LIMIT } from '../constants'

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth()    === b.getMonth()
      && a.getDate()     === b.getDate()
}

/**
 * Composes every query the Dashboard needs and derives its sections from
 * them. Reuses `useSessionsQuery`/`usePlayersQuery` (already fetched by
 * SessionsPage/PlayersPage — no new request shape for data the app already
 * loads elsewhere) and adds only the small, purpose-built batched queries
 * (archived count, attendance-for-sessions, format-ids-for-sessions) that
 * don't already exist. Every session-derived list below is computed from
 * the ONE `useSessionsQuery` result — there is no per-section session
 * fetch, and no per-session attendance/format fetch (both are one batched
 * request each, keyed off the union of session ids the Dashboard actually
 * displays).
 */
export function useDashboard() {
  const sessionsQuery = useSessionsQuery()
  const playersQuery  = usePlayersQuery()
  const archivedCountQuery = useArchivedPlayerCountQuery()

  const sessions = sessionsQuery.data ?? []
  const now = new Date()

  const liveSession: Session | undefined = sessions.find(s => s.status === 'LIVE')

  const todaysSessions = sessions.filter(s => isSameDay(new Date(s.scheduled_at), now))

  const upcomingSessions = sessions
    .filter(s => s.status === 'PLANNING' && new Date(s.scheduled_at).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, UPCOMING_SESSIONS_LIMIT)

  const recentSessions = sessions
    .filter(s => s.status === 'FINISHED')
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, RECENT_SESSIONS_LIMIT)

  const relevantSessionIds = [
    ...new Set([...todaysSessions, ...upcomingSessions, ...recentSessions].map(s => s.id)),
  ]

  const attendanceQuery     = useAttendanceForSessionsQuery(relevantSessionIds)
  const formatIdsQuery      = useFormatIdsForSessionsQuery(relevantSessionIds)
  const liveAttendanceQuery = useSessionAttendanceQuery(liveSession?.id ?? '')
  const liveScheduleQuery   = useLiveScheduleQuery(liveSession?.id)

  const attendanceCountBySession = new Map<string, number>()
  for (const row of attendanceQuery.data ?? []) {
    attendanceCountBySession.set(row.session_id, (attendanceCountBySession.get(row.session_id) ?? 0) + 1)
  }

  const todayIds = new Set(todaysSessions.map(s => s.id))
  const todaysPlayerIds = new Set(
    (attendanceQuery.data ?? []).filter(r => todayIds.has(r.session_id)).map(r => r.player_id),
  )

  const activePlayerCount   = playersQuery.data?.length ?? 0
  const archivedPlayerCount = archivedCountQuery.data ?? 0

  return {
    isLoading: sessionsQuery.isLoading || playersQuery.isLoading,
    isError:   sessionsQuery.isError || playersQuery.isError,
    refetch:   () => { void sessionsQuery.refetch(); void playersQuery.refetch() },

    liveSession,
    liveAttendees:     liveAttendanceQuery.data ?? [],
    liveSchedule:      liveScheduleQuery.data ?? null,
    isLiveScheduleLoading: liveScheduleQuery.isLoading,

    todaysSessions,
    todaysPlayerCount: todaysPlayerIds.size,

    upcomingSessions,
    recentSessions,
    attendanceCountBySession,
    formatIdsBySession: formatIdsQuery.data ?? new Map<string, string>(),

    playerCounts: {
      total:          activePlayerCount + archivedPlayerCount,
      active:         activePlayerCount,
      archived:       archivedPlayerCount,
      attendingToday: todaysPlayerIds.size,
    },

    /** Real timestamp of the sessions query's last successful fetch — not simulated. */
    lastSyncAt:    sessionsQuery.dataUpdatedAt,
    isDbConnected: !sessionsQuery.isError,
  }
}
