import { RATING } from '../constants/rating.constants'

/**
 * Computes the adaptive K-factor for a player, scaling with current uncertainty.
 *
 *   κᵢ = BASE_K × (σᵢ / INITIAL_SIGMA)
 *
 * Motivation — Kalman-filter principle:
 *   The magnitude of a rating update should be proportional to how much we
 *   still need to learn about the player. When σ is high (little evidence) the
 *   K-factor is large so the rating moves quickly toward truth. As evidence
 *   accumulates and σ falls, the K-factor falls with it, stabilising the estimate.
 *
 * Boundary behaviour:
 *   σ = INITIAL_SIGMA (300) → κ = BASE_K = 32.0   (brand-new player, maximum movement)
 *   σ = MIN_SIGMA    ( 60) → κ = 32 × 60/300 = 6.4  (veteran, minimum movement)
 *
 * The minimum κ is implicitly bounded by MIN_SIGMA because nextSigma() never
 * lets σ fall below that floor.
 *
 * @example
 *   adaptiveK(300) → 32.0   (new player)
 *   adaptiveK(150) → 16.0   (mid-career)
 *   adaptiveK( 60) →  6.4   (veteran floor)
 */
export function adaptiveK(sigma: number): number {
  return RATING.BASE_K * (sigma / RATING.INITIAL_SIGMA)
}

/**
 * Computes sigma after one additional match of evidence has been incorporated.
 *
 *   σ_new = max(MIN_SIGMA, σ − SIGMA_REDUCTION / (1 + n / N_REF))
 *
 * `n` is the updated match count **after** this match (i.e. previous n + 1).
 * The deceleration term (1 + n/N_REF) grows with match count, so each successive
 * match contributes a smaller absolute reduction:
 *
 *   n =  1 → reduction = 20 / (1 + 1/20)  = 19.05   (fast early convergence)
 *   n = 20 → reduction = 20 / (1 + 20/20) = 10.00   (half-speed at N_REF)
 *   n = 40 → reduction = 20 / (1 + 40/20) =  6.67   (one-third speed)
 *   n = 80 → reduction = 20 / (1 + 80/20) =  4.00
 *
 * The MIN_SIGMA floor (60) ensures certainty never reaches an implausible extreme,
 * even after hundreds of matches.
 *
 * @param sigma      Current uncertainty before the match.
 * @param matchCount Post-match total match count (previous n + 1).
 *
 * @example
 *   nextSigma(300, 1)  → 280.95   (≈ 281, as in architecture doc §12)
 *   nextSigma(280, 2)  → 262.22
 *   nextSigma( 65, 50) →  60.00   (clamped at floor)
 */
export function nextSigma(sigma: number, matchCount: number): number {
  const reduction = RATING.SIGMA_REDUCTION / (1 + matchCount / RATING.N_REF)
  return Math.max(RATING.MIN_SIGMA, sigma - reduction)
}

/**
 * Inflates sigma to account for potential skill change during inactivity.
 *
 *   φ = min(1, daysSinceLastMatch / DAYS_PER_YEAR)
 *   σ_new = min(INITIAL_SIGMA, √(σ² + SIGMA_DRIFT² × φ))
 *
 * Rationale:
 *   A player who hasn't competed in months may have improved through training
 *   or declined through inactivity. We cannot know the direction, only that
 *   our last observation is now stale. Widening σ without moving μ is the
 *   correct Bayesian response: preserve the mean estimate, increase uncertainty.
 *
 *   SIGMA_DRIFT = 100 represents the maximum annual uncertainty that can be
 *   attributed to inactivity. φ is capped at 1 so that absence beyond one year
 *   adds no further drift (the player is already treated as nearly unknown).
 *
 *   The result is capped at INITIAL_SIGMA so returning players are never treated
 *   as more uncertain than a brand-new player — that is the maximum prior.
 *
 * This function is called by the engine **before** processing a returning
 * player's first match back, using σ from their last recorded state.
 *
 * @example
 *   inflateForInactivity( 80, 180) → 106.5   (arch doc §6.2: ≈107 at 6 months)
 *   inflateForInactivity( 60, 365) → 116.6   (veteran returns after one year)
 *   inflateForInactivity(300,  30) → 300.00  (capped at INITIAL_SIGMA)
 *   inflateForInactivity( 80,   0) →  80.00  (no drift for zero days)
 */
export function inflateForInactivity(sigma: number, daysSinceLastMatch: number): number {
  const phi = Math.min(1, daysSinceLastMatch / RATING.DAYS_PER_YEAR)
  const inflated = Math.sqrt(sigma ** 2 + RATING.SIGMA_DRIFT ** 2 * phi)
  return Math.min(RATING.INITIAL_SIGMA, inflated)
}

/**
 * Computes the conservative skill estimate used as the generator's primary input.
 *
 *   rᵢ = μᵢ − CONSERVATIVE_FACTOR × σᵢ
 *
 * The conservative estimate is a lower bound on plausible skill that accounts
 * for remaining uncertainty. A player with the same μ but higher σ receives a
 * meaningfully lower conservative estimate, preventing the generator from
 * over-valuing players whose rating is based on sparse evidence.
 *
 * With CONSERVATIVE_FACTOR = 2.5, a player at (μ=1050, σ=140) after ~20 matches
 * has rᵢ = 1050 − 350 = 700 — substantially below their mean estimate.
 * The same player at (μ=1050, σ=60) after many matches has rᵢ = 1050 − 150 = 900.
 * As evidence grows, the conservative estimate converges toward μ.
 *
 * Note: the result can be negative for extreme combinations of low μ and high σ.
 * The generator treats such players with maximum caution, which is correct.
 *
 * @example
 *   conservativeRating(1000, 300) →  250   (brand new player: r = 1000 - 750)
 *   conservativeRating(1050, 140) →  700   (20-match player)
 *   conservativeRating(1050,  60) →  900   (veteran)
 *   conservativeRating( 900, 300) →  150   (new player, below average estimate)
 */
export function conservativeRating(mu: number, sigma: number): number {
  return mu - RATING.CONSERVATIVE_FACTOR * sigma
}
