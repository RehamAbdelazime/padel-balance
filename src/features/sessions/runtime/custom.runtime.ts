/**
 * CustomRuntime — minimal placeholder.
 *
 * Unlike the other four adapters, this one is not 'not-implemented': the
 * Custom format has no standings/queue concept of its own (its
 * TournamentRules declare `standings: 'none'`), so a minimal, generic
 * bookkeeping implementation is safe here without implementing any
 * tournament algorithm. It only tracks round/match completion counters —
 * no balancing, pairing, or ranking logic lives in this file.
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

export class CustomRuntime implements TournamentRuntimeAdapter {
  readonly formatId = 'custom'

  supports(formatId: string): boolean {
    return formatId === this.formatId
  }

  create(_plan: TournamentPlan, schedule: SessionSchedule): RuntimeResult {
    const completedMatches = schedule.matches.filter(m => m.isCompleted).map(m => m.id)

    const runtime: TournamentRuntime = {
      formatId:          this.formatId,
      sessionId:         schedule.sessionId,
      currentRound:      schedule.currentMatchIndex ?? 0,
      completedRounds:   completedMatches.length,
      completedMatches,
      status:            completedMatches.length === 0 ? 'NOT_STARTED' : 'IN_PROGRESS',
      statistics:        new Map(),
      state:             { totalMatches: schedule.matches.length },
    }
    return { status: 'success', runtime }
  }

  recordResult(runtime: TournamentRuntime, result: RuntimeMatchResult): RuntimeResult {
    const completedMatches = [...runtime.completedMatches, result.matchId]
    const totalMatches     = typeof runtime.state.totalMatches === 'number' ? runtime.state.totalMatches : 0

    const updated: TournamentRuntime = {
      ...runtime,
      completedMatches,
      completedRounds: completedMatches.length,
      status:          completedMatches.length >= totalMatches ? 'FINISHED' : 'IN_PROGRESS',
    }
    return { status: 'success', runtime: updated }
  }

  advance(runtime: TournamentRuntime): RuntimeResult {
    const updated: TournamentRuntime = { ...runtime, currentRound: runtime.currentRound + 1 }
    return { status: 'success', runtime: updated }
  }

  isFinished(runtime: TournamentRuntime): boolean {
    return runtime.status === 'FINISHED'
  }

  /** Custom declares `standings: 'none'` — no ranking to produce. */
  getStandings(_runtime: TournamentRuntime): RuntimeStandings {
    return []
  }
}
