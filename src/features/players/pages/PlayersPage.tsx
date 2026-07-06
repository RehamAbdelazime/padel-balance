import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { usePlayersQuery } from '../hooks/usePlayers'
import { PlayerCard } from '../components/PlayerCard'
import { PlayerEmptyState } from '../components/PlayerEmptyState'
import { PlayerFormDialog } from '../components/PlayerFormDialog'
import { PlayerArchiveDialog } from '../components/PlayerArchiveDialog'
import type { Player } from '../types'

/**
 * Players page.
 *
 * State machine (local state — too ephemeral for the global store):
 *   idle → formOpen (create) → idle
 *   idle → formOpen (edit, with player) → idle
 *   idle → archiveOpen (with player) → idle
 */
export function PlayersPage() {
  const { t } = useTranslation()
  const { data: players, isLoading, isError, refetch } = usePlayersQuery()

  const [formDialogPlayer, setFormDialogPlayer] = useState<Player | null>(null)
  const [isFormDialogOpen, setFormDialogOpen] = useState(false)
  const [archiveDialogPlayer, setArchiveDialogPlayer] = useState<Player | null>(null)
  const [isArchiveDialogOpen, setArchiveDialogOpen] = useState(false)

  const openCreateDialog = () => {
    setFormDialogPlayer(null)
    setFormDialogOpen(true)
  }

  const openEditDialog = (player: Player) => {
    setFormDialogPlayer(player)
    setFormDialogOpen(true)
  }

  const openArchiveDialog = (player: Player) => {
    setArchiveDialogPlayer(player)
    setArchiveDialogOpen(true)
  }

  const closeFormDialog = () => setFormDialogOpen(false)
  const closeArchiveDialog = () => setArchiveDialogOpen(false)

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('players.title')}
          </h1>
          <p className="text-muted-foreground">{t('players.subtitle')}</p>
        </div>

        {!isLoading && !isError && (
          <Button onClick={openCreateDialog}>
            <UserPlus className="me-2 h-4 w-4" aria-hidden="true" />
            {t('players.addPlayer')}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw
            className="h-6 w-6 animate-spin text-muted-foreground"
            aria-label={t('common.loading')}
          />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertCircle
            className="h-10 w-10 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">{t('common.error')}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
            {t('common.retry')}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && players?.length === 0 && (
        <PlayerEmptyState onAdd={openCreateDialog} />
      )}

      {/* Player grid */}
      {!isLoading && !isError && (players?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {players?.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={openEditDialog}
              onArchive={openArchiveDialog}
            />
          ))}
        </div>
      )}

      {/* Dialogs — rendered outside the grid so they are not clipped */}
      <PlayerFormDialog
        player={formDialogPlayer}
        open={isFormDialogOpen}
        onClose={closeFormDialog}
      />
      <PlayerArchiveDialog
        player={archiveDialogPlayer}
        open={isArchiveDialogOpen}
        onClose={closeArchiveDialog}
      />
    </>
  )
}
