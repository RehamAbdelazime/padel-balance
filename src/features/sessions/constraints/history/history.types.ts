/**
 * Scheduling History Engine — supporting types.
 *
 * SchedulingHistory is a precomputed, immutable snapshot of everything a
 * constraint could want to know about prior rounds. It is built once (see
 * history.builder.ts) via a single traversal; every lookup in
 * history.queries.ts is then O(1). Constraints must never walk
 * `priorRounds` themselves.
 */

import type { PlayerId } from '../constraint.types'

/** Order-independent key for a pair of player ids: always `min::max`. */
export type PairKey = string

export type SchedulingHistory = {
  /** pairKey -> number of times this pair has been on the same team. */
  readonly partnerCounts:  ReadonlyMap<PairKey, number>
  /** pairKey -> number of times this pair has faced each other as opponents. */
  readonly opponentCounts: ReadonlyMap<PairKey, number>
  /** playerId -> total matches played (rounds in which they were on a court). */
  readonly matchesPlayed:  ReadonlyMap<PlayerId, number>
  /** playerId -> total rounds this player sat out. */
  readonly restCounts:     ReadonlyMap<PlayerId, number>
  /** playerId -> (courtNumber -> times played on that court). */
  readonly courtCounts:    ReadonlyMap<PlayerId, ReadonlyMap<number, number>>
  /** playerId -> every distinct player who has ever partnered them. */
  readonly partnersOf:     ReadonlyMap<PlayerId, ReadonlySet<PlayerId>>
  /** playerId -> every distinct player who has ever opposed them. */
  readonly opponentsOf:    ReadonlyMap<PlayerId, ReadonlySet<PlayerId>>
}
