import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { usePlayersQuery, useCreatePlayerMutation } from '@/features/players/hooks/usePlayers'
import { useAddAttendanceMutation } from '../hooks/useAttendance'

type AddMode = 'EXISTING' | 'GUEST'

interface AddReplacementDialogProps {
  open:              boolean
  sessionId:         string
  attendeePlayerIds: readonly string[]
  onClose:           () => void
  /** Fired once the player exists and has joined this session's attendance — immediately available for replacement. */
  onAdded:           (playerId: string) => void
}

/**
 * Add Replacement (Sprint RT2 Section 7) — replaces the previous incomplete
 * flow entirely. Two modes:
 *   Existing Player — any non-archived player in the database not already
 *     attending this session.
 *   Guest Player — a brand-new temporary player, created on the spot via
 *     the same playersService.create the Players page itself uses (no new
 *     table/column — a guest is just a normal player row).
 * Either way, the result is added to this session's attendance immediately,
 * so they become a normal AVAILABLE attendee the moment this dialog closes.
 */
export function AddReplacementDialog({ open, sessionId, attendeePlayerIds, onClose, onAdded }: AddReplacementDialogProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<AddMode>('EXISTING')
  const [existingPlayerId, setExistingPlayerId] = useState('')
  const [guestName, setGuestName] = useState('')

  const playersQuery  = usePlayersQuery()
  const createPlayer  = useCreatePlayerMutation()
  const addAttendance = useAddAttendanceMutation(sessionId)

  const attendeeIdSet = new Set(attendeePlayerIds)
  const availablePlayers = (playersQuery.data ?? []).filter(p => !attendeeIdSet.has(p.id))
  const isPending = createPlayer.isPending || addAttendance.isPending

  function reset() {
    setMode('EXISTING')
    setExistingPlayerId('')
    setGuestName('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleConfirm() {
    if (mode === 'EXISTING') {
      if (!existingPlayerId) return
      await addAttendance.mutateAsync(existingPlayerId)
      const addedId = existingPlayerId
      reset()
      onAdded(addedId)
    } else {
      const name = guestName.trim()
      if (!name) return
      const player = await createPlayer.mutateAsync({ name })
      await addAttendance.mutateAsync(player.id)
      reset()
      onAdded(player.id)
    }
  }

  const canConfirm = mode === 'EXISTING' ? Boolean(existingPlayerId) : guestName.trim().length >= 2

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.runtime.addReplacementDialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{t('sessions.runtime.addReplacementDialog.mode')}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="add-replacement-mode"
                checked={mode === 'EXISTING'}
                onChange={() => setMode('EXISTING')}
              />
              {t('sessions.runtime.addReplacementDialog.existingPlayer')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="add-replacement-mode"
                checked={mode === 'GUEST'}
                onChange={() => setMode('GUEST')}
              />
              {t('sessions.runtime.addReplacementDialog.guestPlayer')}
            </label>
          </fieldset>

          {mode === 'EXISTING' ? (
            <div className="space-y-1.5">
              <Label htmlFor="existing-player">{t('sessions.runtime.addReplacementDialog.existingPlayer')}</Label>
              <select
                id="existing-player"
                value={existingPlayerId}
                onChange={e => setExistingPlayerId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>—</option>
                {availablePlayers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {availablePlayers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {t('sessions.runtime.addReplacementDialog.noExistingPlayers')}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="guest-name">{t('sessions.runtime.addReplacementDialog.guestName')}</Label>
              <Input
                id="guest-name"
                value={guestName}
                onChange={e => setGuestName(e.target.value)}
                placeholder={t('players.form.namePlaceholder')}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={!canConfirm || isPending}>
            {t('sessions.runtime.addReplacementDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
