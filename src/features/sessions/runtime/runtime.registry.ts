import type { TournamentRuntimeAdapter } from './runtime.interface'
import { AmericanoRuntime }   from './americano.runtime'
import { MexicanoRuntime }    from './mexicano.runtime'
import { RoundRobinRuntime }  from './round-robin.runtime'
import { KingOfCourtRuntime } from './king-of-court.runtime'
import { CustomRuntime }      from './custom.runtime'

// ── Registry ──────────────────────────────────────────────────────────────────
// Only CustomRuntime has a (minimal) implementation. The other four are
// registered so `getRuntime` resolves for every built-in format id, but each
// call returns a 'not-implemented' RuntimeResult until a future sprint
// implements that format's live-state tracking.

const REGISTRY: ReadonlyArray<TournamentRuntimeAdapter> = [
  new AmericanoRuntime(),
  new MexicanoRuntime(),
  new RoundRobinRuntime(),
  new KingOfCourtRuntime(),
  new CustomRuntime(),
]

export function getRuntime(formatId: string): TournamentRuntimeAdapter {
  const runtime = REGISTRY.find(r => r.supports(formatId))
  if (!runtime) {
    throw new Error(`getRuntime: no runtime adapter registered for format "${formatId}".`)
  }
  return runtime
}
