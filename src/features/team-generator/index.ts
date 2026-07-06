/**
 * Team-generator feature — public API.
 *
 * All consumers import exclusively from this barrel.
 * Internal modules (math/*, types/*, constants/*) are not imported directly.
 *
 * The team-generator is a pure enumerator: it produces every valid 2v2 team
 * split for a pool of players and never inspects player skill/rating, never
 * scores candidates, and never picks a "best" one. Choosing among candidates
 * is the calling tournament generator's responsibility (see sessions/generators).
 *
 * Typical consumer usage:
 *   import { generateTeams } from '@/features/team-generator'
 *   import type { GeneratorPlayer, GeneratorResult } from '@/features/team-generator'
 */

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  GeneratorPlayer,
  GeneratorTeam,
  GeneratorCandidate,
  GeneratorConfig,
  GeneratorResult,
} from './types/generator'

// ── Constants ──────────────────────────────────────────────────────────────────
export { GENERATOR } from './constants/generator.constants'
export type { GeneratorConstants } from './constants/generator.constants'

// ── Math — enumeration ─────────────────────────────────────────────────────────
export { enumerateCandidates } from './math/enumerate'

// ── Math — constraints ─────────────────────────────────────────────────────────
export { pairKey, satisfiesConstraints } from './math/constraints'

// ── Service ────────────────────────────────────────────────────────────────────
export { generateTeams } from './services/generator.service'
