/**
 * Shared scoring/traversal helpers for "equalise this metric across playing
 * players" constraints (EqualMatchesConstraint, EqualRestConstraint, and any
 * future fairness constraint of the same shape). Extracted so the bucket
 * table, averaging, and candidate-player extraction are never duplicated
 * between constraints.
 */

import type { RoundCandidate, PlayerId } from './constraint.types'

// ── Difference -> score buckets ──────────────────────────────────────────────

const SCORE_DIFFERENCE_NONE = 100
const SCORE_DIFFERENCE_ONE  = 80
const SCORE_DIFFERENCE_TWO  = 50
const SCORE_DIFFERENCE_MORE = 10

/** Maps a non-negative gap (from the candidate's lowest value) to a 0–100 score. */
export function scoreForDifference(difference: number): number {
  if (difference <= 0) return SCORE_DIFFERENCE_NONE
  if (difference === 1) return SCORE_DIFFERENCE_ONE
  if (difference === 2) return SCORE_DIFFERENCE_TWO
  return SCORE_DIFFERENCE_MORE
}

export function average(values: readonly number[]): number {
  if (values.length === 0) return SCORE_DIFFERENCE_NONE
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Every distinct player assigned to play in this candidate (across all courts). */
export function playingPlayers(candidate: RoundCandidate): PlayerId[] {
  const ids = new Set<PlayerId>()
  for (const court of candidate.courts) {
    for (const id of [...court.teamA, ...court.teamB]) ids.add(id)
  }
  return [...ids]
}
