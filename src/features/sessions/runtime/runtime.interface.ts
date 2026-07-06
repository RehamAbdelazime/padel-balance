/**
 * Tournament Runtime Architecture — the adapter contract.
 *
 * A TournamentRuntimeAdapter turns a (TournamentPlan, SessionSchedule) pair
 * into a live TournamentRuntime, and evolves that runtime as match results
 * are recorded. Method signatures only; no implementation here.
 *
 * Future generators will read TournamentRuntime to produce the next round —
 * this sprint only introduces the contract, it does not wire that up.
 */

import type { TournamentPlan } from '../planner'
import type { SessionSchedule } from '../types'
import type {
  TournamentRuntime,
  RuntimeMatchResult,
  RuntimeResult,
  RuntimeStandings,
} from './runtime.types'

export interface TournamentRuntimeAdapter {
  /** The TournamentFormat id this adapter manages runtime state for. */
  readonly formatId: string

  /** Whether this adapter can handle the given format id. */
  supports(formatId: string): boolean

  /** Creates the initial TournamentRuntime for a freshly generated schedule. */
  create(plan: TournamentPlan, schedule: SessionSchedule): RuntimeResult

  /** Applies one completed match's result, evolving the runtime state. */
  recordResult(runtime: TournamentRuntime, result: RuntimeMatchResult): RuntimeResult

  /** Advances the runtime to the next round/turn (queue rotation, round index, …). */
  advance(runtime: TournamentRuntime): RuntimeResult

  /** Whether the tournament has met its ending condition. */
  isFinished(runtime: TournamentRuntime): boolean

  /** Current standings/ranking derived from the runtime's live statistics. */
  getStandings(runtime: TournamentRuntime): RuntimeStandings
}
