/**
 * Rating feature — public API.
 *
 * All consumers import exclusively from this barrel.
 * Internal modules (math/*, repository/*, types/*, constants/*) are
 * not imported directly by application code.
 *
 * For the vast majority of use cases, only these two are needed:
 *   import { ratingService } from '@/features/rating'
 *   import type { RatingState } from '@/features/rating'
 *
 * The math functions and engine are re-exported for tests and tooling;
 * they are not intended for use in React components or hooks.
 */

// ── Primary consumer API ───────────────────────────────────────────────────────
export { RatingService, ratingService } from './services/rating.service'

// ── Types ──────────────────────────────────────────────────────────────────────
export type {
  RatingState,
  RatingMatch,
  RatingTeam,
  RatingUpdate,
  RatingEngineResult,
} from './types/rating'

// ── Constants ──────────────────────────────────────────────────────────────────
export { RATING } from './constants/rating.constants'
export type { RatingConstants } from './constants/rating.constants'

// ── Advanced API (math, engine) — for tests and low-level tooling ──────────────
export { teamStrength, expectedPerformanceQuotient } from './math/expected'
export { performanceQuotient, performanceSurplus } from './math/performance'
export { partnerWeight } from './math/partner'
export {
  adaptiveK,
  nextSigma,
  inflateForInactivity,
  conservativeRating,
} from './math/uncertainty'
export { updateForm, formAdjustedRating } from './math/form'
export { processMatch } from './services/rating-engine'

// RatingRepository is intentionally not exported.
// Consumers access rating data exclusively through ratingService.
