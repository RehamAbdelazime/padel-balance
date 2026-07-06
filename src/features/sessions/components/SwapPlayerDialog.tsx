import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import type { PlannedMatch, SessionAttendee } from '../types'

interface Props {
  match:      PlannedMatch | null
  attendees:  SessionAttendee[]
  open:       boolean
  onClose:    () => void
  onSwap:     (matchId: string, fromPlayerId: string, toPlayerId: string) => void
}

export function SwapPlayerDialog({ match, attendees, open, onClose, onSwap }: Props) {
  const { t } = useTranslation()

  const inMatch = match ? [...match.teamA, ...match.teamB] : []
  const [fromId, setFromId] = useState<string>('')
  const [toId,   setToId]   = useState<string>('')

  // Reset selection whenever a different match is opened.
  useEffect(() => {
    if (open && match) {
      setFromId(inMatch[0] ?? '')
      setToId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, match?.id])

  if (!match) return null

  const nameById = (id: string) => attendees.find(a => a.player_id === id)?.players.name ?? id
  const substitutes = attendees.filter(a => !inMatch.includes(a.player_id))

  const handleConfirm = () => {
    if (!fromId || !toId) return
    onSwap(match.id, fromId, toId)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.schedule.swap.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="swap-from">{t('sessions.schedule.swap.remove')}</Label>
            <select
              id="swap-from"
              value={fromId}
              onChange={e => setFromId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {inMatch.map(id => (
                <option key={id} value={id}>{nameById(id)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="swap-to">{t('sessions.schedule.swap.replaceWith')}</Label>
            <select
              id="swap-to"
              value={toId}
              onChange={e => setToId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>—</option>
              {substitutes.map(a => (
                <option key={a.player_id} value={a.player_id}>{a.players.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!fromId || !toId}>
            {t('sessions.schedule.swap.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
