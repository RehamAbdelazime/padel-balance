/**
 * CustomGenerator — the balanced-team generator, driven entirely by
 * tournament-fairness rules (partner/opponent diversity, equal play count,
 * rest balance). It never reads player rating or skill — see
 * generation-helpers.ts for the shared enumerate → constraint-solve →
 * random-tie-break selection every generator uses.
 */

import type {
  PlannedMatch,
  ScheduleQuality,
  ScheduleQualityDimension,
  PlayerRuntimeState,
  PlayerRuntimeStatus,
  SessionSchedule,
} from '../types'
import { nextSchedule } from '../utils'
import type { PlanningContext } from '../utils'
import type { TournamentPlan } from '../planner'
import { getAllConstraints } from '../constraints'
import type { TournamentGenerator } from './generator.interface'
import type {
  GeneratorContext,
  GeneratorRegenerateScope,
  GeneratorResult,
  GeneratorValidationResult,
  GeneratorEstimate,
} from './generator.types'
import {
  buildContextFromSchedule,
  generateRoundsWithSolver,
  regenerateRangeWithSolver,
} from './shared/generation-helpers'

// ── Internal helpers — quality engine ────────────────────────────────────────

function dimEqualPlayTime(
  ctx: PlanningContext,
  playerIds: readonly string[],
): ScheduleQualityDimension {
  if (playerIds.length === 0) {
    return { score: 100, label: 'sessions.quality.equalPlayTime', explanation: 'No players.' }
  }
  const played = playerIds.map(id => ctx.players.get(id)?.matchesPlayed ?? 0)
  const mean   = played.reduce((a, b) => a + b, 0) / played.length
  if (mean === 0) {
    return { score: 100, label: 'sessions.quality.equalPlayTime', explanation: 'No matches planned yet.' }
  }
  const variance = played.reduce((s, x) => s + (x - mean) ** 2, 0) / played.length
  const cv    = Math.sqrt(variance) / mean
  const score = Math.round(Math.max(0, Math.min(100, 100 - cv * 200)))
  const min   = Math.min(...played)
  const max   = Math.max(...played)
  const explanation = min === max
    ? `All players play ${min} match${min !== 1 ? 'es' : ''}.`
    : `Play counts range from ${min} to ${max}.`
  return { score, label: 'sessions.quality.equalPlayTime', explanation }
}

function dimPartnerDiversity(
  ctx: PlanningContext,
  playerIds: readonly string[],
): ScheduleQualityDimension {
  let maxRepeat = 0
  let maxPairLabel = ''
  for (const id of playerIds) {
    const state = ctx.players.get(id)
    if (!state) continue
    for (const [partnerId, count] of state.partnerFreq) {
      if (count > maxRepeat) {
        maxRepeat    = count
        maxPairLabel = [id, partnerId].sort().join(' + ')
      }
    }
  }
  const score       = Math.round(Math.max(0, Math.min(100, 100 - Math.max(0, maxRepeat - 1) * 20)))
  const explanation = maxRepeat <= 1
    ? 'All partner pairings are unique so far.'
    : `Highest repeat pairing: ${maxPairLabel} (${maxRepeat} times).`
  return { score, label: 'sessions.quality.partnerDiversity', explanation }
}

function dimOpponentDiversity(
  ctx: PlanningContext,
  playerIds: readonly string[],
): ScheduleQualityDimension {
  let maxRepeat = 0
  let maxPairLabel = ''
  for (const id of playerIds) {
    const state = ctx.players.get(id)
    if (!state) continue
    for (const [oppId, count] of state.opponentFreq) {
      if (count > maxRepeat) {
        maxRepeat    = count
        maxPairLabel = [id, oppId].sort().join(' vs ')
      }
    }
  }
  const score       = Math.round(Math.max(0, Math.min(100, 100 - Math.max(0, maxRepeat - 2) * 15)))
  const explanation = maxRepeat <= 2
    ? 'Opponent matchups are well distributed.'
    : `Most frequent matchup: ${maxPairLabel} (${maxRepeat} times).`
  return { score, label: 'sessions.quality.opponentDiversity', explanation }
}

function dimRestBalance(
  ctx: PlanningContext,
  playerIds: readonly string[],
): ScheduleQualityDimension {
  if (playerIds.length === 0) {
    return { score: 100, label: 'sessions.quality.restBalance', explanation: 'No players.' }
  }
  const rested = playerIds.map(id => ctx.players.get(id)?.matchesRested ?? 0)
  const mean   = rested.reduce((a, b) => a + b, 0) / rested.length
  if (mean === 0) {
    return { score: 100, label: 'sessions.quality.restBalance', explanation: 'No rests recorded yet.' }
  }
  const variance = rested.reduce((s, x) => s + (x - mean) ** 2, 0) / rested.length
  const cv    = Math.sqrt(variance) / mean
  const score = Math.round(Math.max(0, Math.min(100, 100 - cv * 100)))
  const min   = Math.min(...rested)
  const max   = Math.max(...rested)
  const explanation = min === max
    ? `All players have rested ${min} match${min !== 1 ? 'es' : ''}.`
    : `Rest counts range from ${min} to ${max}.`
  return { score, label: 'sessions.quality.restBalance', explanation }
}

