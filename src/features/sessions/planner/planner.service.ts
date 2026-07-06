/**
 * Tournament Planner — service.
 *
 * Builds and updates a TournamentPlan. Every function here only computes
 * planning metadata (recommendation, estimates, warnings, readiness).
 * NONE of these functions generate a match, run the balanced-team
 * generator, or execute any tournament algorithm — that remains the
 * responsibility of the (future) Schedule Generator, which will consume
 * a finished TournamentPlan.
 */

import { getFormat, getFormatsWithRecommendations } from '../formats'
import type { TournamentFormat, FormatRecommendation } from '../formats'
import type { TournamentPlan, PlannerSettingValues } from './planner.types'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default court reservation window offered when a plan is first created. */
const DEFAULT_RESERVATION_MINUTES = 90

/** Setting ids that represent "how many matches/rounds" across the built-in formats. */
const MATCH_COUNT_SETTING_IDS: ReadonlyArray<string> = [
  'number-of-rounds',    // Americano
  'number-of-rotations', // Mexicano
  'match-count',         // Custom
]

// ── Internal helpers — pure metadata only, no algorithms ─────────────────────

function initSettingValues(format: TournamentFormat): PlannerSettingValues {
  const out: Record<string, boolean | number | string> = {}
  for (const s of format.settings) out[s.id] = s.defaultValue
  return out
}

/**
 * Reads the organiser-configured match count from settings when present,
 * otherwise falls back to the format's declared default. A plain lookup —
 * not a scheduling decision.
 */
function deriveMatchCount(format: TournamentFormat, settings: PlannerSettingValues): number {
  for (const id of MATCH_COUNT_SETTING_IDS) {
    const value = settings[id]
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  }
  return format.defaultMatchCount
}

function recommendationFor(
  format: TournamentFormat,
  playerCount: number,
  courtCount: number,
): FormatRecommendation {
  const [entry] = getFormatsWithRecommendations({ playerCount, courtCount })
    .filter(r => r.format.id === format.id)
  // getFormatsWithRecommendations always returns one entry per registered format.
  return entry!.recommendation
}

/**
 * Scales the format's declared duration range to the estimated match count.
 * Placeholder arithmetic — the real duration depends on how matches play out.
 */
function estimateDuration(
  format: TournamentFormat,
  estimatedMatches: number,
): { min: number; max: number } {
  const ratio = estimatedMatches / format.defaultMatchCount
  return {
    min: Math.round(format.estimatedDuration.min * ratio),
    max: Math.round(format.estimatedDuration.max * ratio),
  }
}

/**
 * Rough average number of rounds a player sits out, given how many players
 * can be on court at once (4 per court). A sizing heuristic for the preview
 * only — not the fair-rotation logic the real generator will use.
 */
function estimateAverageRest(
  playerCount: number,
  courtCount: number,
  estimatedRounds: number,
): number {
  if (playerCount <= 0 || estimatedRounds <= 0) return 0
  const playingSlots  = courtCount * 4
  const restingPerRound = Math.max(0, playerCount - playingSlots)
  return Math.round((restingPerRound * estimatedRounds) / playerCount * 10) / 10
}

function settingsValidationWarnings(
  format: TournamentFormat,
  settings: PlannerSettingValues,
): string[] {
  const warnings: string[] = []
  for (const s of format.settings) {
    const v = settings[s.id]
    if (s.required && (v === '' || v === undefined || v === null)) {
      warnings.push(`${s.label} is required.`)
      continue
    }
    if (s.type === 'number') {
      const n = Number(v)
      if (Number.isNaN(n)) { warnings.push(`${s.label} must be a valid number.`); continue }
      if (s.min !== undefined && n < s.min) { warnings.push(`${s.label} must be at least ${s.min}.`); continue }
      if (s.max !== undefined && n > s.max) { warnings.push(`${s.label} must be at most ${s.max}.`); continue }
    }
  }
  return warnings
}

/**
 * Recomputes every derived field (recommendation, estimates, warnings,
 * readiness) from the plan's current selections. Called after any update.
 */
