/**
 * Rating engine domain types.
 *
 * These are pure mathematical types — no Supabase, no React, no persistence
 * concerns. Every field is readonly; the engine produces new state rather than
 * mutating existing state.
 *
 * Data flow:
 *   RatingState × 4 + scores → RatingMatch → processMatch → RatingEngineResult
 *   → apply RatingUpdate × 4 → new RatingState × 4
 */

/**
 * The complete rating state for a single player at a point in time.
 *
 * P_i = (mu_i, sigma_i, n_i, F_i, t_i)
 */
export type RatingState = {
  /** Skill mean — best current estimate of true skill. */
  readonly mu: number
  /** Skill uncertainty — standard deviation of the skill estimate. */
  readonly sigma: number
  /** Lifetime match count. Drives K-factor deceleration and provisional status. */
  readonly n: number
  /** Exponentially-weighted recent performance surplus (form indicator). */
  readonly form: number
  /** Timestamp of the most recent recorded match. Null for new players. */
  readonly lastMatchAt: Date | null
}

/**
 * One side of a 2v2 padel match — two players and their final score.
 */
export type RatingTeam = {
  readonly player1: RatingState
  readonly player2: RatingState
  readonly score: number
}

/**
 * A complete match record ready for processing by the rating engine.
 * The engine receives only the data it needs to derive all updates.
 */
export type RatingMatch = {
  readonly teamA: RatingTeam
  readonly teamB: RatingTeam
  /** When the match was played — used to compute inactivity drift and form decay. */
  readonly playedAt: Date
}

/**
 * The update to apply to a single player after a match.
 * The engine produces deltas rather than final values where meaningful,
 * and final values where the formula produces an absolute result.
 */
export type RatingUpdate = {
  /** Signed change to mu. Positive = improvement; negative = decline. */
  readonly deltaMu: number
  /** Replacement sigma after evidence and inactivity adjustments. */
  readonly nextSigma: number
  /** Replacement form value after EWMA update. */
  readonly nextForm: number
  /** Replacement match count — always the player's previous n + 1. */
  readonly nextN: number
}

/**
 * The complete set of updates produced by processing one match.
 * Position within teamA/teamB mirrors position in the input RatingMatch.
 * The caller is responsible for applying each update to the correct player.
 */
export type RatingEngineResult = {
  readonly teamA: {
    readonly player1: RatingUpdate
    readonly player2: RatingUpdate
  }
  readonly teamB: {
    readonly player1: RatingUpdate
    readonly player2: RatingUpdate
  }
}