/**
 * Computes schedule quality across four tournament-fairness dimensions.
 * No player rating/skill is involved anywhere in this calculation.
 * Exported for schedule.service's manual mutation operations, which use the
 * same quality engine as generation.
 */
export function computeQuality(
  matches: readonly PlannedMatch[],
  playerIds: readonly string[],
): ScheduleQuality {
  const ctx               = buildContextFromSchedule(matches, playerIds)
  const equalPlayTime      = dimEqualPlayTime(ctx, playerIds)
  const partnerDiversity   = dimPartnerDiversity(ctx, playerIds)
  const opponentDiversity  = dimOpponentDiversity(ctx, playerIds)
  const restBalance        = dimRestBalance(ctx, playerIds)

  const overall = Math.round(
    equalPlayTime.score     * 0.35 +
    partnerDiversity.score  * 0.30 +
    opponentDiversity.score * 0.20 +
    restBalance.score       * 0.15,
  )

  return { overall, equalPlayTime, partnerDiversity, opponentDiversity, restBalance }
}

// ── Generator ─────────────────────────────────────────────────────────────────

/**
 * The balanced-team generator: no fixed rotation rules, matches are picked to
 * maximise tournament fairness (equal play time, partner/opponent diversity,
 * rest balance) — never player rating. This is the only format with a real
 * implementation so far — the other four are placeholders.
 */
export class CustomGenerator implements TournamentGenerator {
  readonly formatId = 'custom'

  supports(formatId: string): boolean {
    return formatId === this.formatId
  }

  async generate(plan: TournamentPlan, context: GeneratorContext): Promise<GeneratorResult> {
    const targetCount = plan.estimatedMatches
    const playerIds    = [...context.playerIds]
    const players      = [...context.players]
    const constraints  = getAllConstraints()

    const playerStates: ReadonlyMap<string, PlayerRuntimeState> = new Map(
      playerIds.map(id => [id, { playerId: id, status: 'AVAILABLE' as PlayerRuntimeStatus }]),
    )

    // NOTE: baseConfig overrides are not threaded through the generator
    // interface yet — every real call site has only ever used the default,
    // so this preserves current behaviour exactly. Generation now proceeds
    // round by round (Sprint G1), not match by match — see generation-helpers.
    const matches = generateRoundsWithSolver(
      players, playerIds, targetCount, plan.courtCount, playerStates, {}, constraints,
    )

    const quality = computeQuality(matches, playerIds)

    const schedule: SessionSchedule = {
      sessionId:          context.sessionId,
      phase:              'PLANNING',
      version:            1,
      matches,
      quality,
      targetCount,
      playerStates,
      currentMatchIndex:  null,
    }

    return { status: 'success', schedule }
  }

  async regenerate(
    schedule: SessionSchedule,
    plan:     TournamentPlan,
    context:  GeneratorContext,
    scope:    GeneratorRegenerateScope,
  ): Promise<GeneratorResult> {
    const playerIds   = [...context.playerIds]
    const players     = [...context.players]
    const constraints = getAllConstraints()

    if (scope === 'recalculate-only') {
      // Quality is a pure function of match composition — there is no
      // rating-based re-evaluation to run, so this scope simply recomputes
      // quality from the schedule's existing (unchanged) matches.
      const newQuality = computeQuality(schedule.matches, playerIds)
      return {
        status:   'success',
        schedule: nextSchedule(schedule, { quality: newQuality }),
      }
    }

    const from = scope === 'current'   ? (schedule.currentMatchIndex ?? 0)
               : scope === 'remaining' ? (schedule.currentMatchIndex ?? 0) + 1
               : /* 'all' */             0
    const to   = scope === 'current' ? from + 1 : schedule.matches.length

    // NOTE: baseConfig overrides are not threaded through yet — see generate().
    // Sprint G1: courtCount is required so regeneration can reason in whole
    // rounds — plan.courtCount is always the session's real court count
    // (see schedule.service.ts's buildCustomPlan).
    const { newMatches, finalStates } = regenerateRangeWithSolver(
      schedule, players, playerIds, from, to, {}, constraints, plan.courtCount,
    )
    const newQuality = computeQuality(newMatches, playerIds)

    return {
      status:   'success',
      schedule: nextSchedule(schedule, {
        matches:      newMatches,
        quality:      newQuality,
        playerStates: finalStates,
      }),
    }
  }

  validate(plan: TournamentPlan, context: GeneratorContext): GeneratorValidationResult {
    const errors: string[] = []
    if (plan.formatId !== this.formatId) errors.push('CustomGenerator only supports the "custom" format.')
    if (context.playerIds.length < 4)    errors.push('At least 4 players are required to generate a schedule.')
    return { valid: errors.length === 0, errors }
  }

  estimate(plan: TournamentPlan, _context: GeneratorContext): GeneratorEstimate {
    return {
      estimatedRounds:       plan.estimatedRounds,
      estimatedMatches:      plan.estimatedMatches,
      estimatedDuration:     plan.estimatedDuration,
      estimatedAverageRest:  plan.estimatedAverageRest,
      fairnessScoreEstimate: plan.fairnessScoreEstimate,
    }
  }
}
