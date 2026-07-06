import { enumerateCandidates } from '../math/enumerate'
import { satisfiesConstraints } from '../math/constraints'
import type { GeneratorPlayer, GeneratorConfig, GeneratorResult } from '../types/generator'

// ── Input validation (private) ────────────────────────────────────────────────

/**
 * Validates the player pool before the pipeline starts.
 *
 * Rejects duplicate player IDs (would produce nonsensical team assignments).
 * Player count validation is delegated to enumerateCandidates(), which
 * provides the canonical error message for wrong counts.
 */
function validatePlayers(players: GeneratorPlayer[]): void {
  const seen = new Set<string>()
  const dupes: string[] = []
  for (const p of players) {
    if (seen.has(p.id)) dupes.push(p.id)
    else seen.add(p.id)
  }
  if (dupes.length > 0) {
    throw new Error(
      `generateTeams: duplicate player ID(s) detected: [${dupes.join(', ')}]. ` +
        `Each player must appear exactly once.`,
    )
  }
}

// ── Public service ────────────────────────────────────────────────────────────

/**
 * Enumerates every valid 2v2 team split from a pool of players.
 *
 * This is a pure enumerator: it never inspects player skill, never ranks
 * candidates, and never decides which split is "best". It only produces the
 * set of candidates that satisfy the active constraints (currently: no
 * duplicate players, no recent-partner repeat). Choosing among the returned
 * candidates is entirely the calling tournament generator's responsibility.
 *
 * Pipeline:
 *   1. validatePlayers        — reject duplicate IDs early
 *   2. enumerateCandidates    — all distinct splits (3 for 4 players)
 *   3. satisfiesConstraints   — filter to valid candidates only
 *   4. return GeneratorResult
 *
 * @param players Exactly GENERATOR.MIN_PLAYERS (4) players are required.
 *   IDs must be unique.
 * @param config  Optional constraint overrides; defaults to an empty config
 *   (all constraints inactive except the duplicate-player guard).
 *
 * @throws {Error} on duplicate player IDs.
 * @throws {Error} propagated from enumerateCandidates if the player count is wrong.
 * @throws {Error} if every candidate is rejected by satisfiesConstraints().
 */
export function generateTeams(
  players: GeneratorPlayer[],
  config: GeneratorConfig = {},
): GeneratorResult {
  validatePlayers(players)

  // Throws a descriptive Error if players.length !== GENERATOR.PLAYERS_PER_MATCH.
  const candidates = enumerateCandidates(players)

  const valid = candidates.filter(candidate => satisfiesConstraints(candidate, config))

  if (valid.length === 0) {
    throw new Error(
      `generateTeams: all ${candidates.length} candidate(s) were rejected by ` +
        `satisfiesConstraints(). Loosen GeneratorConfig constraints or add more players.`,
    )
  }

  return { candidates: valid }
}
