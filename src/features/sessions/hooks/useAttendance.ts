import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { attendanceService } from '../services/attendance.service'
import { sessionQueryKeys } from './useSessions'
import { friendlyAttendanceErrorMessage } from '../utils'
import { useCurrentGroupStore } from '@/app/store/current-group.store'

const NO_CURRENT_GROUP_ERROR = 'No current group selected'

/** Returns all attendees for a session with player details. */
export function useSessionAttendanceQuery(sessionId: string) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: sessionQueryKeys.attendance(sessionId),
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return attendanceService.getSessionAttendees(currentGroupId, sessionId)
    },
    enabled: Boolean(currentGroupId) && Boolean(sessionId),
  })
}

/**
 * Attendance rows for several sessions in one request — Dashboard only.
 * `sessionIds` is sorted before becoming part of the query key so the same
 * set of ids (in any order) reuses the same cache entry.
 */
export function useAttendanceForSessionsQuery(sessionIds: readonly string[]) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)
  const key = [...sessionIds].sort()
  return useQuery({
    queryKey: ['sessions', 'attendanceForSessions', key] as const,
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return attendanceService.getAttendanceForSessions(currentGroupId, key)
    },
    enabled: Boolean(currentGroupId) && key.length > 0,
  })
}

/** Full attendee rows (with names) for several sessions in one request — Player History only. */
export function useAttendeesForSessionsQuery(sessionIds: readonly string[]) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)
  const key = [...sessionIds].sort()
  return useQuery({
    queryKey: ['sessions', 'attendeesForSessions', key] as const,
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return attendanceService.getAttendeesForSessions(currentGroupId, key)
    },
    enabled: Boolean(currentGroupId) && key.length > 0,
  })
}

/** Every non-archived session a player has attended — the seed query for Player History. */
export function useSessionsForPlayerQuery(playerId: string) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: ['players', playerId, 'sessions'] as const,
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return attendanceService.getSessionsForPlayer(currentGroupId, playerId)
    },
    enabled: Boolean(currentGroupId) && Boolean(playerId),
  })
}

/** Adds a player to a session. Duplicate prevention is enforced by the DB constraint. */
export function useAddAttendanceMutation(sessionId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: (playerId: string) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return attendanceService.addPlayer(currentGroupId, sessionId, playerId)
    },
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
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: (sessionPlayerId: string) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return attendanceService.removePlayer(currentGroupId, sessionPlayerId)
    },
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
