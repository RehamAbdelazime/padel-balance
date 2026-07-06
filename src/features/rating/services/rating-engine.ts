import { RATING } from '../constants/rating.constants'
import { teamStrength, expectedPerformanceQuotient } from '../math/expected'
import { performanceSurplus } from '../math/performance'
import { partnerWeight } from '../math/partner'
import { adaptiveK, nextSigma, inflateForInactivity } from '../math/uncertainty'
import { updateForm } from '../math/form'
import type { RatingMatch, RatingEngineResult, RatingUpdate, RatingState } from '../types/rating'

// ── Internal constants ────────────────────────────────────────────────────────

const MS_PER_DAY = 1000 * 60 * 60 * 24

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Actual elapsed days since a player's last match, used for inactivity drift.
 *
 * Returns 0 when lastMatchAt is null (first-ever match):
 * the player has no prior history, so there is no inactivity period to account for.
 * inflateForInactivity(sigma, 0) correctly returns sigma unchanged.
 */
function inactivityDays(lastMatchAt: Date | null, playedAt: Date): number {
  if (lastMatchAt === null) return 0
  return Math.max(0, (playedAt.getTime() - lastMatchAt.getTime()) / MS_PER_DAY)
}

/**
 * Effective days for the form EWMA — differs from inactivity days in two ways:
 *
 *   1. First-ever match (null): returns FORM_HALF_LIFE_DAYS.
 *      updateForm(0, surplus, FORM_HALF_LIFE_DAYS) gives decay = 0.5,
 *      seeding form at 0.5 × surplus rather than leaving it at zero forever.
 *
 *   2. Same-day match (< 1 day): clamped to 1 day.
 *      Without this, decay = exp(0) = 1 and form would never update within
 *      a single session. At 1 effective day, decay ≈ 0.977 — a small but
 *      non-zero update toward the new surplus on every match.
 */
function formEffectiveDays(lastMatchAt: Date | null, playedAt: Date): number {
  if (lastMatchAt === null) return RATING.FORM_HALF_LIFE_DAYS
  const raw = (playedAt.getTime() - lastMatchAt.getTime()) / MS_PER_DAY
  return Math.max(1, raw)
}

/**
 * Computes the raw (pre-zero-sum-correction) Δμ and the next state values
 * for one player in the context of a processed match.
 *
 * @param state         Player's state entering the match.
 * @param inflSigma     sigma after inactivity inflation (distinct from state.sigma).
 * @param partnerMu     Teammate's current mu, used to compute contribution weight.
 * @param surplus       Team performance surplus (δ = PQ − E) for this player's team.
 * @param fDays         Effective days since last match, for the form update.
 */
