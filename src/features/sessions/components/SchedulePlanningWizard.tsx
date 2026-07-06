import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { getFormatsWithRecommendations } from '../formats'
import type { FormatWithRecommendation } from '../formats'
import { plannerService } from '../planner'
import type { TournamentPlan } from '../planner'

// ── Wizard step model ──────────────────────────────────────────────────────────

type WizardStep = 'format' | 'configure' | 'preview'

const STEP_ORDER: ReadonlyArray<WizardStep> = ['format', 'configure', 'preview']

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  open:              boolean
  onClose:           () => void
  /** Confirmed by the organiser on the preview step — triggers schedule generation. */
  onBuildSchedule:   (plan: TournamentPlan) => void
  isPending:         boolean
  playerCount:       number
  courtCount?:       number
  /** Session's configured Court Booking Duration (minutes) — single source of truth, set on the Session itself. */
  bookingDuration?:  number
}

export function SchedulePlanningWizard({
  open,
  onClose,
  onBuildSchedule,
  isPending,
  playerCount,
  courtCount = 1,
  bookingDuration,
}: Props) {
  const { t } = useTranslation()

  const formatsWithRec: ReadonlyArray<FormatWithRecommendation> =
    getFormatsWithRecommendations({ playerCount, courtCount })

  const [step, setStep] = useState<WizardStep>('format')
  const [plan, setPlan]  = useState<TournamentPlan>(() =>
    plannerService.createPlan({ playerCount, courtCount, reservationDurationMinutes: bookingDuration }),
  )

  const selectedFormat = formatsWithRec.find(r => r.format.id === plan.formatId)?.format

  // Reset the wizard to step 1 and start a fresh plan each time it opens.
  useEffect(() => {
    if (open) {
      setStep('format')
      const preselected =
        formatsWithRec.find(r => r.recommendation.fit !== 'not-recommended')?.format.id ??
        formatsWithRec[0]?.format.id ??
        null
      const freshPlan = plannerService.createPlan({ playerCount, courtCount, reservationDurationMinutes: bookingDuration })
      setPlan(preselected ? plannerService.updateFormat(freshPlan, preselected) : freshPlan)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleOpenChange(v: boolean) {
    if (!v && !isPending) onClose()
  }

  function selectFormat(id: string) {
    setPlan(prev => plannerService.updateFormat(prev, id))
  }

  function handleSettingChange(id: string, value: boolean | number | string) {
    setPlan(prev => plannerService.updateSettings(prev, { [id]: value }))
  }

  function handleBuildSchedule() {
    onBuildSchedule(plan)
  }

  const stepIndex = STEP_ORDER.indexOf(step) + 1

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'format'    && t('sessions.wizard.stepFormat',    { defaultValue: 'Choose Tournament Format' })}
            {step === 'configure' && t('sessions.wizard.stepConfigure', { defaultValue: 'Configure Format' })}
            {step === 'preview'   && t('sessions.wizard.stepPreview',   { defaultValue: 'Schedule Preview' })}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          {t('sessions.wizard.stepIndicator', { defaultValue: 'Step {{current}} of {{total}}', current: stepIndex, total: STEP_ORDER.length })}
        </p>

        {/* Step 1 — Choose Tournament Format, sorted by recommendation fit */}
        {step === 'format' && (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-1 pr-1">
            {formatsWithRec.map(({ format, recommendation }) => (
              <button
                key={format.id}
                type="button"
                onClick={() => selectFormat(format.id)}
                className={[
                  'flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-start',
                  format.id === plan.formatId ? 'border-primary' : 'border-border',
                ].join(' ')}
              >
                <span>
                  <span className="block text-sm font-medium">{format.name}</span>
                  <span className="block text-xs text-muted-foreground">{format.description}</span>
                </span>
                <Badge variant="outline">{recommendation.fit}</Badge>
              </button>
            ))}
          </div>
        )}

        {/* Step 2 — Configure the selected format */}
        {step === 'configure' && selectedFormat && (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-1 pr-1">
            {selectedFormat.settings.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {t('sessions.wizard.noSettings', { defaultValue: 'This format has no configurable settings.' })}
              </p>
            )}

            {selectedFormat.settings
              .filter(setting =>
                !setting.visibleWhen ||
                plan.settings[setting.visibleWhen.settingId] === setting.visibleWhen.value,
              )
              .map(setting => (
              <div key={setting.id} className="space-y-1.5">
                <Label htmlFor={setting.id}>{setting.label}</Label>
                <p className="text-xs text-muted-foreground">{setting.description}</p>

                {setting.type === 'boolean' && (
                  <input
                    id={setting.id}
                    type="checkbox"
                    checked={Boolean(plan.settings[setting.id] ?? setting.defaultValue)}
                    onChange={e => handleSettingChange(setting.id, e.target.checked)}
                  />
                )}

                {setting.type === 'number' && (
                  <Input
                    id={setting.id}
                    type="number"
                    value={Number(plan.settings[setting.id] ?? setting.defaultValue)}
                    min={setting.min}
                    max={setting.max}
                    onChange={e => handleSettingChange(setting.id, Number(e.target.value))}
                  />
                )}

                {setting.type === 'select' && (
                  <select
                    id={setting.id}
                    value={String(plan.settings[setting.id] ?? setting.defaultValue)}
                    onChange={e => handleSettingChange(setting.id, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {setting.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 3 — Schedule Preview. Everything below is read from TournamentPlan;
            no algorithm has run — these are planning estimates only. */}
        {step === 'preview' && selectedFormat && (
          <div className="space-y-2 py-1 text-sm">
            <p>{t('sessions.wizard.previewFormat', { defaultValue: 'Format: {{name}}', name: selectedFormat.name })}</p>
            <p>{t('sessions.wizard.previewPlayers', { defaultValue: 'Players: {{count}}', count: plan.playerCount })}</p>
            <p>{t('sessions.wizard.previewMatches', { defaultValue: 'Estimated matches: {{count}}', count: plan.estimatedMatches })}</p>
            <p>{t('sessions.wizard.previewRounds', { defaultValue: 'Estimated rounds: {{count}}', count: plan.estimatedRounds })}</p>
            <p>{t('sessions.wizard.previewCourts', { defaultValue: 'Courts: {{courts}}', courts: plan.courtCount })}</p>
            <p>
              {t('sessions.wizard.previewDuration', {
                defaultValue: 'Estimated duration: {{min}}–{{max}} min (reserved: {{reserved}} min)',
                min: plan.estimatedDuration.min,
                max: plan.estimatedDuration.max,
                reserved: plan.reservationDurationMinutes,
              })}
            </p>
            <p>
              {t('sessions.wizard.previewRest', {
                defaultValue: 'Estimated average rest per player: {{count}} matches',
                count: plan.estimatedAverageRest,
              })}
            </p>
            <p>
              {t('sessions.wizard.previewFairness', {
                defaultValue: 'Estimated fairness: {{fit}} ({{score}}) — {{reason}}',
                fit:    plan.recommendation?.fit,
                score:  plan.fairnessScoreEstimate,
                reason: plan.recommendation?.reason,
              })}
            </p>

            {plan.warnings.length > 0 && (
              <ul className="space-y-0.5">
                {plan.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-700 dark:text-yellow-400">⚠ {w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div>
            {step !== 'format' && (
              <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => setStep(step === 'preview' ? 'configure' : 'format')}
              >
                {t('common.back', { defaultValue: 'Back' })}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              {t('common.cancel')}
            </Button>

            {step === 'format' && (
              <Button disabled={!selectedFormat} onClick={() => setStep('configure')}>
                {t('common.next', { defaultValue: 'Next' })}
              </Button>
            )}

            {step === 'configure' && (
              <Button disabled={!selectedFormat} onClick={() => setStep('preview')}>
                {t('common.next', { defaultValue: 'Next' })}
              </Button>
            )}

            {step === 'preview' && (
              <Button disabled={isPending || !plan.readyToGenerate} onClick={handleBuildSchedule}>
                {isPending
                  ? t('sessions.generation.generating')
                  : t('sessions.wizard.buildSchedule', { defaultValue: 'Build Schedule' })}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
