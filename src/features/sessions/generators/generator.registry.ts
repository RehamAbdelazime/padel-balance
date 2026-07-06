import type { TournamentGenerator } from './generator.interface'
import { AmericanoGenerator }     from './americano.generator'
import { MexicanoGenerator }      from './mexicano.generator'
import { RoundRobinGenerator }    from './round-robin.generator'
import { KingOfTheCourtGenerator } from './king-of-court.generator'
import { CustomGenerator }        from './custom.generator'

// ── Registry ──────────────────────────────────────────────────────────────────
// Only CustomGenerator has a real implementation. The other four are
// registered so `getGenerator` resolves for every built-in format id, but
// each call returns a 'not-implemented' GeneratorResult until a future sprint
// implements that format's algorithm.

const REGISTRY: ReadonlyArray<TournamentGenerator> = [
  new AmericanoGenerator(),
  new MexicanoGenerator(),
  new RoundRobinGenerator(),
  new KingOfTheCourtGenerator(),
  new CustomGenerator(),
]

export function getGenerator(formatId: string): TournamentGenerator {
  const generator = REGISTRY.find(g => g.supports(formatId))
  if (!generator) {
    throw new Error(`getGenerator: no generator registered for format "${formatId}".`)
  }
  return generator
}
