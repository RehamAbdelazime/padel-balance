import { RATING } from '../constants/rating.constants'

/**
 * Updates the form indicator using a time-decayed exponentially weighted
 * moving average of recent performance surpluses.
 *
 * Continuous time-decay EWMA:
 *   decay = exp(−daysSinceLastMatch × ln(2) / FORM_HALF_LIFE_DAYS)
 *   F_new = decay × F_old + (1 − decay) × surplus
 *
 * The decay factor is derived from the half-life: when daysSinceLastMatch
 * equals FORM_HALF_LIFE_DAYS (30 days), decay = 0.5 exactly, so the old
 * form and the new surplus contribute equally. Older form decays exponentially.
 *
 * Decay table (FORM_HALF_LIFE_DAYS = 30):
 *   0 days  → decay = 1.000  (same session: old form unchanged, no blend)
 *   7 days  → decay = 0.857
 *  14 days  → decay = 0.735
 *  30 days  → decay = 0.500  (half-life: equal blend)
 *  60 days  → decay = 0.250
 *  90 days  → decay = 0.125  (old form contributes ~12.5%)
 *
 * Same-session behaviour (daysSinceLastMatch = 0):
 *   decay = 1, so F_new = F_old. Form does not update within a single session.
 *   Form is a cross-session signal; within-session variance is not modelled here.
 *
 * First-match convention:
 *   The engine should pass FORM_HALF_LIFE_DAYS when a player has no prior
 *   match (lastMatchAt is null), giving decay = 0.5 and F_new = 0.5 × surplus.
 *   This seeds form at half the first-match signal, matching the half-life
 *   convention without over-weighting a single data point.
 *
 * Form range:
 *   F is unbounded in theory but practically stays in [−0.5, +0.5] because
 *   surplus is bounded to [−1, +1] and decays toward zero without reinforcement.
 *
 * @param currentForm        The player's form value before this match.
 * @param surplus            Performance surplus (δ = PQ − E) from this match.
 * @param daysSinceLastMatch Days since the player's previous match (≥ 0).
 *
 * @example
 *   updateForm(0.0, 0.3, 30)  → 0.150  (first match, engine passes half-life)
 *   updateForm(0.15, 0.3, 30) → 0.225  (second match, one month later)
 *   updateForm(0.2,  0.1,  7) → 0.185  (recent win, modest surplus)
 *   updateForm(0.2, -0.5, 60) → 0.175  (cold result after 2 months)
 *   updateForm(0.2,  0.3,  0) → 0.200  (same session: form unchanged)
 */
export function updateForm(
  currentForm: number,
  surplus: number,
  daysSinceLastMatch: number,
): number {
  const decay = Math.exp(-daysSinceLastMatch * Math.LN2 / RATING.FORM_HALF_LIFE_DAYS)
  return decay * currentForm + (1 - decay) * surplus
}

/**
 * Computes the form-adjusted conservative rating used as the generator's
 * final composite input.
 *
 *   r̃ᵢ = conservativeRating + FORM_WEIGHT × form × RATING_SCALE
 *
 * The conservative rating captures long-run skill and uncertainty.
 * The form term adds a small short-run adjustment: a player on a hot streak
 * is treated as slightly stronger than their conservative rating suggests.
 *
 * Contribution scale (FORM_WEIGHT = 0.15, RATING_SCALE = 400):
 *   form = +0.20 → adjustment = +0.15 × 0.20 × 400 = +12  points
 *   form = −0.20 → adjustment = −12 points
 *   form = +0.50 → adjustment = +30 points  (near-maximum hot streak)
 *   form = −0.50 → adjustment = −30 points
 *
 * The maximum form adjustment (±30 points at extreme form) is intentionally
 * small relative to typical rating gaps (hundreds of points), ensuring that
 * form is a tiebreaker, not an overriding signal.
 *
 * @example
 *   formAdjustedRating(700,  0.20) →  712   (hot streak, +12 adjustment)
 *   formAdjustedRating(700, −0.20) →  688   (cold streak, −12 adjustment)
 *   formAdjustedRating(700,  0.00) →  700   (neutral form, no change)
 *   formAdjustedRating(250,  0.50) →  280   (new player hot streak, +30)
 */
export function formAdjustedRating(conservativeRating: number, form: number): number {
  return conservativeRating + RATING.FORM_WEIGHT * form * RATING.RATING_SCALE
}
