import type { Constraint } from './constraint.interface'
import { CourtAvailabilityConstraint } from './generic-constraints'
import { NeverRepeatPartnerConstraint } from './never-repeat-partner.constraint'
import { NeverRepeatOpponentConstraint } from './never-repeat-opponent.constraint'
import { EqualMatchesConstraint } from './equal-matches.constraint'
import { EqualRestConstraint } from './equal-rest.constraint'

// ── Registry ──────────────────────────────────────────────────────────────────
// Every constraint the solver can be driven by. A future format contributes
// its own constraints here (or a per-format subset) rather than the solver
// ever branching on a format id.

const REGISTRY: ReadonlyArray<Constraint> = [
  new NeverRepeatPartnerConstraint(),
  new NeverRepeatOpponentConstraint(),
  new EqualRestConstraint(),
  new EqualMatchesConstraint(),
  new CourtAvailabilityConstraint(),
]

export function getAllConstraints(): ReadonlyArray<Constraint> {
  return REGISTRY
}

export function getConstraint(id: string): Constraint | undefined {
  return REGISTRY.find(c => c.id === id)
}
