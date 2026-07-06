/**
 * EqualMatchesConstraint — fairness scheduling rule.
 *
 * Soft constraint: never hard-rejects a candidate. Prefers candidates whose
 * playing players have played fewer matches so far, so play time naturally
 * balances out over a session.
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
import { matchesPlayed } from './history/history.index'
import { scoreForDifference, average, playingPlayers } from './fairness-scoring'

const DEFAULT_WEIGHT = 1

/** Gap (matches played above the candidate's lowest) that warrants a warning. */
const SIGNIFICANT_GAP_THRESHOLD = 3

export class EqualMatchesConstraint implements Constraint {
  readonly id    = 'equal-matches'
  readonly label = 'Equal Matches'

  evaluate(candidate: RoundCandidate, context: ConstraintContext): ReadonlyArray<ConstraintViolation> {
    const history = context.history
    const players = playingPlayers(candidate)
    if (players.length === 0) return []

    const counts  = players.map(id => matchesPlayed(history, id))
    const lowest  = Math.min(...counts)

    const violations: ConstraintViolation[] = []
    players.forEach((id, i) => {
      const gap = counts[i]! - lowest
      if (gap >= SIGNIFICANT_GAP_THRESHOLD) {
        violations.push({
          constraintId: this.id,
          candidateId:  candidate.id,
          message:      `${id} has played ${gap} more match(es) than the least-played player in this round.`,
          severity:     'warning',
        })
      }
    })

    return violations
  }

  score(candidate: RoundCandidate, context: ConstraintContext): ConstraintScore {
    const history = context.history
    const players = playingPlayers(candidate)

    const counts = players.map(id => matchesPlayed(history, id))
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
