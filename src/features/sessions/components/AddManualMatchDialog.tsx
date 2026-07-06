import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import type { SessionAttendee } from '../types'

interface Props {
  attendees: SessionAttendee[]
  open:      boolean
  onClose:   () => void
  onSubmit:  (teamA: readonly [string, string], teamB: readonly [string, string]) => void
}

/**
 * Adds a MANUAL match directly to the in-progress schedule (via
 * scheduleService.addManualMatch) — distinct from MatchFormDialog, which
 * records a completed match result with scores.
 */
export function AddManualMatchDialog({ attendees, open, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const handleClose = () => {
    setSelectedIds([])
    onClose()
  }

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(playerId)) return prev.filter(id => id !== playerId)
      if (prev.length >= 4) return prev
      return [...prev, playerId]
    })
  }

  const isReady = selectedIds.length === 4

  const handleConfirm = () => {
    if (!isReady) return
    const [a1, a2, b1, b2] = selectedIds as [string, string, string, string]
    onSubmit([a1, a2], [b1, b2])
    handleClose()
  }

  const nameById = (id: string) => attendees.find(a => a.player_id === id)?.players.name ?? id

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.schedule.addMatch.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {attendees.map(attendee => {
              const idx        = selectedIds.indexOf(attendee.player_id)
              const isSelected = idx !== -1
              const isTeamA    = isSelected && idx < 2
              const isTeamB    = isSelected && idx >= 2
              const isDisabled = !isSelected && isReady

              return (
                <button
                  key={attendee.player_id}
                  type="button"
                  onClick={() => togglePlayer(attendee.player_id)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                    isTeamA && 'border-primary bg-primary/10 text-primary',
                    isTeamB && 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                    !isSelected && !isDisabled && 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                    isDisabled && 'cursor-not-allowed border-input opacity-40',
                  )}
                >
                  <span className="max-w-[120px] truncate">{attendee.players.name}</span>
                </button>
              )
            })}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('sessions.schedule.addMatch.teamA')}
              </p>
              <p className="min-h-[2.5rem] text-sm leading-snug">
                {selectedIds[0] ? nameById(selectedIds[0]) : '—'}
                {selectedIds[1] ? ` & ${nameById(selectedIds[1])}` : ''}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('sessions.schedule.addMatch.teamB')}
              </p>
              <p className="min-h-[2.5rem] text-sm leading-snug">
                {selectedIds[2] ? nameById(selectedIds[2]) : '—'}
                {selectedIds[3] ? ` & ${nameById(selectedIds[3])}` : ''}
              </p>
            </div>
          </div>

          {!isReady && selectedIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('sessions.schedule.addMatch.validationError')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!isReady}>
            {t('sessions.schedule.addMatch.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
