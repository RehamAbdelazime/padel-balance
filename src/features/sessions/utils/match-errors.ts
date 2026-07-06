/**
 * Maps raw Supabase/Postgrest errors from match recording/score-editing
 * mutations to organiser-friendly wording (Sprint R1).
 */

import { isNetworkFailure, NETWORK_ERROR_MESSAGE } from '@/shared/lib/network-error'

export function friendlyMatchErrorMessage(rawMessage: string, fallback: string): string {
  if (isNetworkFailure(rawMessage)) return NETWORK_ERROR_MESSAGE
  return fallback
}
