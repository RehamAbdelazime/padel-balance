/**
 * Generic placeholder constraints.
 *
 * No tournament-specific logic yet — each one is a fully typed, reusable
 * Constraint that returns a neutral score and no violations. See
 * never-repeat-partner.constraint.ts, never-repeat-opponent.constraint.ts,
 * equal-matches.constraint.ts, and equal-rest.constraint.ts for constraints
 * with real scoring behaviour — the rest are implemented the same way over
 * time.
 */

import type { Constraint } from './constraint.interface'
import type {
  RoundCandidate,
  ConstraintContext,
  ConstraintViolation,
  ConstraintScore,
} from './constraint.types'

/** Neutral score returned by every placeholder constraint (no preference either way). */
const NEUTRAL_SCORE_VALUE = 100
const DEFAULT_WEIGHT      = 1

abstract class NeutralConstraint implements Constraint {
  constructor(
    readonly id:    string,
    readonly label: string,
  ) {}

  evaluate(_candidate: RoundCandidate, _context: ConstraintContext): ReadonlyArray<ConstraintViolation> {
    return []
  }

  score(candidate: RoundCandidate, _context: ConstraintContext): ConstraintScore {
    return {
      constraintId: this.id,
      candidateId:  candidate.id,
      value:        NEUTRAL_SCORE_VALUE,
      weight:       DEFAULT_WEIGHT,
    }
  }

  validate(_context: ConstraintContext): boolean {
    return true
  }
}

/**
 * Intentionally reserved placeholder — not dead code.
 *
 * Today every court in a session is assumed bookable for the whole session
 * (CLAUDE.md explicitly defers "multi-court assignment" — e.g. a specific
 * court going unavailable mid-session, or courts with different
 * capabilities — to a future sprint). This constraint is the seam for that:
 * when a real per-court availability rule exists, it becomes a real
 * Constraint here without the solver, registry, or any generator needing to
 * change (Sprint G1.1 Step 5). Until then it stays neutral (no violations,
 * constant score) so it has zero effect on scheduling.
 */
export class CourtAvailabilityConstraint extends NeutralConstraint {
  constructor() { super('court-availability', 'Court Availability') }
}
