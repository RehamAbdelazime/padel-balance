import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { matchesService } from '../services/matches.service'
import { sessionQueryKeys } from './useSessions'
import { friendlyMatchErrorMessage } from '../utils'
import type { CreateMatchData } from '../types'

export function useSessionMatchesQuery(sessionId: string) {
  return useQuery({
    queryKey: sessionQueryKeys.matches(sessionId),
    queryFn: () => matchesService.getSessionMatches(sessionId),
    enabled: Boolean(sessionId),
  })
}

export function useCreateMatchMutation(sessionId: string) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMatchData) =>
      matchesService.createMatch(sessionId, data),
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

  return useMutation({
    mutationFn: ({
      matchId,
      team1Score,
      team2Score,
    }: {
      matchId: string
      team1Score: number
      team2Score: number
    }) => matchesService.updateScores(matchId, team1Score, team2Score),
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
