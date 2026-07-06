/**
 * EqualRestConstraint — fairness scheduling rule.
 *
 * Soft constraint: never hard-rejects a candidate. Prefers candidates whose
 * playing players have rested less so far, so rest opportunities are
 * distributed fairly across the session.
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
import { restCount } from './history/history.index'
import { scoreForDifference, average, playingPlayers } from './fairness-scoring'

const DEFAULT_WEIGHT = 1

/** Gap (rests above the candidate's lowest) that warrants a warning. */
const SIGNIFICANT_GAP_THRESHOLD = 3

export class EqualRestConstraint implements Constraint {
  readonly id    = 'equal-rest'
  readonly label = 'Equal Rest'

  evaluate(candidate: RoundCandidate, context: ConstraintContext): ReadonlyArray<ConstraintViolation> {
    const history = context.history
    const players = playingPlayers(candidate)
    if (players.length === 0) return []

    const counts  = players.map(id => restCount(history, id))
    const lowest  = Math.min(...counts)

    const violations: ConstraintViolation[] = []
    players.forEach((id, i) => {
      const gap = counts[i]! - lowest
      if (gap >= SIGNIFICANT_GAP_THRESHOLD) {
        violations.push({
          constraintId: this.id,
          candidateId:  candidate.id,
          message:      `${id} has rested ${gap} more time(s) than the least-rested player in this round.`,
          severity:     'warning',
        })
      }
    })

    return violations
  }

  score(candidate: RoundCandidate, context: ConstraintContext): ConstraintScore {
    const history = context.history
    const players = playingPlayers(candidate)

    const counts = players.map(id => restCount(history, id))
    const lowest = counts.length > 0 ? Math.min(...counts) : 0

    const contributions = counts.map(count => scoreForDifference(count - lowest))

    return {
      constraintId: this.id,
      candidateId:  candidate.id,
      value:        average(contributions),
      weight:       DEFAULT_WEIGHT,
    }
  }

  validate(_context: ConstraintContext): boolean {
    return true
  }
}
