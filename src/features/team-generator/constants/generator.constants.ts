/**
 * Team-generator constants — single source of truth for structural invariants.
 *
 * Padel is strictly 2v2, so every value here is a structural fact about the
 * game, not a tunable calibration knob. The team-generator no longer scores
 * or ranks candidates, so no weight/threshold constants exist here.
 */
export const GENERATOR = {
  /** Minimum pool size required to produce a match. */
  MIN_PLAYERS: 4,

  /** Total players consumed per match (2 teams × 2 players). */
  PLAYERS_PER_MATCH: 4,

  /** Players per team — padel is always 2v2. */
  PLAYERS_PER_TEAM: 2,
} as const

export type GeneratorConstants = typeof GENERATOR
