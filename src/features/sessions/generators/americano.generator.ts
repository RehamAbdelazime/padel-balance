/**
 * AmericanoGenerator — generates a complete Americano schedule up front.
 *
 * Americano's defining rule: partners rotate every match so that, as far as
 * mathematically possible, no two players partner more than once, and every
 * player faces as many different opponents as possible (see
 * docs/tournament-formats/americano.md). That preference is expressed
 * entirely through the Constraint Solver (NeverRepeatPartnerConstraint,
 * NeverRepeatOpponentConstraint, EqualMatchesConstraint, EqualRestConstraint)
 * — this generator never encodes a rotation table itself, and never reads
 * player rating or skill.
 *
 * Every candidate split is enumerated by the Team Generator (rating-free);
 * the Constraint Solver decides which split wins, and ties between equally
 * fair candidates are broken randomly (see generation-helpers.ts).
 *
 * Non-determinism (whole-schedule level): a single greedy pass makes two
 * kinds of locally-random choices — which tied-fairness players are
 * selected for each match (shuffled in selectPlayersWithStatus) and which
 * tied-score team split wins that match (random pick in
 * selectCandidateViaSolver) — but any ONE pass only explores a single path
 * through that space. generate() instead runs that pass
 * candidatePoolSize(playerCount) times end to end (100–500+, more for
 * smaller player counts where the search space per match is smaller),
 * scores each full candidate with the same rating-free computeQuality used
 * everywhere else, and picks uniformly at random among the top
 * TOP_CANDIDATES by score. Two Generate calls on the same attendees almost
 * never produce the same pairing order unless the constraints genuinely
 * admit only one distinct high-quality schedule.
 */

import type {
  PlannedMatch,
  PlayerRuntimeState,
  PlayerRuntimeStatus,
  SessionSchedule,
} from '../types'
import { nextSchedule } from '../utils'
import type { TournamentPlan } from '../planner'
import { getAllConstraints } from '../constraints'
import { computeQuality } from './custom.generator'
import {
  generateRoundsWithSolver,
  regenerateRangeWithSolver,
} from './shared/generation-helpers'
import { defaultRandom } from './shared/random'
import type { TournamentGenerator } from './generator.interface'
import type {
  GeneratorContext,
  GeneratorRegenerateScope,
  GeneratorResult,
  GeneratorValidationResult,
  GeneratorEstimate,
} from './generator.types'

/** Random pick is uniform among the top-scoring candidates, not always the single best. */
const TOP_CANDIDATES = 10

/**
 * How many full candidate schedules to generate before picking one.
 * Smaller player counts have a smaller per-match search space (fewer
 * eligible players to choose 4 from), so they need a bigger pool to surface
 * genuinely distinct high-quality schedules; larger counts are capped to
 * keep generation fast (each candidate re-runs the entire greedy pass).
 */
function candidatePoolSize(playerCount: number): number {
  if (playerCount <= 8)  return 500
  if (playerCount <= 12) return 250
  if (playerCount <= 16) return 150
  return 100
}

type CandidateSchedule = {
  readonly matches:      PlannedMatch[]
  readonly playerStates: ReadonlyMap<string, PlayerRuntimeState>
  readonly overallScore: number
}

function generateOneCandidateSchedule(
  players:     GeneratorContext['players'],
  playerIds:   string[],
  targetCount: number,
  courtCount:  number,
  constraints: ReturnType<typeof getAllConstraints>,
): CandidateSchedule {
  const initialStates: ReadonlyMap<string, PlayerRuntimeState> = new Map(
    playerIds.map(id => [id, { playerId: id, status: 'AVAILABLE' as PlayerRuntimeStatus }]),
  )

  const matches = generateRoundsWithSolver(
    [...players], playerIds, targetCount, courtCount, initialStates, {}, constraints,
  )

  return { matches, playerStates: initialStates, overallScore: computeQuality(matches, playerIds).overall }
}

/** Canonical signature for a full schedule — order-independent per match, so two schedules that are identical up to team-label swapping compare equal. */
function scheduleSignature(matches: readonly PlannedMatch[]): string {
  return matches
    .map(m => [...m.teamA].sort().join(',') + '|' + [...m.teamB].sort().join(','))
    .map(pair => pair.split('|').sort().join('|'))
    .join(';')
}

/** Keeps only the first (highest-scoring, since `pool` is pre-sorted) occurrence of each distinct schedule. */
function distinctBySignature(pool: readonly CandidateSchedule[]): CandidateSchedule[] {
  const seen = new Set<string>()
  const out: CandidateSchedule[] = []
  for (const candidate of pool) {
    const sig = scheduleSignature(candidate.matches)
    if (seen.has(sig)) continue
    seen.add(sig)
    out.push(candidate)
  }
  return out
}

export class AmericanoGenerator implements TournamentGenerator {
  readonly formatId = 'americano'

  supports(formatId: string): boolean {
    return formatId === this.formatId
  }

  async generate(plan: TournamentPlan, context: GeneratorContext): Promise<GeneratorResult> {
    const targetCount = plan.estimatedMatches
    const playerIds    = [...context.playerIds]
    const constraints  = getAllConstraints()

    const poolSize = candidatePoolSize(playerIds.length)
    const pool: CandidateSchedule[] = []
    for (let i = 0; i < poolSize; i++) {
      pool.push(generateOneCandidateSchedule(context.players, playerIds, targetCount, plan.courtCount, constraints))
    }

    pool.sort((a, b) => b.overallScore - a.overallScore)
    const distinctPool = distinctBySignature(pool)
    const topPool = distinctPool.slice(0, Math.min(TOP_CANDIDATES, distinctPool.length))
    const chosen  = topPool[Math.floor(defaultRandom.next() * topPool.length)]!

    const quality = computeQuality(chosen.matches, playerIds)

    const schedule: SessionSchedule = {
      sessionId:         context.sessionId,
      phase:             'PLANNING',
      version:           1,
      matches:           chosen.matches,
      quality,
      targetCount,
      playerStates:      chosen.playerStates,
      currentMatchIndex: null,
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

    const from: number = scope === 'current'   ? (schedule.currentMatchIndex ?? 0)
                       : scope === 'remaining' ? (schedule.currentMatchIndex ?? 0) + 1
                       : /* 'all' */             0
    const to: number   = scope === 'current' ? from + 1 : schedule.matches.length

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
    if (plan.formatId !== this.formatId)      errors.push('AmericanoGenerator only supports the "americano" format.')
    if (context.playerIds.length < 4)         errors.push('At least 4 players are required to generate a schedule.')
    if (context.playerIds.length % 2 !== 0)   errors.push('Americano requires an even number of players.')
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
