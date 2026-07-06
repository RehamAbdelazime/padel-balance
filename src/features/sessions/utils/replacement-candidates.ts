import type { SessionAttendee, PlayerRuntimeState, PlannedMatch } from '../types'
import { groupMatchesIntoRounds, deriveRoundStatus } from './schedule-rounds'

/**
 * Valid replacement candidates for `outgoingPlayerId` (Sprint RT2 Sections
 * 6 & 13): attending this session, currently AVAILABLE (not resting,
 * absent, left, or already replaced), and not already occupying a court in
 * the current (LIVE, or failing that, next PENDING) round.
 *
 * Single source of truth — used by ReplacePlayerDialog (the organiser's
 * manual Replace Player action) and the Runtime Recovery Dialog (to decide
 * whether "Replace Player" is even a valid option to show).
 */
export function getReplacementCandidates(
  outgoingPlayerId: string,
  attendees: readonly SessionAttendee[],
  playerStates: ReadonlyMap<string, PlayerRuntimeState>,
  matches: readonly PlannedMatch[],
  courtCount: number,
): SessionAttendee[] {
  const rounds = groupMatchesIntoRounds(matches, courtCount)
  const currentRound =
    rounds.find(r => deriveRoundStatus(r) === 'LIVE') ?? rounds.find(r => deriveRoundStatus(r) === 'PENDING')
  const currentRoundPlayerIds = new Set(
    currentRound?.slots.flatMap(s => [...s.match.teamA, ...s.match.teamB]) ?? [],
  )

  return attendees.filter(a => {
    if (a.player_id === outgoingPlayerId) return false
    const status = playerStates.get(a.player_id)?.status ?? 'AVAILABLE'
    if (status !== 'AVAILABLE') return false
    if (currentRoundPlayerIds.has(a.player_id)) return false
    return true
  })
}
