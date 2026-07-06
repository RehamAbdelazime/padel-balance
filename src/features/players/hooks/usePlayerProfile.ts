import { useMemo } from 'react'
import { usePlayerQuery } from './usePlayers'
import { useSessionsQuery } from '@/features/sessions/hooks/useSessions'
import { useSessionsForPlayerQuery, useAttendeesForSessionsQuery } from '@/features/sessions/hooks/useAttendance'
import { useMatchesForSessionsQuery } from '@/features/sessions/hooks/useScheduleSummary'
import { computePlayerProfile } from '../utils/compute-player-history'

/**
 * Composes every query Player History needs and memoizes the pure
 * aggregation on top. Reuses `usePlayerQuery` and `useSessionsQuery`
 * unchanged (both already exist for the Players/Sessions pages and
 * Dashboard) and adds only the batched, session-id-keyed queries that don't
 * already exist (Sprint H1) — no per-session request for a player who has
 * attended N sessions.
 */
export function usePlayerProfile(playerId: string) {
  const playerQuery = usePlayerQuery(playerId)
  const allSessionsQuery = useSessionsQuery()
  const attendedSessionsQuery = useSessionsForPlayerQuery(playerId)

  const attendedSessions = attendedSessionsQuery.data ?? []
  const sessionIds = attendedSessions.map(s => s.id)

  const matchesQuery   = useMatchesForSessionsQuery(sessionIds)
  const attendeesQuery = useAttendeesForSessionsQuery(sessionIds)

  const isLoading =
    playerQuery.isLoading || allSessionsQuery.isLoading || attendedSessionsQuery.isLoading
    || (sessionIds.length > 0 && (matchesQuery.isLoading || attendeesQuery.isLoading))
  const isError =
    playerQuery.isError || allSessionsQuery.isError || attendedSessionsQuery.isError
    || matchesQuery.isError || attendeesQuery.isError

  const matchesBySession = matchesQuery.data ?? new Map()
  const attendees         = attendeesQuery.data ?? []
  const allSessions        = allSessionsQuery.data ?? []

  const profile = useMemo(
    () => computePlayerProfile(playerId, attendedSessions, matchesBySession, attendees, allSessions),
    [playerId, attendedSessions, matchesBySession, attendees, allSessions],
  )

  return {
    isLoading,
    isError,
    refetch: () => {
      void playerQuery.refetch()
      void allSessionsQuery.refetch()
      void attendedSessionsQuery.refetch()
      void matchesQuery.refetch()
      void attendeesQuery.refetch()
    },
    player: playerQuery.data,
    profile,
  }
}
