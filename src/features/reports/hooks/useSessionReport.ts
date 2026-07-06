import { useMemo } from 'react'
import { useSessionQuery } from '@/features/sessions/hooks/useSessions'
import { useSessionAttendanceQuery } from '@/features/sessions/hooks/useAttendance'
import { useSessionScheduleQuery } from '@/features/sessions/hooks/useScheduleSummary'
import { computeSessionReport } from '../utils/compute-report'

/**
 * Composes the exact same queries the rest of the app already uses for this
 * session (session row, attendance, persisted schedule) and memoizes the
 * pure report derivation on top — no new Supabase query shape beyond what
 * schedule-persistence.service already provides, and the calculation only
 * re-runs when the underlying data actually changes (Sprint R2 Step 9).
 */
export function useSessionReport(sessionId: string) {
  const sessionQuery    = useSessionQuery(sessionId)
  const attendanceQuery = useSessionAttendanceQuery(sessionId)
  const scheduleQuery   = useSessionScheduleQuery(sessionId)

  const isLoading = sessionQuery.isLoading || attendanceQuery.isLoading || scheduleQuery.isLoading
  const isError   = sessionQuery.isError || attendanceQuery.isError || scheduleQuery.isError

  const session    = sessionQuery.data
  const attendees  = attendanceQuery.data ?? []
  const persisted  = scheduleQuery.data ?? null

  const matches      = persisted?.schedule.matches ?? []
  const playerStates = persisted?.schedule.playerStates ?? new Map()
  const courtCount   = session?.court_count ?? 1

  const report = useMemo(
    () => computeSessionReport(matches, courtCount, attendees, playerStates),
    [matches, courtCount, attendees, playerStates],
  )

  /**
   * Estimated average time per round — rounds run concurrently across
   * courts, so total session time ≈ rounds × per-round duration. This is a
   * derived estimate from the session's own booking_duration, not a
   * measured value (no per-match timing is persisted anywhere in this app).
   */
  const estimatedMatchDurationMinutes =
    report.totalRounds > 0 && session ? Math.round(session.booking_duration / report.totalRounds) : null

  return {
    isLoading,
    isError,
    refetch: () => { void sessionQuery.refetch(); void attendanceQuery.refetch(); void scheduleQuery.refetch() },
    session,
    formatId: persisted?.formatId ?? null,
    hasSchedule: persisted !== null,
    report,
    estimatedMatchDurationMinutes,
  }
}
