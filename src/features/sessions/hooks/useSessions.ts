import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { sessionsService } from '../services/sessions.service'
import { friendlySessionErrorMessage } from '../utils'
import type { CreateSessionInput, UpdateSessionInput } from '../types'

// ── Query key factory ─────────────────────────────────────────────────────────

export const sessionQueryKeys = {
  all: ()                => ['sessions']                              as const,
  detail: (id: string)  => ['sessions', id]                          as const,
  attendance: (id: string) => ['sessions', id, 'attendance']         as const,
  matches: (id: string)    => ['sessions', id, 'matches']            as const,
} as const

// ── Read hooks ────────────────────────────────────────────────────────────────

/** Returns all non-archived sessions, ordered by scheduled_at desc. */
export function useSessionsQuery() {
  return useQuery({
    queryKey: sessionQueryKeys.all(),
    queryFn: sessionsService.getAll,
  })
}

/** Returns a single session by ID (includes archived). */
export function useSessionQuery(id: string) {
  return useQuery({
    queryKey: sessionQueryKeys.detail(id),
    queryFn: () => sessionsService.getById(id),
    enabled: Boolean(id),
  })
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

export function useCreateSessionMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSessionInput) => sessionsService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all() })
      toast.success(t('sessions.toasts.created'))
    },
    onError: (error: Error) =>
      toast.error(friendlySessionErrorMessage(error.message, 'Session could not be created.')),
  })
}

export function useUpdateSessionMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSessionInput }) =>
      sessionsService.update(id, input),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all() })
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.detail(id) })
      toast.success(t('sessions.toasts.updated'))
    },
    onError: (error: Error) =>
      toast.error(friendlySessionErrorMessage(error.message, 'Session could not be updated.')),
  })
}

export function useArchiveSessionMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sessionsService.archive(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all() })
      toast.success(t('sessions.toasts.archived'))
    },
    onError: (error: Error) =>
      toast.error(friendlySessionErrorMessage(error.message, 'Session could not be archived.')),
  })
}

// ── Lifecycle mutations (Sprint F22) ─────────────────────────────────────────

function invalidateSession(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: sessionQueryKeys.all() }),
    queryClient.invalidateQueries({ queryKey: sessionQueryKeys.detail(id) }),
  ])
}

export function useStartSessionMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sessionsService.startSession(id),
    onSuccess: async (_data, id) => {
      await invalidateSession(queryClient, id)
      toast.success(t('sessions.lifecycle.toasts.started'))
    },
    onError: (error: Error) =>
      toast.error(friendlySessionErrorMessage(error.message, 'Unable to start session.')),
  })
}

export function useFinishSessionMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sessionsService.finishSession(id),
    onSuccess: async (_data, id) => {
      await invalidateSession(queryClient, id)
      toast.success(t('sessions.lifecycle.toasts.finished'))
    },
    onError: (error: Error) =>
      toast.error(friendlySessionErrorMessage(error.message, 'Unable to finish session.')),
  })
}

export function usePostponeSessionMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { scheduled_at: string } }) =>
      sessionsService.postpone(id, input),
    onSuccess: async (_data, { id }) => {
      await invalidateSession(queryClient, id)
      toast.success(t('sessions.lifecycle.toasts.postponed'))
    },
    onError: (error: Error) =>
      toast.error(friendlySessionErrorMessage(error.message, 'Unable to postpone session.')),
  })
}
