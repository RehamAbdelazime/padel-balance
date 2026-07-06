import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Separator } from '@/shared/components/ui/separator'
import { matchFormSchema, type MatchFormValues } from '../schemas'
import { useCreateMatchMutation } from '../hooks/useMatches'
import type { SessionAttendee } from '../types'

interface MatchFormDialogProps {
  sessionId: string
  attendees: SessionAttendee[]
  open: boolean
  onClose: () => void
  /**
   * When provided (rematch), pre-selects these four player IDs on open.
   * Order: [team1_p1, team1_p2, team2_p1, team2_p2]
   */
  prefillPlayerIds?: string[]
}

/**
 * NaN is a valid TypeScript `number` that renders as an empty input and
 * fails z.number() validation — used as the "not yet entered" sentinel for
 * score fields. No casting is required anywhere.
 */
const EMPTY_DEFAULTS: MatchFormValues = {
  team1_player1_id: '',
  team1_player2_id: '',
  team1_score: NaN,
  team2_player1_id: '',
  team2_player2_id: '',
  team2_score: NaN,
}

export function MatchFormDialog({
  sessionId,
  attendees,
  open,
  onClose,
  prefillPlayerIds,
}: MatchFormDialogProps) {
  const { t } = useTranslation()
  const createMutation = useCreateMatchMutation(sessionId)

  /**
   * Ordered selection: positions 0–1 → Team 1, positions 2–3 → Team 2.
   * Chip state is kept here; values sync to form fields via setValue so Zod
   * can validate them on submit.
   */
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const form = useForm<MatchFormValues, unknown, MatchFormValues>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  /** Name lookup — avoids repeated .find() on every render. */
  const nameById = useMemo(
    () => Object.fromEntries(attendees.map((a) => [a.player_id, a.players.name])),
    [attendees],
  )

  const syncPlayersToForm = (ids: string[]) => {
    form.setValue('team1_player1_id', ids[0] ?? '')
    form.setValue('team1_player2_id', ids[1] ?? '')
    form.setValue('team2_player1_id', ids[2] ?? '')
    form.setValue('team2_player2_id', ids[3] ?? '')
  }

  /**
   * On open:
   * - Rematch (prefillPlayerIds provided) → apply those player IDs.
   * - Normal open → leave selectedIds as-is so the previous match's selection
   *   persists for rapid consecutive entry.
   */
  useEffect(() => {
    if (!open) return
    if (prefillPlayerIds && prefillPlayerIds.length === 4) {
      setSelectedIds(prefillPlayerIds)
      syncPlayersToForm(prefillPlayerIds)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillPlayerIds])

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : prev.length >= 4
          ? prev
          : [...prev, playerId]
      syncPlayersToForm(next)
      return next
    })
  }

  /** Full reset — Cancel only. After success the dialog stays open. */
  const handleClose = () => {
    setSelectedIds([])
    form.reset(EMPTY_DEFAULTS)
    onClose()
  }

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate(
      {
        team1PlayerIds: [values.team1_player1_id, values.team1_player2_id],
        team1Score: values.team1_score,
        team2PlayerIds: [values.team2_player1_id, values.team2_player2_id],
        team2Score: values.team2_score,
      },
      {
        onSuccess: () => {
          // Keep players selected; reset scores to NaN so inputs show blank
          // and the organizer can immediately enter the next match's scores.
          form.setValue('team1_score', NaN)
          form.setValue('team2_score', NaN)
        },
      },
    )
  })

  const isReady = selectedIds.length === 4

  const renderScoreField = (name: 'team1_score' | 'team2_score') => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{t('matches.form.score')}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              placeholder={t('matches.form.scorePlaceholder')}
              disabled={!isReady}
              {...field}
              // NaN renders as empty; a valid number renders as its value.
              value={Number.isNaN(field.value) ? '' : field.value}
              onChange={(e) =>
                field.onChange(
                  Number.isNaN(e.target.valueAsNumber)
                    ? NaN
                    : e.target.valueAsNumber,
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('sessions.detail.recordMatch')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Selection status ─────────────────────────────────── */}
            <p
              className={cn(
                'text-sm',
                isReady ? 'font-medium text-primary' : 'text-muted-foreground',
              )}
            >
              {isReady
                ? t('matches.form.teamsReady')
                : t('matches.form.playersSelected', { count: selectedIds.length })}
            </p>

            {/* ── Player chip grid ──────────────────────────────────── */}
            <div className="flex flex-wrap gap-2">
              {attendees.map((attendee) => {
                const idx = selectedIds.indexOf(attendee.player_id)
                const isSelected = idx !== -1
                const isTeam1 = isSelected && idx < 2
                const isTeam2 = isSelected && idx >= 2
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
                      isTeam1 && 'border-primary bg-primary/10 text-primary',
                      isTeam2 &&
                        'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400',
                      !isSelected &&
                        !isDisabled &&
                        'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                      isDisabled && 'cursor-not-allowed border-input opacity-40',
                    )}
                  >
                    {isTeam1 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
                        1
                      </span>
                    )}
                    {isTeam2 && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold leading-none text-white">
                        2
                      </span>
                    )}
                    <span className="max-w-[120px] truncate">
                      {attendee.players.name}
                    </span>
                  </button>
                )
              })}
            </div>

            <Separator />

            {/* ── Teams summary + score inputs ──────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('matches.form.team1')}
                </p>
                <p className="min-h-[2.5rem] text-sm leading-snug">
                  {selectedIds[0] ? nameById[selectedIds[0]] : '—'}
                  {selectedIds[1] ? ` & ${nameById[selectedIds[1]]}` : ''}
                </p>
                {renderScoreField('team1_score')}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('matches.form.team2')}
                </p>
                <p className="min-h-[2.5rem] text-sm leading-snug">
                  {selectedIds[2] ? nameById[selectedIds[2]] : '—'}
                  {selectedIds[3] ? ` & ${nameById[selectedIds[3]]}` : ''}
                </p>
                {renderScoreField('team2_score')}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                {t('matches.form.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !isReady}
              >
                {createMutation.isPending
                  ? t('matches.form.saving')
                  : t('matches.form.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