function computePlayerUpdate(
  state: RatingState,
  inflSigma: number,
  partnerMu: number,
  surplus: number,
  fDays: number,
): { rawDeltaMu: number; nextSig: number; nextFrm: number; nextN: number } {
  return {
    rawDeltaMu: adaptiveK(inflSigma) * partnerWeight(state.mu, partnerMu) * surplus,
    nextSig: nextSigma(inflSigma, state.n + 1),
    nextFrm: updateForm(state.form, surplus, fDays),
    nextN: state.n + 1,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Processes a single match and returns rating updates for all four players.
 *
 * This is the sole public entry point of the rating engine. All math modules
 * in ../math/ are internal; callers interact only through this function.
 *
 * Processing pipeline:
 *   1.  Compute inactivity days (for σ inflation) and form-effective days per player
 *   2.  Inflate σ by inactivity drift before match evidence is applied
 *   3.  Compute team strengths from current μ values
 *   4.  Compute expected performance quotients (E_A, E_B = 1 − E_A)
 *   5.  Compute actual performance surplus per team (δ = PQ − E)
 *   6.  Compute adaptive K, partner weight, and raw Δμ per player
 *   7.  Apply zero-sum correction: subtract totalRawΔ / 4 from each Δμ
 *   8.  Compute next σ (evidence reduction from inflated σ), next form, next n
 *
 * Zero-sum guarantee:
 *   Adaptive K values differ by player (function of σ). When K values are
 *   unequal across teams, raw Σ Δμ ≠ 0. The correction totalRawΔ / 4
 *   is subtracted from every player's Δμ, distributing the residual equally
 *   and ensuring Σ Δμ = 0 exactly. The correction is zero when all four
 *   players have identical σ (as in Match 1 of the worked example).
 *
 * 0–0 guard:
 *   performanceSurplus() returns 0 when both scores are zero. All Δμ are
 *   then 0 and no state changes are applied — this propagates automatically
 *   without special-casing in the engine.
 *
 * Caller responsibility:
 *   After applying the returned RatingUpdate to each player's RatingState,
 *   the caller must also set lastMatchAt = match.playedAt for all four players.
 *   This field drives inactivity inflation and form effective-days in future calls.
 *
 * Determinism:
 *   Given identical input, the output is always identical. All operations are
 *   pure arithmetic over the input values; no randomness or external state.
 *
 * Chronological ordering:
 *   Matches must be processed in ascending playedAt order. Form calculations
 *   depend on elapsed time since each player's previous match; out-of-order
 *   processing silently corrupts form values.
 */
export function processMatch(match: RatingMatch): RatingEngineResult {
  const { teamA, teamB, playedAt } = match

  // ── 1. Day computations ───────────────────────────────────────────────────
  const iDaysA1 = inactivityDays(teamA.player1.lastMatchAt, playedAt)
  const iDaysA2 = inactivityDays(teamA.player2.lastMatchAt, playedAt)
  const iDaysB1 = inactivityDays(teamB.player1.lastMatchAt, playedAt)
  const iDaysB2 = inactivityDays(teamB.player2.lastMatchAt, playedAt)

  const fDaysA1 = formEffectiveDays(teamA.player1.lastMatchAt, playedAt)
  const fDaysA2 = formEffectiveDays(teamA.player2.lastMatchAt, playedAt)
  const fDaysB1 = formEffectiveDays(teamB.player1.lastMatchAt, playedAt)
  const fDaysB2 = formEffectiveDays(teamB.player2.lastMatchAt, playedAt)

  // ── 2. Inactivity inflation (before match evidence reduces σ) ─────────────
  const sigA1 = inflateForInactivity(teamA.player1.sigma, iDaysA1)
  const sigA2 = inflateForInactivity(teamA.player2.sigma, iDaysA2)
  const sigB1 = inflateForInactivity(teamB.player1.sigma, iDaysB1)
  const sigB2 = inflateForInactivity(teamB.player2.sigma, iDaysB2)

  // ── 3–4. Team strengths and expected performance quotients ────────────────
  const sA = teamStrength(teamA.player1, teamA.player2)
  const sB = teamStrength(teamB.player1, teamB.player2)
  const eA = expectedPerformanceQuotient(sA, sB)
  const eB = 1 - eA  // complement avoids a redundant pow() call

  // ── 5. Performance surplus per team ───────────────────────────────────────
  // surplusB = −surplusA in all non-zero-score cases (verified numerically).
  // Using the symmetric formula rather than negation avoids float asymmetry.
  const surplusA = performanceSurplus(teamA.score, teamB.score, eA)
  const surplusB = performanceSurplus(teamB.score, teamA.score, eB)

  // ── 6. Raw updates ────────────────────────────────────────────────────────
  const rawA1 = computePlayerUpdate(teamA.player1, sigA1, teamA.player2.mu, surplusA, fDaysA1)
  const rawA2 = computePlayerUpdate(teamA.player2, sigA2, teamA.player1.mu, surplusA, fDaysA2)
  const rawB1 = computePlayerUpdate(teamB.player1, sigB1, teamB.player2.mu, surplusB, fDaysB1)
  const rawB2 = computePlayerUpdate(teamB.player2, sigB2, teamB.player1.mu, surplusB, fDaysB2)

  // ── 7. Zero-sum correction ────────────────────────────────────────────────
  const totalRaw =
    rawA1.rawDeltaMu + rawA2.rawDeltaMu + rawB1.rawDeltaMu + rawB2.rawDeltaMu
  const correction = totalRaw / 4

  const finalize = (
    raw: ReturnType<typeof computePlayerUpdate>,
  ): RatingUpdate => ({
    deltaMu:   raw.rawDeltaMu - correction,
    nextSigma: raw.nextSig,
    nextForm:  raw.nextFrm,
    nextN:     raw.nextN,
  })

  // ── 8. Assemble result ────────────────────────────────────────────────────
  return {
    teamA: { player1: finalize(rawA1), player2: finalize(rawA2) },
    teamB: { player1: finalize(rawB1), player2: finalize(rawB2) },
  }
}
