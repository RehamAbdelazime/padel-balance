/**
 * Tournament Generator Architecture — generic supporting types.
 *
 * Definitions only. A generator turns a TournamentPlan (+ runtime context)
 * into a SessionSchedule. Nothing here runs an algorithm — these types just
 * describe the shape of the inputs/outputs every generator shares.
 */

import type { GeneratorPlayer } from '@/features/team-generator'
import type { SessionSchedule } from '../types'
import type { EstimatedDuration } from '../formats'

// ── Context ───────────────────────────────────────────────────────────────────

/**
 * Runtime data a generator needs beyond the organiser's TournamentPlan.
 * Built by the orchestrator (schedule.service) — generators never fetch
 * this themselves and never receive UI state.
 *
 * Deliberately rating-free: scheduling never reads player rating/skill.
 */
export type GeneratorContext = {
  readonly sessionId: string
  readonly playerIds: ReadonlyArray<string>
  readonly players:   ReadonlyArray<GeneratorPlayer>
}

// ── Regeneration scope ────────────────────────────────────────────────────────

/** Which part of an existing schedule a regenerate call should replace. */
export type GeneratorRegenerateScope =
  | 'current'           // replace only the currently active match
  | 'remaining'         // replace every match after the current one
  | 'all'               // replace every non-preserved match in the schedule
  | 'recalculate-only'  // re-evaluate balance scores without changing teams

// ── Results ───────────────────────────────────────────────────────────────────

/**
 * Outcome of a generate/regenerate call.
 * Placeholder generators return 'not-implemented' instead of throwing —
 * throwing is also an acceptable placeholder strategy per format generator.
 */
export type GeneratorResult =
  | { readonly status: 'success';         readonly schedule: SessionSchedule }
  | { readonly status: 'not-implemented'; readonly message: string }
  | { readonly status: 'error';           readonly message: string }

export type GeneratorValidationResult = {
  readonly valid:  boolean
  readonly errors: ReadonlyArray<string>
}

/**
 * A generator's own sizing estimate for a plan. Distinct from
 * TournamentPlan's own estimate fields (computed by the planner) — a real
 * per-format algorithm may eventually estimate these more precisely.
 */
export type GeneratorEstimate = {
  readonly estimatedRounds:       number
  readonly estimatedMatches:      number
  readonly estimatedDuration:     EstimatedDuration
  readonly estimatedAverageRest:  number
  readonly fairnessScoreEstimate: number | null
}
