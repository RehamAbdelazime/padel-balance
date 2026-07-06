/**
 * A player as seen by the generator: identity only.
 * The generator never reads rating, skill, or any strength signal — it only
 * enumerates valid team splits from a set of player IDs.
 */
export type GeneratorPlayer = {
  readonly id: string
}

/** Two players assigned to one side of a 2v2 match. */
export type GeneratorTeam = {
  readonly player1: GeneratorPlayer
  readonly player2: GeneratorPlayer
}

/**
 * One candidate match split: a specific assignment of players to teams.
 * For 4 players there are exactly 3 distinct GeneratorCandidates.
 * For N > 4 players the pool grows — enumerate.ts handles the combinatorics.
 */
export type GeneratorCandidate = {
  readonly teamA: GeneratorTeam
  readonly teamB: GeneratorTeam
}

/**
 * Generator configuration.
 * All fields are optional; defaults come from GENERATOR constants.
 * Constraint fields are ignored when undefined (constraint is inactive).
 */
export type GeneratorConfig = {
  // ── Constraint: partner cooldown ───────────────────────────────────────────
  /**
   * Set of recent-partner pair keys to avoid re-pairing.
   * Keys are canonical: `pairKey(idA, idB)` — ids sorted lexicographically,
   * joined with `|`. Build using the exported `pairKey()` helper.
   *
   * A candidate is rejected if either team's partner pair exists in this set.
   * Opponent pairs (cross-team) are never checked.
   */
  readonly recentPartners?: ReadonlySet<string>
}

/**
 * The output of generateTeams(): every valid candidate split that survived
 * constraint filtering, in deterministic enumeration order.
 *
 * The team-generator never ranks, scores, or picks a "best" candidate — that
 * decision belongs entirely to the tournament generator calling it (see
 * sessions/generators), which evaluates candidates against its own rules
 * (partner diversity, opponent diversity, equal play count, rest fairness).
 */
export type GeneratorResult = {
  /** All candidates that satisfied every active constraint. Never empty. */
  readonly candidates: readonly GeneratorCandidate[]
}
