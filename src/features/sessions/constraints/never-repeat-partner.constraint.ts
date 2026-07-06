/**
 * NeverRepeatPartnerConstraint — first production scheduling rule.
 *
 * Soft constraint: never hard-rejects a candidate. Instead it scores every
 * teammate pair in the candidate against how many times that pair has
 * partnered in prior rounds, and returns a weighted penalty so the solver
 * naturally ranks repeat-partner candidates lower.
 *
 * Never walks `context.priorRounds` or builds its own history — reads the
 * precomputed `context.history` (built once per solve() call, O(1) lookups).
 */

import type { Constraint } from './constraint.interface'
import type {
  RoundCandidate,
  ConstraintContext,
  ConstraintViolation,
  ConstraintScore,
} from './constraint.types'
import { partnerCount } from './history/history.index'

// ── Penalty guidelines ────────────────────────────────────────────────────────

const SCORE_NEVER_PARTNERED     = 100
const SCORE_PARTNERED_ONCE      = 40
const SCORE_PARTNERED_TWICE     = 10
const SCORE_PARTNERED_MORE      = 0

const DEFAULT_WEIGHT = 1

function scoreForPartnerCount(count: number): number {
  if (count <= 0) return SCORE_NEVER_PARTNERED
  if (count === 1) return SCORE_PARTNERED_ONCE
  if (count === 2) return SCORE_PARTNERED_TWICE
  return SCORE_PARTNERED_MORE
}

function average(values: readonly number[]): number {
  if (values.length === 0) return SCORE_NEVER_PARTNERED
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

export class NeverRepeatPartnerConstraint implements Constraint {
  readonly id    = 'never-repeat-partner'
  readonly label = 'Never Repeat Partner'

  evaluate(candidate: RoundCandidate, context: ConstraintContext): ReadonlyArray<ConstraintViolation> {
    const history = context.history
    const violations: ConstraintViolation[] = []

    for (const court of candidate.courts) {
      for (const [a, b] of [court.teamA, court.teamB]) {
        const count = partnerCount(history, a, b)
        if (count > 0) {
          violations.push({
            constraintId: this.id,
            candidateId:  candidate.id,
            message:      `${a} and ${b} have already partnered ${count} time(s).`,
            severity:     'warning',
          })
        }
      }
    }

    return violations
  }

  score(candidate: RoundCandidate, context: ConstraintContext): ConstraintScore {
    const history = context.history

    const pairScores = candidate.courts.flatMap(court => [
      scoreForPartnerCount(partnerCount(history, court.teamA[0], court.teamA[1])),
      scoreForPartnerCount(partnerCount(history, court.teamB[0], court.teamB[1])),
    ])

    return {
      constraintId: this.id,
      candidateId:  candidate.id,
      value:        average(pairScores),
      weight:       DEFAULT_WEIGHT,
    }
  }

  validate(_context: ConstraintContext): boolean {
    return true
  }
}
