import type { PlannedMatch, SessionAttendee, PlayerRuntimeState } from '../types'

/**
 * Groups the flat, sequentially-generated match list into concurrent
 * rounds — the shared structure both Planning and the future Live Runtime
 * read, so this grouping is defined once and never duplicated.
 *
 * Purely presentational: does not read/write PlannedMatch.courtNumber,
 * does not reorder or mutate matches, does not change generation.
 */

export type RoundSlot = {
  /** 1-based, presentation only — position within the round. */
  readonly courtNumber: number
  /** 0-based position in the original, unmodified schedule.matches array. */
  readonly matchIndex:  number
  readonly match:        PlannedMatch
}

export type ScheduleRound = {
  /** 1-based. */
  readonly roundNumber: number
  readonly slots:        ReadonlyArray<RoundSlot>
}

/**
 * Chunks `matches` into rounds of `courtCount` concurrent matches each.
 *
 * Defensively falls back to 1 court when `courtCount` isn't a valid
 * positive number (e.g. undefined at runtime because the session's
 * court_count hasn't been persisted yet) — otherwise `Math.max(1, NaN)`
 * evaluates to `NaN`, which silently produces a single round with zero
 * slots and makes every already-generated match disappear from view.
 */
export function groupMatchesIntoRounds(
  matches: readonly PlannedMatch[],
  courtCount: number,
): ScheduleRound[] {
  const perRound = Number.isFinite(courtCount) && courtCount > 0 ? Math.floor(courtCount) : 1
  const rounds: ScheduleRound[] = []

  for (let start = 0; start < matches.length; start += perRound) {
    const slots: RoundSlot[] = []
    for (let offset = 0; offset < perRound && start + offset < matches.length; offset++) {
      const match = matches[start + offset]
      if (match) {
        slots.push({ courtNumber: offset + 1, matchIndex: start + offset, match })
      }
    }
    rounds.push({ roundNumber: rounds.length + 1, slots })
  }

  return rounds
}

/**
 * Standby = currently AVAILABLE players minus the union of every player
 * across every court in this round — never a single match, never the full
 * attendance list. A player who is RESTING/ABSENT/LEFT/REPLACED is not
 * "standby": they are simply not part of this session's active rotation, so
 * they are excluded from both the round AND the standby list.
 *
 * `playerStates` is optional for backward compatibility (e.g. contexts with
 * no runtime state, such as the export printout before a session goes
 * LIVE) — when omitted, every attendee is treated as AVAILABLE, matching
 * the original Planning-phase behaviour exactly.
 */
export function standbyForRound(
  attendees: readonly SessionAttendee[],
  round: ScheduleRound,
  playerStates?: ReadonlyMap<string, PlayerRuntimeState>,
): SessionAttendee[] {
  const playing = new Set<string>()
  for (const slot of round.slots) {
    playing.add(slot.match.teamA[0]); playing.add(slot.match.teamA[1])
    playing.add(slot.match.teamB[0]); playing.add(slot.match.teamB[1])
  }
  return attendees.filter(a => {
    if (playing.has(a.player_id)) return false
    const status = playerStates?.get(a.player_id)?.status ?? 'AVAILABLE'
    return status === 'AVAILABLE'
  })
}

export type RoundStatus = 'PENDING' | 'LIVE' | 'FINISHED' | 'CANCELLED'

/**
 * A round's status is never stored — it is always derived from its
 * matches' own matchStatus, so there is exactly one source of truth (the
 * matches themselves) and no possibility of the two disagreeing.
 *
 *   CANCELLED — every match in the round is CANCELLED
 *   FINISHED  — every match is FINISHED or CANCELLED, with at least one FINISHED
 *   LIVE      — at least one match in the round is LIVE
 *   PENDING   — otherwise (no match has started yet)
 */
export function deriveRoundStatus(round: ScheduleRound): RoundStatus {
  const statuses = round.slots.map(s => s.match.matchStatus)
  if (statuses.length === 0) return 'PENDING'
  if (statuses.every(s => s === 'CANCELLED')) return 'CANCELLED'
  if (statuses.every(s => s === 'FINISHED' || s === 'CANCELLED')) return 'FINISHED'
  if (statuses.some(s => s === 'LIVE')) return 'LIVE'
  return 'PENDING'
}
