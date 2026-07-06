import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { playersService } from '../services/players.service'
import { ratingService } from '@/features/rating'
import { friendlyPlayerErrorMessage } from '../utils/player-errors'
import type { CreatePlayerInput, UpdatePlayerInput } from '../types'
import type { RatingState } from '@/features/rating'

// ── Query key factory ─────────────────────────────────────────────────────────

export const playerQueryKeys = {
  /** ['players'] — invalidates every player query */
  all: () => ['players'] as const,
  /** ['players', id] — scoped to one player */
  detail: (id: string) => ['players', id] as const,
  /** ['players', id, 'rating'] — scoped to one player's rating */
  rating: (id: string) => ['players', id, 'rating'] as const,
  /** ['players', 'archivedCount'] — Dashboard's Players Overview only */
  archivedCount: () => ['players', 'archivedCount'] as const,
} as const

// ── Read hooks ────────────────────────────────────────────────────────────────

/** Returns all non-archived players, ordered by name. */
export function usePlayersQuery() {
  return useQuery({
    queryKey: playerQueryKeys.all(),
    queryFn: playersService.getAll,
  })
}

/** Returns a single player by ID (includes archived). */
export function usePlayerQuery(id: string) {
  return useQuery({
    queryKey: playerQueryKeys.detail(id),
    queryFn: () => playersService.getById(id),
    enabled: Boolean(id),
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
  return useQuery({
    queryKey: playerQueryKeys.rating(playerId),
    queryFn: (): RatingState => ratingService.getPlayerRating(playerId),
    enabled: Boolean(playerId),
  })
}

/** Count of archived players — Dashboard's Players Overview only (avoids fetching full archived rows). */
export function useArchivedPlayerCountQuery() {
  return useQuery({
    queryKey: playerQueryKeys.archivedCount(),
    queryFn: playersService.getArchivedCount,
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

  return useMutation({
    mutationFn: (input: CreatePlayerInput) => playersService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.all() })
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

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePlayerInput }) =>
      playersService.update(id, input),
    onSuccess: async (_data, { id }) => {
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.all() })
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.detail(id) })
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

  return useMutation({
    mutationFn: (id: string) => playersService.archive(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.all() })
      await queryClient.invalidateQueries({ queryKey: playerQueryKeys.archivedCount() })
      toast.success(t('players.toasts.archived'))
    },
    onError: (error: Error) => {
      toast.error(friendlyPlayerErrorMessage(error.message, 'Player could not be archived.'))
    },
  })
}
