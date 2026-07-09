import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { matchesService } from '../services/matches.service'
import { sessionQueryKeys } from './useSessions'
import { friendlyMatchErrorMessage } from '../utils'
import { useCurrentGroupStore } from '@/app/store/current-group.store'
import type { CreateMatchData } from '../types'

const NO_CURRENT_GROUP_ERROR = 'No current group selected'

export function useSessionMatchesQuery(sessionId: string) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: sessionQueryKeys.matches(sessionId),
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return matchesService.getSessionMatches(currentGroupId, sessionId)
    },
    enabled: Boolean(currentGroupId) && Boolean(sessionId),
  })
}

export function useCreateMatchMutation(sessionId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: (data: CreateMatchData) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return matchesService.createMatch(currentGroupId, sessionId, data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.matches(sessionId),
      })
      toast.success(t('sessions.toasts.matchRecorded'))
    },
    onError: (error: Error) =>
      toast.error(friendlyMatchErrorMessage(error.message, 'Unable to record match.')),
  })
}

/**
 * Updates the scores of an existing match.
 * Team composition is immutable — only scores change.
 */
export function useUpdateMatchScoresMutation(sessionId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: ({
      matchId,
      team1Score,
      team2Score,
    }: {
      matchId: string
      team1Score: number
      team2Score: number
    }) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return matchesService.updateScores(currentGroupId, matchId, team1Score, team2Score)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: sessionQueryKeys.matches(sessionId),
      })
      toast.success(t('matches.toasts.scoresUpdated'))
    },
    onError: (error: Error) =>
      toast.error(friendlyMatchErrorMessage(error.message, 'Unable to update match score.')),
  })
}
