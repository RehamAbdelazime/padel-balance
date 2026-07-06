/**
 * Maps raw Supabase/Postgrest errors from attendance mutations to
 * organiser-friendly wording (Sprint R1). `session_players` has a real
 * UNIQUE (session_id, player_id) constraint (migration 002) — adding the
 * same attendee twice hits it directly, so it gets a precise message rather
 * than falling back to the generic default.
 */

import { isNetworkFailure, NETWORK_ERROR_MESSAGE } from '@/shared/lib/network-error'

export function friendlyAttendanceErrorMessage(rawMessage: string, fallback: string): string {
  if (isNetworkFailure(rawMessage)) return NETWORK_ERROR_MESSAGE
  if (/session_players_session_id_player_id_key/i.test(rawMessage) || /duplicate key value/i.test(rawMessage)) {
    return 'This player has already been added to the session.'
  }
  return fallback
}
