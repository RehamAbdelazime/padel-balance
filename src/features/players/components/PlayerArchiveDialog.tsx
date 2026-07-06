import { useTranslation } from 'react-i18next'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog'
import { useArchivePlayerMutation } from '../hooks/usePlayers'
import type { Player } from '../types'

interface PlayerArchiveDialogProps {
  player: Player | null
  open: boolean
  onClose: () => void
}

/**
 * Confirmation dialog for the archive action.
 * Archiving is non-destructive: the player row is retained with archived = true.
 */
export function PlayerArchiveDialog({
  player,
  open,
  onClose,
}: PlayerArchiveDialogProps) {
  const { t } = useTranslation()
  const archiveMutation = useArchivePlayerMutation()

  const handleConfirm = () => {
    if (!player) return
    archiveMutation.mutate(player.id, { onSuccess: onClose })
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('players.archiveConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('players.archiveConfirm.description', {
              name: player?.name ?? '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveMutation.isPending}>
            {t('players.archiveConfirm.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={archiveMutation.isPending}
          >
            {t('players.archiveConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
