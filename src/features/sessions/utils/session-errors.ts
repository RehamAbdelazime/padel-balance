/**
 * Maps raw Supabase/Postgrest errors from session CRUD + lifecycle mutations
 * to organiser-friendly wording (Sprint R1). Distinct from schedule-errors.ts,
 * which maps generator/algorithm failures, not database errors.
 *
 * `fallback` is the operation-specific default (e.g. "Session could not be
 * created.") — only network failures and known constraint violations are
 * special-cased; anything else falls back to that default rather than ever
 * showing a raw Postgrest message to the organiser.
 */

import { isNetworkFailure, NETWORK_ERROR_MESSAGE } from '@/shared/lib/network-error'

export function friendlySessionErrorMessage(rawMessage: string, fallback: string): string {
  if (isNetworkFailure(rawMessage)) return NETWORK_ERROR_MESSAGE
  if (/sessions_name_check/i.test(rawMessage)) {
    return 'Session name must be between 1 and 100 characters.'
  }
  return fallback
}
