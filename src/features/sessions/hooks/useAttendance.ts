import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { attendanceService } from '../services/attendance.service'
import { sessionQueryKeys } from './useSessions'
import { friendlyAttendanceErrorMessage } from '../utils'

/** Returns all attendees for a session with player details. */
export function useSessionAttendanceQuery(sessionId: string) {
  return useQuery({
    queryKey: sessionQueryKeys.attendance(sessionId),
    queryFn: () => attendanceService.getSessionAttendees(sessionId),
    enabled: Boolean(sessionId),
  })
}

/**
 * Attendance rows for several sessions in one request — Dashboard only.
 * `sessionIds` is sorted before becoming part of the query key so the same
 * set of ids (in any order) reuses the same cache entry.
 */
export function useAttendanceForSessionsQuery(sessionIds: readonly string[]) {
  const key = [...sessionIds].sort()
  return useQuery({
    queryKey: ['sessions', 'attendanceForSessions', key] as const,
    queryFn: () => attendanceService.getAttendanceForSessions(key),
    enabled: key.length > 0,
  })
}

/** Adds a player to a session. Duplicate prevention is enforced by the DB constraint. */
export function useAddAttendanceMutation(sessionId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (playerId: string) =>
      attendanceService.addPlayer(sessionId, playerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.attendance(sessionId),
      })
      toast.success(t('sessions.toasts.playerAdded'))
    },
    onError: (error: Error) =>
      toast.error(friendlyAttendanceErrorMessage(error.message, 'Unable to add player to session.')),
  })
}

/** Removes a player from a session by the session_players row id. */
export function useRemoveAttendanceMutation(sessionId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionPlayerId: string) =>
      attendanceService.removePlayer(sessionPlayerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.attendance(sessionId),
      })
      toast.success(t('sessions.toasts.playerRemoved'))
    },
    onError: (error: Error) =>
      toast.error(friendlyAttendanceErrorMessage(error.message, 'Unable to remove player from session.')),
  })
}
