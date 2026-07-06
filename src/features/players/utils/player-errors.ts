/**
 * Maps raw Supabase/Postgrest errors from player CRUD mutations to
 * user-friendly wording (Sprint R1). `players.name`/`players.phone` have
 * real CHECK constraints (migration 001) — hitting them gets a precise
 * message rather than falling back to the generic default.
 */

import { isNetworkFailure, NETWORK_ERROR_MESSAGE } from '@/shared/lib/network-error'

export function friendlyPlayerErrorMessage(rawMessage: string, fallback: string): string {
  if (isNetworkFailure(rawMessage)) return NETWORK_ERROR_MESSAGE
  if (/players_name_check/i.test(rawMessage)) {
    return 'Player name must be between 2 and 100 characters.'
  }
  if (/players_phone_check/i.test(rawMessage)) {
    return 'Phone number is too long.'
  }
  return fallback
}
