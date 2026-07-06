/**
 * Computes the contribution weight for a player relative to their partner.
 *
 *   wᵢ = μᵢ / (μᵢ + μ_partner)
 *
 * This weight partitions the team's performance surplus between the two players
 * in proportion to their estimated skill. A player does not receive full credit
 * for a win because they had a stronger teammate, and is not fully blamed for a
 * loss because they had a weaker one.
 *
 * Mathematical properties:
 *   - Partition: wᵢ + w_partner = 1  (responsibility is fully allocated)
 *   - Symmetry:  wᵢ = 0.5 when μᵢ = μ_partner  (equal credit for equal players)
 *   - Shielding: wᵢ → 0 as μᵢ ≪ μ_partner  (weak player protected from over-inflation)
 *   - Dominance: wᵢ → 1 as μᵢ ≫ μ_partner  (strong player absorbs most credit/blame)
 *
 * Bootstrap dependency: the weight uses current μ estimates, which are imperfect
 * early in a player's history. This is self-correcting — as estimates converge
 * to true skill, the weights become accurate. Early-game deviation is small
 * because all new players enter at INITIAL_MU = 1000, keeping the initial
 * weight near 0.5 for all pairings until meaningful differentiation develops.
 *
 * Non-positive guard:
 *   If either μ goes negative (requires ~125 consecutive maximum-surplus losses
 *   from INITIAL_MU = 1000 — near-impossible in practice), the raw formula
 *   produces a negative weight, breaking the partition property. Both inputs
 *   are clamped to max(μ, 0) before division:
 *   - Negative-μ player receives weight 0 (no credit or blame)
 *   - Positive partner absorbs full responsibility
 *   - Both negative → total = 0 → falls through to the 0.5 guard
 *
 * @example
 *   partnerWeight(1000, 1000) → 0.5    (equal players, equal credit)
 *   partnerWeight( 800, 1200) → 0.4    (weaker player, 40% of credit/blame)
 *   partnerWeight(1200,  800) → 0.6    (stronger player, 60% of credit/blame)
 *   partnerWeight(1400,  600) → 0.7
 *   partnerWeight( 600, 1400) → 0.3
 *   partnerWeight(−100, 1200) → 0.0    (negative μ: clamped, partner takes all)
 *   partnerWeight(   0,    0) → 0.5    (both-zero guard)
 */
export function partnerWeight(playerMu: number, partnerMu: number): number {
  const clampedPlayer  = Math.max(playerMu, 0)
  const clampedPartner = Math.max(partnerMu, 0)
  const total = clampedPlayer + clampedPartner
  if (total === 0) return 0.5
  return clampedPlayer / total
}
