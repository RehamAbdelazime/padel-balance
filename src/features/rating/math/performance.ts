/**
 * Computes the actual performance quotient for the team that scored teamScore.
 *
 *   PQ = teamScore / (teamScore + opponentScore)
 *
 * PQ is the continuous analogue of a binary win/loss outcome. It measures
 * the fraction of total points scored by this team, giving the score margin
 * its mathematical role as the primary evidence signal.
 *
 * Evidence strength by scoreline (for context):
 *
 *   PQ(4-0) = 1.000  — maximum signal; opponent scored zero points
 *   PQ(4-1) = 0.800  — strong win
 *   PQ(4-2) = 0.667
 *   PQ(4-3) = 0.571  — narrow win; close to the 0.5 baseline
 *   PQ(4-4) = 0.500  — draw; no directional information
 *   PQ(3-4) = 0.429  — narrow loss
 *   PQ(0-4) = 0.000  — maximum negative signal
 *
 * Division-by-zero guard: when both scores are zero, PQ is mathematically
 * undefined (0 ÷ 0). Returns 0 as a sentinel. Callers that need the surplus
 * signal should use performanceSurplus(), which handles this case and returns
 * zero update — preserving the invariant that 0–0 produces no rating change.
 *
 * @example
 *   performanceQuotient(4, 0) → 1.0
 *   performanceQuotient(4, 3) → 0.5714...
 *   performanceQuotient(4, 4) → 0.5
 *   performanceQuotient(0, 4) → 0.0
 *   performanceQuotient(0, 0) → 0  (sentinel; undefined case)
 */
export function performanceQuotient(teamScore: number, opponentScore: number): number {
  const total = teamScore + opponentScore
  if (total === 0) return 0
  return teamScore / total
}

/**
 * Computes the performance surplus δ — the signed signal that drives rating updates.
 *
 *   δ = PQ − E
 *     = teamScore / (teamScore + opponentScore) − expectedPerformanceQuotient
 *
 * Interpretation:
 *   δ > 0  — team outperformed expectations  → ratings rise
 *   δ = 0  — result exactly matched expectations → no update
 *   δ < 0  — team underperformed expectations → ratings fall
 *
 * Score margin is built into the surplus through PQ:
 *   equal teams, 4-0 win: δ = 1.000 − 0.500 = +0.500  (maximum signal)
 *   equal teams, 4-3 win: δ = 0.571 − 0.500 = +0.071  (weak signal)
 *   equal teams, 0-4 loss: δ = 0.000 − 0.500 = −0.500  (maximum negative)
 *
 * Crucially, a heavily favoured team winning narrowly receives a negative surplus:
 *   strongTeam (E=0.85) wins 4-3: δ = 0.571 − 0.850 = −0.279
 * This correctly penalises underperformance even in victory.
 *
 * The signature accepts raw scores rather than a pre-computed PQ to allow
 * this function to enforce the 0–0 guard internally. When both scores are zero,
 * PQ is undefined and no information is gained; returning 0 ensures no rating
 * change is applied for an unplayed or void match.
 *
 * @example
 *   // Equal teams (E = 0.5)
 *   performanceSurplus(4, 0, 0.5) → +0.500
 *   performanceSurplus(4, 3, 0.5) → +0.071
 *   performanceSurplus(4, 4, 0.5) →  0.000
 *   performanceSurplus(3, 4, 0.5) → −0.071
 *   performanceSurplus(0, 4, 0.5) → −0.500
 *   performanceSurplus(0, 0, 0.5) →  0.000  (0–0 guard; no update applied)
 *
 *   // Strong team expected to dominate (E = 0.85)
 *   performanceSurplus(4, 3, 0.85) → −0.279  (won, but underperformed)
 *   performanceSurplus(4, 0, 0.85) → +0.150  (won, outperformed)
 */
export function performanceSurplus(
  teamScore: number,
  opponentScore: number,
  expected: number,
): number {
  const total = teamScore + opponentScore
  if (total === 0) return 0
  return teamScore / total - expected
}
