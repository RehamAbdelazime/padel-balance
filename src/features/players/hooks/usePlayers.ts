import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { playersService } from '../services/players.service'
import { ratingService } from '@/features/rating'
import { friendlyPlayerErrorMessage } from '../utils/player-errors'
import { useCurrentGroupStore } from '@/app/store/current-group.store'
import type { CreatePlayerInput, UpdatePlayerInput } from '../types'
import type { RatingState } from '@/features/rating'

// ── Query key factory ─────────────────────────────────────────────────────────

export const playerQueryKeys = {
  /** ['players', groupId] — invalidates every player query for a group */
  all: (groupId: string | null) => ['players', groupId] as const,
  /** ['players', groupId, id] — scoped to one player */
  detail: (groupId: string | null, id: string) => ['players', groupId, id] as const,
  /** ['players', groupId, id, 'rating'] — scoped to one player's rating */
  rating: (groupId: string | null, id: string) => ['players', groupId, id, 'rating'] as const,
  /** ['players', groupId, 'archivedCount'] — Dashboard's Players Overview only */
  archivedCount: (groupId: string | null) => ['players', groupId, 'archivedCount'] as const,
} as const

const NO_CURRENT_GROUP_ERROR = 'No current group selected'

// ── Read hooks ────────────────────────────────────────────────────────────────

/** Returns all non-archived players, ordered by name, for the current group. */
export function usePlayersQuery() {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: playerQueryKeys.all(currentGroupId),
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return playersService.getAll(currentGroupId)
    },
    enabled: Boolean(currentGroupId),
  })
}

/** Returns a single player by ID (includes archived) within the current group. */
export function usePlayerQuery(id: string) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: playerQueryKeys.detail(currentGroupId, id),
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return playersService.getById(currentGroupId, id)
    },
    enabled: Boolean(currentGroupId) && Boolean(id),
  })
}

/**
 * Returns the RatingState for a single player from the current service snapshot.
 *
 * This hook reads only — it never triggers a rebuild. The value reflects
 * the last completed ratingService.rebuildRatings() call.
 *
 * Rebuild is the responsibility of controlled entry points:
 *   - application bootstrap
 *   - successful match creation
 *   - explicit manual refresh
 *
 * Cross-feature dependency: this hook imports from the rating feature.
 * The dependency is intentional and one-directional (players → rating).
 * The rating feature has no knowledge of the players feature.
 */
export function usePlayerRatingQuery(playerId: string) {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: playerQueryKeys.rating(currentGroupId, playerId),
    queryFn: (): RatingState => ratingService.getPlayerRating(playerId),
    enabled: Boolean(currentGroupId) && Boolean(playerId),
  })
}

/** Count of archived players in the current group — Dashboard's Players Overview only. */
export function useArchivedPlayerCountQuery() {
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useQuery({
    queryKey: playerQueryKeys.archivedCount(currentGroupId),
    queryFn: () => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return playersService.getArchivedCount(currentGroupId)
    },
    enabled: Boolean(currentGroupId),
  })
}

// ── Mutation hooks ────────────────────────────────────────────────────────────

/**
 * Creates a player.
 * Pass `onSuccess` to `mutate()` to close the calling dialog on success.
 */
export function useCreatePlayerMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: (input: CreatePlayerInput) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return playersService.create(currentGroupId, input)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.all(currentGroupId) })
      toast.success(t('players.toasts.created'))
    },
    onError: (error: Error) => {
      toast.error(friendlyPlayerErrorMessage(error.message, 'Player could not be created.'))
    },
  })
}

/** Updates name and phone for an existing player. */
export function useUpdatePlayerMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlayerInput }) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return playersService.update(currentGroupId, id, input)
    },
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.all(currentGroupId) })
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.detail(currentGroupId, id) })
      toast.success(t('players.toasts.updated'))
    },
    onError: (error: Error) => {
      toast.error(friendlyPlayerErrorMessage(error.message, 'Player could not be updated.'))
    },
  })
}

/**
 * Archives a player (sets archived = true).
 * The player row is preserved — no hard delete is performed.
 */
export function useArchivePlayerMutation() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const currentGroupId = useCurrentGroupStore((store) => store.currentGroupId)

  return useMutation({
    mutationFn: (id: string) => {
      if (!currentGroupId) {
        return Promise.reject(new Error(NO_CURRENT_GROUP_ERROR))
      }
      return playersService.archive(currentGroupId, id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.all(currentGroupId) })
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.archivedCount(currentGroupId) })
      toast.success(t('players.toasts.archived'))
    },
    onError: (error: Error) => {
      toast.error(friendlyPlayerErrorMessage(error.message, 'Player could not be archived.'))
    },
  })
}
