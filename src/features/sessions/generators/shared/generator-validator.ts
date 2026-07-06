/**
 * Generator Validator — the one shared, format-agnostic validity check for a
 * fully-generated schedule (Sprint G1, Step 7).
 *
 * `validateRound` (round.ts) already proves a single round is internally
 * correct (no duplicated player, no duplicated court, every match has 4
 * distinct players). This module adds the checks that only make sense once
 * every round is known: no duplicate match id across the whole schedule, and
 * no round assigning a player who isn't actually part of this session's
 * attendance (an impossible state that would indicate a generator bug, not a
 * legitimate insufficient-players case — that path already returns
 * `insufficient-players` before ever reaching this check).
 *
 * Used identically by every format (Custom, Americano, and any future
 * format) — nothing here is format-specific, and nothing here changes
 * generation itself; it is a defensive final check callers may run over a
 * completed schedule.
 *
 * `playerStates`, when supplied, additionally validates "standby list
 * correct": a player whose runtime status isn't AVAILABLE (RESTING, ABSENT,
 * LEFT, REPLACED) must never appear inside a round's matches — if they do,
 * the standby list derived from that round (see standbyForRound) would be
 * wrong (Sprint G1 Step 4/10).
 */

import type { PlannedMatch, PlayerRuntimeState } from '../../types'
import { groupMatchesIntoRounds, isPreserved } from '../../utils'
import { validateRound } from './round'

export type ScheduleValidation = { readonly valid: boolean; readonly reasons: readonly string[] }

export function validateSchedule(
  matches: readonly PlannedMatch[],
  playerIds: readonly string[],
  courtCount: number,
  playerStates?: ReadonlyMap<string, PlayerRuntimeState>,
): ScheduleValidation {
  const reasons: string[] = []
  const knownPlayerIds = new Set(playerIds)

  const matchIds = matches.map(m => m.id)
  if (new Set(matchIds).size !== matchIds.length) {
    reasons.push('Duplicate match id across the schedule.')
  }

  const rounds = groupMatchesIntoRounds(matches, courtCount)
  for (const round of rounds) {
    const roundMatches = round.slots.map(s => s.match)

    const roundValidation = validateRound(roundMatches, round.slots.length)
    if (!roundValidation.valid) {
      reasons.push(...roundValidation.reasons.map(r => `Round ${round.roundNumber}: ${r}`))
    }

    for (const m of roundMatches) {
      for (const id of [...m.teamA, ...m.teamB]) {
        if (!knownPlayerIds.has(id)) {
          reasons.push(`Round ${round.roundNumber}: player ${id} is not part of this session's attendance.`)
        }

        // Preserved matches (locked/manual/completed/cancelled) are exempt:
        // a player's runtime status can legitimately change (e.g. LEFT) after
        // their match already happened, without that retroactively meaning
        // the historical match was wrong.
        const status = isPreserved(m) ? undefined : playerStates?.get(id)?.status
        if (status && status !== 'AVAILABLE') {
          reasons.push(
            `Round ${round.roundNumber}: player ${id} has status ${status} but is assigned to a match — standby list would be incorrect.`,
          )
        }
      }
    }
  }

  return { valid: reasons.length === 0, reasons }
}

/**
 * Verifies every preserved match (LOCKED, MANUAL, completed, or CANCELLED —
 * see `isPreserved`) from `previousMatches` reappears in `newMatches`
 * unchanged: same id, same teams, same court. Run after regeneration, since
 * `validateSchedule` alone can't tell "changed" from "freshly generated" —
 * it only sees the final result (Sprint G1 Step 4/11).
 */
export function validatePreservation(
  previousMatches: readonly PlannedMatch[],
  newMatches: readonly PlannedMatch[],
): ScheduleValidation {
  const reasons: string[] = []
  const byId = new Map(newMatches.map(m => [m.id, m]))

  for (const prev of previousMatches) {
    if (!isPreserved(prev)) continue

    const next = byId.get(prev.id)
    if (!next) {
      reasons.push(`Preserved match ${prev.id} is missing from the regenerated schedule.`)
      continue
    }

    const unchanged =
      next.courtNumber === prev.courtNumber &&
      next.teamA[0] === prev.teamA[0] && next.teamA[1] === prev.teamA[1] &&
      next.teamB[0] === prev.teamB[0] && next.teamB[1] === prev.teamB[1]

    if (!unchanged) {
      reasons.push(`Preserved match ${prev.id} was modified during regeneration.`)
    }
  }

  return { valid: reasons.length === 0, reasons }
}
