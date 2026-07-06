import type { PlannedMatch, SessionSchedule } from '../types'

/**
 * Generic SessionSchedule helpers shared by the schedule service (sync
 * mutation operations) and the tournament generators (generation operations).
 * Pure, synchronous, no algorithm — kept here to avoid duplicating the same
 * logic in both places.
 */

/** Client-side id for a new PlannedMatch. Not a database id. */
export function matchId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Preservation predicate — any regeneration must skip matches where this is true. */
export function isPreserved(match: PlannedMatch): boolean {
  return match.isCompleted
      || match.matchStatus === 'CANCELLED'
      || match.protection === 'LOCKED'
      || match.origin === 'MANUAL'
}

/**
 * Applies a partial update to a SessionSchedule and bumps `version` by
 * exactly one. The only place `version` increments — see SessionSchedule's
 * mutation discipline in `types/schedule.ts`.
 */
export function nextSchedule(
  prev: SessionSchedule,
  updates: Partial<Omit<SessionSchedule, 'version'>>,
): SessionSchedule {
  return { ...prev, ...updates, version: prev.version + 1 }
}
