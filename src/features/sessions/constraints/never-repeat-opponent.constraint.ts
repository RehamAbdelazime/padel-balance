/**
 * NeverRepeatOpponentConstraint — opponent-history scheduling rule.
 *
 * Soft constraint: never hard-rejects a candidate. Scores every cross-team
 * pair in the candidate against how many times that pair has already faced
 * each other, and returns a weighted penalty so the solver naturally ranks
 * repeat-opponent candidates lower.
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
  CourtAssignment,
  PlayerId,
} from './constraint.types'
import { opponentCount } from './history/history.index'
import { average } from './fairness-scoring'

// ── Meeting-count guidelines ──────────────────────────────────────────────────

const SCORE_NEVER_FACED  = 100
const SCORE_FACED_ONCE   = 60
const SCORE_FACED_TWICE  = 20
const SCORE_FACED_MORE   = 0

const DEFAULT_WEIGHT = 1

function scoreForOpponentCount(count: number): number {
  if (count <= 0) return SCORE_NEVER_FACED
  if (count === 1) return SCORE_FACED_ONCE
  if (count === 2) return SCORE_FACED_TWICE
  return SCORE_FACED_MORE
}

/** The 4 cross-team opponent pairs within one court: A1-B1, A1-B2, A2-B1, A2-B2. */
function opponentPairsInCourt(court: CourtAssignment): ReadonlyArray<readonly [PlayerId, PlayerId]> {
  const pairs: Array<readonly [PlayerId, PlayerId]> = []
  for (const a of court.teamA) {
    for (const b of court.teamB) {
      pairs.push([a, b])
    }
  }
  return pairs
}

/** Message intensity increases with meeting count; severity stays 'warning' — never blocking. */
function messageForOpponentCount(a: PlayerId, b: PlayerId, count: number): string {
  if (count === 1) return `${a} and ${b} have already faced each other once.`
  if (count === 2) return `${a} and ${b} have already faced each other twice — consider avoiding this matchup.`
  return `${a} and ${b} have already faced each other ${count} times — this matchup is significantly repeated.`
}

export class NeverRepeatOpponentConstraint implements Constraint {
  readonly id    = 'never-repeat-opponent'
  readonly label = 'Never Repeat Opponent'

  evaluate(candidate: RoundCandidate, context: ConstraintContext): ReadonlyArray<ConstraintViolation> {
    const history = context.history
    const violations: ConstraintViolation[] = []

    for (const court of candidate.courts) {
      for (const [a, b] of opponentPairsInCourt(court)) {
        const count = opponentCount(history, a, b)
        if (count > 0) {
          violations.push({
            constraintId: this.id,
            candidateId:  candidate.id,
            message:      messageForOpponentCount(a, b, count),
            severity:     'warning',
          })
        }
      }
    }

    return violations
  }

  score(candidate: RoundCandidate, context: ConstraintContext): ConstraintScore {
    const history = context.history

    const pairScores = candidate.courts.flatMap(court =>
      opponentPairsInCourt(court).map(([a, b]) => scoreForOpponentCount(opponentCount(history, a, b))),
    )

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
