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
import { groupMatchesIntoRounds, deriveRoundStatus } from '../utils'
import type { SessionAttendee, PlayerRuntimeState, PlannedMatch } from '../types'

export type ReplaceMode = 'THIS_ROUND' | 'REMAINING_SESSION'

interface Props {
  /** The attendee being replaced, or null when the dialog is closed. */
  outgoing:     SessionAttendee | null
  attendees:    SessionAttendee[]
  playerStates: ReadonlyMap<string, PlayerRuntimeState>
  matches:      readonly PlannedMatch[]
  courtCount:   number
  open:         boolean
  onClose:      () => void
  /** `matchId` is present only for THIS_ROUND (identifies which single match to swap within). */
  onConfirm:    (mode: ReplaceMode, oldPlayerId: string, newPlayerId: string, matchId?: string) => void
}

/** Organiser picks a replacement attendee and whether the swap applies to just the current round or the rest of the session. */
export function ReplacePlayerDialog({
  outgoing, attendees, playerStates, matches, courtCount, open, onClose, onConfirm,
}: Props) {
  const { t } = useTranslation()
  const [replacementId, setReplacementId] = useState('')
  const [mode, setMode] = useState<ReplaceMode>('REMAINING_SESSION')

  useEffect(() => {
    if (open) {
      setReplacementId('')
      setMode('REMAINING_SESSION')
    }
  }, [open, outgoing?.player_id])

  if (!outgoing) return null

  // The match in the current LIVE (or, failing that, next PENDING) round that
  // contains the outgoing player — This Round Only swaps within it directly.
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  const currentRound =
    rounds.find(r => deriveRoundStatus(r) === 'LIVE') ?? rounds.find(r => deriveRoundStatus(r) === 'PENDING')
  const currentRoundMatch = currentRound?.slots.find(
    s => s.match.teamA.includes(outgoing.player_id) || s.match.teamB.includes(outgoing.player_id),
  )?.match
  const thisRoundAvailable = currentRoundMatch !== undefined

  // Valid replacement candidates (Sprint RT2 Section 6/13): attending this
  // session, currently AVAILABLE (not resting/absent/left/replaced), and not
  // already occupying a court in the current round — the previous filter
  // here was inverted (it excluded AVAILABLE players and included
  // ABSENT/LEFT/REPLACED ones) and never checked round occupancy at all.
  const currentRoundPlayerIds = new Set(
    currentRound?.slots.flatMap(s => [...s.match.teamA, ...s.match.teamB]) ?? [],
  )
  const candidates = attendees.filter(a => {
    if (a.player_id === outgoing.player_id) return false
    const status = playerStates.get(a.player_id)?.status ?? 'AVAILABLE'
    if (status !== 'AVAILABLE') return false
    if (currentRoundPlayerIds.has(a.player_id)) return false
    return true
  })

  const handleConfirm = () => {
    if (!replacementId) return
    if (mode === 'THIS_ROUND') {
      if (!currentRoundMatch) return
      onConfirm('THIS_ROUND', outgoing.player_id, replacementId, currentRoundMatch.id)
    } else {
      onConfirm('REMAINING_SESSION', outgoing.player_id, replacementId)
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {t('sessions.runtime.replaceDialog.title', { name: outgoing.players.name })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="replacement-player">{t('sessions.runtime.replaceDialog.label')}</Label>
            <select
              id="replacement-player"
              value={replacementId}
              onChange={e => setReplacementId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>—</option>
              {candidates.map(a => (
                <option key={a.player_id} value={a.player_id}>{a.players.name}</option>
              ))}
            </select>
            {candidates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t('sessions.runtime.replaceDialog.noCandidates')}
              </p>
            )}
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium">{t('sessions.runtime.replaceDialog.scopeLabel')}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="replace-scope"
                checked={mode === 'THIS_ROUND'}
                disabled={!thisRoundAvailable}
                onChange={() => setMode('THIS_ROUND')}
              />
              {t('sessions.runtime.replaceDialog.thisRoundOnly')}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="replace-scope"
                checked={mode === 'REMAINING_SESSION'}
                onChange={() => setMode('REMAINING_SESSION')}
              />
              {t('sessions.runtime.replaceDialog.remainingSession')}
            </label>
          </fieldset>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!replacementId}>
            {t('sessions.runtime.replaceDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