function estimate(plan: TournamentPlan): TournamentPlan {
  if (!plan.formatId) {
    return {
      ...plan,
      recommendation:        null,
      estimatedRounds:        0,
      estimatedMatches:       0,
      estimatedDuration:      { min: 0, max: 0 },
      estimatedAverageRest:   0,
      fairnessScoreEstimate:  null,
      warnings:               [],
      readyToGenerate:        false,
    }
  }

  const format = getFormat(plan.formatId)
  if (!format) {
    return {
      ...plan,
      recommendation:        null,
      estimatedRounds:        0,
      estimatedMatches:       0,
      estimatedDuration:      { min: 0, max: 0 },
      estimatedAverageRest:   0,
      fairnessScoreEstimate:  null,
      warnings:               [`Unknown format id "${plan.formatId}".`],
      readyToGenerate:        false,
    }
  }

  const recommendation      = recommendationFor(format, plan.playerCount, plan.courtCount)
  const estimatedMatches    = deriveMatchCount(format, plan.settings)
  const estimatedRounds     = Math.max(1, Math.ceil(estimatedMatches / Math.max(1, plan.courtCount)))
  const estimatedDuration   = estimateDuration(format, estimatedMatches)
  const estimatedAverageRest = estimateAverageRest(plan.playerCount, plan.courtCount, estimatedRounds)
  const fairnessScoreEstimate = recommendation.score

  const warnings = [
    ...settingsValidationWarnings(format, plan.settings),
    ...recommendation.warnings,
    ...format.warnings,
    ...(estimatedDuration.max > plan.reservationDurationMinutes
      ? [`Estimated duration (${estimatedDuration.max} min) exceeds the reserved court time (${plan.reservationDurationMinutes} min).`]
      : []),
  ]

  const readyToGenerate =
    recommendation.fit !== 'not-recommended' &&
    settingsValidationWarnings(format, plan.settings).length === 0

  return {
    ...plan,
    recommendation,
    estimatedRounds,
    estimatedMatches,
    estimatedDuration,
    estimatedAverageRest,
    fairnessScoreEstimate,
    warnings,
    readyToGenerate,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Creates a fresh plan with no format selected yet. */
function createPlan(input: {
  playerCount: number
  courtCount?: number
  reservationDurationMinutes?: number
}): TournamentPlan {
  const base: TournamentPlan = {
    formatId:                   null,
    playerCount:                input.playerCount,
    courtCount:                 input.courtCount ?? 1,
    reservationDurationMinutes: input.reservationDurationMinutes ?? DEFAULT_RESERVATION_MINUTES,
    settings:                   {},
    recommendation:             null,
    estimatedRounds:            0,
    estimatedMatches:           0,
    estimatedDuration:          { min: 0, max: 0 },
    estimatedAverageRest:       0,
    fairnessScoreEstimate:      null,
    warnings:                   [],
    readyToGenerate:            false,
  }
  return estimate(base)
}

/** Selects a format, resetting settings to that format's defaults. */
function updateFormat(plan: TournamentPlan, formatId: string): TournamentPlan {
  const format = getFormat(formatId)
  return estimate({
    ...plan,
    formatId,
    settings: format ? initSettingValues(format) : {},
  })
}

/** Merges organiser-configured setting values into the plan. */
function updateSettings(plan: TournamentPlan, settings: PlannerSettingValues): TournamentPlan {
  return estimate({ ...plan, settings: { ...plan.settings, ...settings } })
}

/** Updates the number of courts available for the session. */
function updateCourtCount(plan: TournamentPlan, courtCount: number): TournamentPlan {
  return estimate({ ...plan, courtCount })
}

/** Updates the reserved court time, in minutes. */
function updateReservation(plan: TournamentPlan, reservationDurationMinutes: number): TournamentPlan {
  return estimate({ ...plan, reservationDurationMinutes })
}

/** Re-validates the plan without changing any selection (e.g. after external state changes). */
function validate(plan: TournamentPlan): TournamentPlan {
  return estimate(plan)
}

export const plannerService = {
  createPlan,
  updateFormat,
  updateSettings,
  updateCourtCount,
  updateReservation,
  estimate,
  validate,
} as const
