/**
 * Generic Constraint Solver — the constraint contract.
 *
 * A Constraint never knows which tournament format it's running under. It
 * only ever sees a candidate round and a generic ConstraintContext. Method
 * signatures only where behaviour is genuinely per-constraint; the five
 * built-in constraints in generic-constraints.ts are placeholders.
 */

import type {
  RoundCandidate,
  ConstraintContext,
  ConstraintViolation,
  ConstraintScore,
} from './constraint.types'

export interface Constraint {
  readonly id:    string
  readonly label: string

  /** Hard-rule check: violations this candidate has against this constraint. */
  evaluate(candidate: RoundCandidate, context: ConstraintContext): ReadonlyArray<ConstraintViolation>

  /** Soft-preference check: this constraint's own 0–100 score for the candidate. */
  score(candidate: RoundCandidate, context: ConstraintContext): ConstraintScore

  /** Whether this constraint has what it needs from the context to run. */
  validate(context: ConstraintContext): boolean
}
