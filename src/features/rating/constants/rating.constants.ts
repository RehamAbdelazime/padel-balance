/**
 * Rating engine constants — single source of truth for all model parameters.
 *
 * All values are `as const` to guarantee they are narrowed to their literal
 * types throughout the codebase. Change a value here and it propagates
 * everywhere without touching any calculation code.
 *
 * Parameter values come from Sprint 4 architecture document §Complete Parameter Table.
 * Sensitivity column reproduced in comments to guide future calibration.
 */
export const RATING = {
  // ── Player initialisation ──────────────────────────────────────────────────

  /** Prior skill mean for a player with no match history. */
  INITIAL_MU: 1000,

  /** Prior uncertainty for a player with no match history. High = fast early movement. */
  INITIAL_SIGMA: 300,

  /** Uncertainty floor. Even after hundreds of matches, some uncertainty is retained. */
  MIN_SIGMA: 60,

  // ── K-factor and rating scale ──────────────────────────────────────────────

  /**
   * Maximum K-factor, applied at INITIAL_SIGMA.
   * Sensitivity: High — controls the global learning rate.
   */
  BASE_K: 32,

  /**
   * Rating scale constant C.
   * Controls how steeply the expected-value curve responds to rating differences.
   * At C=400, a 400-point gap yields E_A ≈ 0.909.
   * Sensitivity: High — affects match prediction and update magnitudes.
   */
  RATING_SCALE: 400,

  // ── Conservative skill estimate ────────────────────────────────────────────

  /**
   * k_sigma: multiplier for the uncertainty penalty.
   * r_i = mu_i − CONSERVATIVE_FACTOR × sigma_i
   * Sensitivity: High — critical for the fairness of balanced match generation.
   */
  CONSERVATIVE_FACTOR: 2.5,

  // ── Uncertainty convergence ────────────────────────────────────────────────

  /**
   * Maximum per-match sigma reduction applied after one match of evidence.
   * Sensitivity: Medium — controls convergence speed.
   */
  SIGMA_REDUCTION: 20,

  /**
   * Match count at which the per-match sigma reduction halves.
   * After N_REF matches the deceleration takes over, stabilising the estimate.
   * Sensitivity: Medium — controls when convergence decelerates.
   */
  N_REF: 20,

  // ── Inactivity drift ──────────────────────────────────────────────────────

  /**
   * Maximum annual sigma inflation due to inactivity.
   * sigma_new = sqrt(sigma² + SIGMA_DRIFT² × min(1, days / DAYS_PER_YEAR))
   * mu is never changed by inactivity.
   * Sensitivity: Medium — controls how quickly a returning player's estimate widens.
   */
  SIGMA_DRIFT: 100,

  /** Reference year length for inactivity drift calculation. */
  DAYS_PER_YEAR: 365,

  // ── Form (recent performance EWMA) ────────────────────────────────────────

  /**
   * Half-life for form decay in days.
   * A surplus from 30 days ago contributes half as much as one from today.
   * Sensitivity: Medium — controls the form window size.
   */
  FORM_HALF_LIFE_DAYS: 30,

  /**
   * alpha_F: weight of the form signal in the generator's adjusted rating.
   * r̃_i = conservativeRating + FORM_WEIGHT × form × RATING_SCALE
   * Sensitivity: Low — form is a supplementary signal, not the primary input.
   */
  FORM_WEIGHT: 0.15,

  // ── Generator inputs ───────────────────────────────────────────────────────

  /**
   * Lambda: relative weight of the uncertainty-balance term in the generator
   * objective B = |teamStrengthA − teamStrengthB| + lambda × |sigmaA − sigmaB|.
   * Sensitivity: Low — secondary objective, tunes fairness vs. uncertainty balance.
   */
  UNCERTAINTY_BALANCE_WEIGHT: 0.3,

  /**
   * Players with fewer than this many matches are flagged as provisional.
   * Provisional players receive no rating display and are handled conservatively
   * by the generator.
   * Sensitivity: Low — editorial threshold.
   */
  PROVISIONAL_THRESHOLD: 5,
} as const

export type RatingConstants = typeof RATING
