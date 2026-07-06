/**
 * Placeholder runtime adapter for the Mexicano format.
 * Live-state tracking (score-based standings driving next-round pairing) is
 * not implemented yet — every method returns a 'not-implemented' result.
 */

import type { TournamentRuntimeAdapter } from './runtime.interface'
import type { TournamentPlan } from '../planner'
import type { SessionSchedule } from '../types'
import type {
  TournamentRuntime,
  RuntimeMatchResult,
  RuntimeResult,
  RuntimeStandings,
} from './runtime.types'

export class MexicanoRuntime implements TournamentRuntimeAdapter {
  readonly formatId = 'mexicano'

  supports(formatId: string): boolean {
    return formatId === this.formatId
  }

  create(_plan: TournamentPlan, _schedule: SessionSchedule): RuntimeResult {
    return { status: 'not-implemented', message: 'MexicanoRuntime.create is not implemented yet.' }
  }

  recordResult(_runtime: TournamentRuntime, _result: RuntimeMatchResult): RuntimeResult {
    return { status: 'not-implemented', message: 'MexicanoRuntime.recordResult is not implemented yet.' }
  }

  advance(_runtime: TournamentRuntime): RuntimeResult {
    return { status: 'not-implemented', message: 'MexicanoRuntime.advance is not implemented yet.' }
  }

  isFinished(_runtime: TournamentRuntime): boolean {
    return false
  }

  getStandings(_runtime: TournamentRuntime): RuntimeStandings {
    return []
  }
}
