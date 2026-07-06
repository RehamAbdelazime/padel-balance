import { GENERATOR } from '../constants/generator.constants'
import type { GeneratorPlayer, GeneratorCandidate } from '../types/generator'

/**
 * Enumerates all distinct 2v2 team splits from a pool of exactly 4 players.
 *
 * Given players [p0, p1, p2, p3] (in input order), produces exactly 3
 * candidates corresponding to the three ways to partition four elements into
 * two unordered pairs:
 *
 *   Split 0 — teamA: {p0, p1}  teamB: {p2, p3}   (AB vs CD)
 *   Split 1 — teamA: {p0, p2}  teamB: {p1, p3}   (AC vs BD)
 *   Split 2 — teamA: {p0, p3}  teamB: {p1, p2}   (AD vs BC)
 *
 * Canonicalization:
 *   p0 is always assigned to teamA.player1. This anchors the enumeration and
 *   ensures each unordered split appears exactly once — (AB vs CD) and its
 *   mirror (CD vs AB) are the same match; only one is generated.
 *
 *   Within each team, the lower-index player is always player1, the
 *   higher-index player is always player2. This preserves input order
 *   throughout the pipeline without any sorting by rating or identity.
 *
 * Complexity: O(1) time and space — exactly 3 candidates are constructed
 * regardless of player ratings, identities, or any other data.
 *
 * Determinism: no randomness, no sorting by external attributes. Given
 * identical inputs the output is always identical in value and order.
 *
 * @throws {Error} if players.length !== GENERATOR.PLAYERS_PER_MATCH (4).
 */
export function enumerateCandidates(
  players: GeneratorPlayer[],
): GeneratorCandidate[] {
  if (players.length !== GENERATOR.PLAYERS_PER_MATCH) {
    throw new Error(
      `enumerateCandidates requires exactly ${GENERATOR.PLAYERS_PER_MATCH} players, ` +
        `received ${players.length}.`,
    )
  }

  // Non-null assertions are safe: length === 4 validated above.
  const p0 = players[0]!
  const p1 = players[1]!
  const p2 = players[2]!
  const p3 = players[3]!

  return [
    // Split 0: AB vs CD
    { teamA: { player1: p0, player2: p1 }, teamB: { player1: p2, player2: p3 } },
    // Split 1: AC vs BD
    { teamA: { player1: p0, player2: p2 }, teamB: { player1: p1, player2: p3 } },
    // Split 2: AD vs BC
    { teamA: { player1: p0, player2: p3 }, teamB: { player1: p1, player2: p2 } },
  ]
}
