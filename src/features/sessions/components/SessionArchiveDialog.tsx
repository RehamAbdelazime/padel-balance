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
import { useArchiveSessionMutation } from '../hooks/useSessions'
import type { Session } from '../types'

interface SessionArchiveDialogProps {
  session: Session | null
  open: boolean
  onClose: () => void
}

export function SessionArchiveDialog({
  session,
  open,
  onClose,
}: SessionArchiveDialogProps) {
  const { t } = useTranslation()
  const archiveMutation = useArchiveSessionMutation()

  const handleConfirm = () => {
    if (!session) return
    archiveMutation.mutate(session.id, { onSuccess: onClose })
  }

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('sessions.archiveConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('sessions.archiveConfirm.description', {
              name: session?.name ?? '',
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={archiveMutation.isPending}>
            {t('sessions.archiveConfirm.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={archiveMutation.isPending}
          >
            {t('sessions.archiveConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
