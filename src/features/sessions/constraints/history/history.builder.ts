/**
 * Scheduling History Engine — the single traversal.
 *
 * Walks `priorRounds` exactly once and precomputes every count/lookup a
 * constraint might need. `restCounts` is derived by set-difference against
 * the full player pool seen anywhere in history — a round's `courts` alone
 * are sufficient; `RoundCandidate.assignments` is not required.
 */

import type { RoundCandidate, PlayerId } from '../constraint.types'
import type { SchedulingHistory, PairKey } from './history.types'

/** Order-independent key for a pair of player ids. */
export function pairKey(a: PlayerId, b: PlayerId): PairKey {
  return a < b ? `${a}::${b}` : `${b}::${a}`
}

function increment<K>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function incrementNested(map: Map<PlayerId, Map<number, number>>, playerId: PlayerId, court: number): void {
  const perCourt = map.get(playerId) ?? new Map<number, number>()
  perCourt.set(court, (perCourt.get(court) ?? 0) + 1)
  map.set(playerId, perCourt)
}

function addToSet<K, V>(map: Map<K, Set<V>>, key: K, value: V): void {
  const set = map.get(key)
  if (set) {
    set.add(value)
  } else {
    map.set(key, new Set([value]))
  }
}

/**
 * Builds a complete SchedulingHistory from every prior round. O(rounds ×
 * courts) — the only pass over the schedule any constraint needs.
 *
 * Called exactly once per `solve()` invocation (see constraint.solver.ts),
 * which attaches the result to `ConstraintContext.history` for every
 * constraint to reuse — constraints must never call this themselves
 * (Sprint G1.1 Step 1). No caching lives here: with the single call site
 * building it once and threading it through context, a second cache layer
 * here would just be duplicate machinery for the same guarantee.
 */
export function buildSchedulingHistory(priorRounds: ReadonlyArray<RoundCandidate>): SchedulingHistory {
  const partnerCounts  = new Map<PairKey, number>()
  const opponentCounts = new Map<PairKey, number>()
  const matchesPlayed  = new Map<PlayerId, number>()
  const restCounts     = new Map<PlayerId, number>()
  const courtCounts    = new Map<PlayerId, Map<number, number>>()
  const partnersOf     = new Map<PlayerId, Set<PlayerId>>()
  const opponentsOf    = new Map<PlayerId, Set<PlayerId>>()

  const allPlayers = new Set<PlayerId>()
  for (const round of priorRounds) {
    for (const court of round.courts) {
      for (const id of [...court.teamA, ...court.teamB]) allPlayers.add(id)
    }
  }

  for (const round of priorRounds) {
    const playedThisRound = new Set<PlayerId>()

    for (const court of round.courts) {
      const [a1, a2] = court.teamA
      const [b1, b2] = court.teamB

      for (const id of [a1, a2, b1, b2]) {
        playedThisRound.add(id)
        increment(matchesPlayed, id)
        incrementNested(courtCounts, id, court.courtNumber)
      }

      increment(partnerCounts, pairKey(a1, a2))
      increment(partnerCounts, pairKey(b1, b2))
      addToSet(partnersOf, a1, a2)
      addToSet(partnersOf, a2, a1)
      addToSet(partnersOf, b1, b2)
      addToSet(partnersOf, b2, b1)

      for (const a of [a1, a2]) {
        for (const b of [b1, b2]) {
          increment(opponentCounts, pairKey(a, b))
          addToSet(opponentsOf, a, b)
          addToSet(opponentsOf, b, a)
        }
      }
    }

    for (const id of allPlayers) {
      if (!playedThisRound.has(id)) increment(restCounts, id)
    }
  }

  return {
    partnerCounts,
    opponentCounts,
    matchesPlayed,
    restCounts,
    courtCounts,
    partnersOf,
    opponentsOf,
  }
}
