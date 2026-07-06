/**
 * Scheduling History Engine — O(1) lookups.
 *
 * Pure reads against a precomputed SchedulingHistory. No traversal happens
 * here or in any caller — see history.builder.ts for the single pass.
 */

import type { PlayerId } from '../constraint.types'
import type { SchedulingHistory } from './history.types'
import { pairKey } from './history.builder'

export function partnerCount(history: SchedulingHistory, playerA: PlayerId, playerB: PlayerId): number {
  return history.partnerCounts.get(pairKey(playerA, playerB)) ?? 0
}

export function opponentCount(history: SchedulingHistory, playerA: PlayerId, playerB: PlayerId): number {
  return history.opponentCounts.get(pairKey(playerA, playerB)) ?? 0
}

export function matchesPlayed(history: SchedulingHistory, player: PlayerId): number {
  return history.matchesPlayed.get(player) ?? 0
}

export function restCount(history: SchedulingHistory, player: PlayerId): number {
  return history.restCounts.get(player) ?? 0
}

export function courtCount(history: SchedulingHistory, player: PlayerId, court: number): number {
  return history.courtCounts.get(player)?.get(court) ?? 0
}

export function previousPartners(history: SchedulingHistory, player: PlayerId): ReadonlySet<PlayerId> {
  return history.partnersOf.get(player) ?? new Set<PlayerId>()
}

export function previousOpponents(history: SchedulingHistory, player: PlayerId): ReadonlySet<PlayerId> {
  return history.opponentsOf.get(player) ?? new Set<PlayerId>()
}
