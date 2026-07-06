/**
 * Tournament Generator Architecture — the generator contract.
 *
 * TournamentPlan is the ONLY organiser-intent input. A generator also
 * receives a GeneratorContext (runtime data: session id, players,
 * existing schedule when regenerating) — never React state, never a
 * dialog, never a hook. Method signatures only; no implementation here.
 */

import type { TournamentPlan } from '../planner'
import type { SessionSchedule } from '../types'
import type {
  GeneratorContext,
  GeneratorRegenerateScope,
  GeneratorResult,
  GeneratorValidationResult,
  GeneratorEstimate,
} from './generator.types'

export interface TournamentGenerator {
  /** The TournamentFormat id this generator produces schedules for. */
  readonly formatId: string

  /** Whether this generator can handle the given format id. */
  supports(formatId: string): boolean

  /** Produces a brand-new SessionSchedule from a confirmed TournamentPlan. */
  generate(plan: TournamentPlan, context: GeneratorContext): Promise<GeneratorResult>

  /** Replaces part (or all) of an existing schedule per the given scope. */
  regenerate(
    schedule: SessionSchedule,
    plan:     TournamentPlan,
    context:  GeneratorContext,
    scope:    GeneratorRegenerateScope,
  ): Promise<GeneratorResult>

  /** Checks whether the plan has everything this generator needs to run. */
  validate(plan: TournamentPlan, context: GeneratorContext): GeneratorValidationResult

  /** Produces this generator's own sizing estimate for the given plan. */
  estimate(plan: TournamentPlan, context: GeneratorContext): GeneratorEstimate
}
