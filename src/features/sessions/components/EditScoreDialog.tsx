import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
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
import { editScoreSchema, type EditScoreValues } from '../schemas'
import { useUpdateMatchScoresMutation } from '../hooks/useMatches'
import type { MatchWithTeams } from '../types'

interface EditScoreDialogProps {
  match: MatchWithTeams | null
  open: boolean
  onClose: () => void
}

/**
 * Allows the organizer to correct match scores after the fact.
 * Team composition is read-only — only the two score fields are editable.
 */
export function EditScoreDialog({ match, open, onClose }: EditScoreDialogProps) {
  const { t } = useTranslation()

  const updateMutation = useUpdateMatchScoresMutation(match?.session_id ?? '')

  const form = useForm<EditScoreValues, unknown, EditScoreValues>({
    resolver: zodResolver(editScoreSchema),
    defaultValues: { team1_score: 0, team2_score: 0 },
  })

  /** Pre-fill with current scores whenever the dialog opens. */
  useEffect(() => {
    if (!open || !match) return
    form.reset({
      team1_score: match.match_teams[0]?.score ?? 0,
      team2_score: match.match_teams[1]?.score ?? 0,
    })
  }, [open, match, form])

  const handleSubmit = form.handleSubmit((values) => {
    if (!match) return
    updateMutation.mutate(
      {
        matchId: match.id,
        team1Score: values.team1_score,
        team2Score: values.team2_score,
      },
      { onSuccess: onClose },
    )
  })

  const getTeamNames = (team: MatchWithTeams['match_teams'][number]): string =>
    team.match_team_players.map((p) => p.players.name).join(' & ')

  const team1 = match?.match_teams[0]
  const team2 = match?.match_teams[1]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('matches.editScoreTitle')}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('matches.team', { number: 1 })}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {team1 ? getTeamNames(team1) : '—'}
                </p>
                <FormField
                  control={form.control}
                  name="team1_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">{t('matches.form.score')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
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
              </div>

              {/* Team 2 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('matches.team', { number: 2 })}
                </p>
                <p className="text-sm font-medium text-foreground">
                  {team2 ? getTeamNames(team2) : '—'}
                </p>
                <FormField
                  control={form.control}
                  name="team2_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">{t('matches.form.score')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
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
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateMutation.isPending}
              >
                {t('matches.form.cancel')}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t('matches.form.saving') : t('matches.editScore')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
