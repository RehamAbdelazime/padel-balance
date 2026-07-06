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
  recovery:           RuntimeRecovery | null
  attendees:          SessionAttendee[]
  /** Whether any valid replacement candidate currently exists for recovery.playerId (see utils/replacement-candidates.ts) — "Replace Player" is hidden entirely when false. */
  canReplace:         boolean
  onUndo:             () => void
  onOpenReplace:      (playerId: string) => void
  onOpenAddGuest:     (playerId: string) => void
  onFinishSession:    () => void
  onDismiss:          () => void
}

/**
 * Shown instead of a toast whenever a runtime player-management action
 * (rest/leave/absent/replace) can't regenerate the remaining rounds because
 * too few players are AVAILABLE. The organiser's action already took effect
 * (player states are always applied) and no round was destroyed — this is
 * strictly about getting generation unstuck, never a crash.
 *
 * Sprint RT2 Section 10/11: "Reduce Courts" is removed entirely — changing
 * a session's court count is session management, not a runtime recovery
 * action. Every remaining action is only rendered when it's actually
 * valid: "Replace Player" only appears if a real candidate exists;
 * "Add Guest Player" and "Finish Session" are always valid, so they always
 * show; "Undo" always shows (there is always a previous state to restore).
 */
export function RuntimeRecoveryDialog({
  recovery,
  attendees,
  canReplace,
  onUndo,
  onOpenReplace,
  onOpenAddGuest,
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
          {canReplace && (
            <Button type="button" variant="outline" onClick={() => onOpenReplace(recovery.playerId)}>
              {t('sessions.runtime.recovery.replacePlayer')}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenAddGuest(recovery.playerId)}>
            {t('sessions.runtime.recovery.addGuestPlayer')}
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
