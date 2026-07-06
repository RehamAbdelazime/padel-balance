/**
 * Placeholder runtime adapter for the Americano format.
 * Live-state tracking (individual point standings, rotation progress) is
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

export class AmericanoRuntime implements TournamentRuntimeAdapter {
  readonly formatId = 'americano'

  supports(formatId: string): boolean {
    return formatId === this.formatId
  }

  create(_plan: TournamentPlan, _schedule: SessionSchedule): RuntimeResult {
    return { status: 'not-implemented', message: 'AmericanoRuntime.create is not implemented yet.' }
  }

  recordResult(_runtime: TournamentRuntime, _result: RuntimeMatchResult): RuntimeResult {
    return { status: 'not-implemented', message: 'AmericanoRuntime.recordResult is not implemented yet.' }
  }

  advance(_runtime: TournamentRuntime): RuntimeResult {
    return { status: 'not-implemented', message: 'AmericanoRuntime.advance is not implemented yet.' }
  }

  isFinished(_runtime: TournamentRuntime): boolean {
    return false
  }

  getStandings(_runtime: TournamentRuntime): RuntimeStandings {
    return []
  }
}
