import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import type { RuntimeRecovery } from '../hooks/useSchedule'
import type { SessionAttendee } from '../types'

interface Props {
  recovery:        RuntimeRecovery | null
  attendees:       SessionAttendee[]
  onUndo:          () => void
  onOpenReplace:   (playerId: string) => void
  onReduceCourts:  () => void
  onFinishSession: () => void
  onDismiss:       () => void
}

/**
 * Shown instead of a toast whenever a runtime player-management action
 * (rest/leave/absent/replace) can't regenerate the remaining rounds because
 * too few players are AVAILABLE. The organiser's action already took effect
 * (player states are always applied) and no round was destroyed — this is
 * strictly about getting generation unstuck, never a crash.
 */
export function RuntimeRecoveryDialog({
  recovery,
  attendees,
  onUndo,
  onOpenReplace,
  onReduceCourts,
  onFinishSession,
  onDismiss,
}: Props) {
  const { t } = useTranslation()
  if (!recovery) return null

  const playerName = attendees.find(a => a.player_id === recovery.playerId)?.players.name ?? recovery.playerId

  return (
    <Dialog open onOpenChange={v => !v && onDismiss()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.runtime.recovery.title')}</DialogTitle>
          <DialogDescription>{t('sessions.runtime.recovery.message')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" onClick={onUndo}>
            {t('sessions.runtime.recovery.undo', { name: playerName })}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenReplace(recovery.playerId)}>
            {t('sessions.runtime.recovery.addReplacement')}
          </Button>
          <Button type="button" variant="outline" onClick={onReduceCourts}>
            {t('sessions.runtime.recovery.reduceCourts')}
          </Button>
          <Button type="button" variant="destructive" onClick={onFinishSession}>
            {t('sessions.runtime.recovery.finishSession')}
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onDismiss}>
            {t('common.cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
