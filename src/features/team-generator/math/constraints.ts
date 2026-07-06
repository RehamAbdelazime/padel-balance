import type { GeneratorCandidate, GeneratorConfig } from '../types/generator'

/**
 * Produces a canonical pair key for two player IDs.
 *
 * IDs are sorted lexicographically before joining so the key is the same
 * regardless of argument order: pairKey('A','B') === pairKey('B','A').
 * Format: "{lower}|{higher}"
 *
 * Callers use this to build the GeneratorConfig.recentPartners Set:
 *   const recent = new Set([pairKey(ahmed.id, duaa.id)])
 *
 * The constraint function uses the same helper internally, so the encoding
 * is guaranteed to match — no separate canonicalization logic anywhere.
 */
export function pairKey(idA: string, idB: string): string {
  return idA <= idB ? `${idA}|${idB}` : `${idB}|${idA}`
}

/**
 * Returns true if the candidate satisfies ALL active constraints.
 * Returns false (reject) on the first failed constraint.
 *
 * Constraint evaluation is short-circuit: once one constraint fails, the
 * remaining checks are skipped.
 *   1. Duplicate player guard (O(1) set check, defensive)
 *   2. Partner cooldown (two Set.has calls)
 *
 * @param candidate The split being tested.
 * @param config    Active constraint configuration. All constraint fields
 *                  are optional; undefined means "constraint inactive".
 */
export function satisfiesConstraints(
  candidate: GeneratorCandidate,
  config: GeneratorConfig,
): boolean {
  const { teamA, teamB } = candidate

  // ── Constraint 1: Duplicate player guard (defensive) ──────────────────────
  // After validatePlayers() this cannot happen, but a malformed candidate
  // constructed outside the normal pipeline would otherwise silently produce
  // a nonsensical team assignment.
  const ids = [teamA.player1.id, teamA.player2.id, teamB.player1.id, teamB.player2.id]
  if (new Set(ids).size !== ids.length) return false

  // ── Constraint 2: Partner cooldown ────────────────────────────────────────
  // Reject if either team's partner pair appeared in a recent session.
  // Opponent pairs (cross-team) are not subject to this constraint.
  if (config.recentPartners !== undefined) {
    if (config.recentPartners.has(pairKey(teamA.player1.id, teamA.player2.id))) return false
    if (config.recentPartners.has(pairKey(teamB.player1.id, teamB.player2.id))) return false
  }

  return true
}
