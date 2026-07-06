export type {
  TournamentRuntime,
  TournamentRuntimeStatus,
  TournamentRuntimeStatistics,
  RuntimeStatisticValues,
  RuntimeStandingEntry,
  RuntimeStandings,
  RuntimeMatchResult,
  RuntimeResult,
} from './runtime.types'

export type { TournamentRuntimeAdapter } from './runtime.interface'

export { getRuntime } from './runtime.registry'
