import type { RatingState } from '../types/rating'
import { RATING } from '../constants/rating.constants'

/**
 * Computes team strength as the arithmetic mean of both players' skill means.
 *
 *   S_{team} = (μ₁ + μ₂) / 2
 *
 * The arithmetic mean is chosen over alternatives because:
 *   - Padel roles are symmetric (no fixed dominant position)
 *   - It preserves zero-sum conservation across the four-player system
 *   - Its constant partial derivative ∂S/∂μᵢ = 0.5 keeps the chain rule
 *     for individual updates trivially clean
 *
 * Geometric or harmonic means would penalise within-team imbalance —
 * a concern addressed by the partner weight function, not here.
 *
 * @example
 *   teamStrength({ mu: 1000, ... }, { mu: 1000, ... }) → 1000
 *   teamStrength({ mu: 800,  ... }, { mu: 1200, ... }) → 1000
 *   teamStrength({ mu: 900,  ... }, { mu: 1100, ... }) → 1000
 */
export function teamStrength(state1: RatingState, state2: RatingState): number {
  return (state1.mu + state2.mu) / 2
}

/**
 * Computes the expected performance quotient E_A for the team with strength A.
 *
 *   E_A = 1 / (1 + 10^((S_B − S_A) / C))
 *
 * where C = RATING.RATING_SCALE (400).
 *
 * This is the Elo expected-value formula extended to continuous outcomes.
 * It represents the fraction of total points Team A is expected to win across
 * all possible scenarios consistent with the two teams' current ratings.
 *
 * Mathematical properties:
 *   - Range: (0, 1) for all finite inputs; never reaches 0 or 1
 *   - Symmetry: E_A + E_B = 1  (complements always sum to 1)
 *   - Baseline: E_A = 0.5 when S_A = S_B  (equal teams)
 *   - Monotone: strictly increasing in (S_A − S_B)
 *   - At C=400, a 400-point gap gives E_A ≈ 0.909 (9:1 expectation ratio)
 *   - Extreme inputs: 10^(±∞) → {∞, 0}, giving E_A ∈ {0, 1} — handled
 *     correctly by JavaScript's arithmetic without special-casing
 *
 * @example
 *   expectedPerformanceQuotient(1000, 1000) → 0.5
 *   expectedPerformanceQuotient(1200, 1000) → 0.760 (stronger team)
 *   expectedPerformanceQuotient( 800, 1000) → 0.240 (weaker team)
 *   expectedPerformanceQuotient(1400, 1000) → 0.909
 */
export function expectedPerformanceQuotient(
  strengthA: number,
  strengthB: number,
): number {
  return 1 / (1 + 10 ** ((strengthB - strengthA) / RATING.RATING_SCALE))
}
