/**
 * Detects a lost/failed network request from a raw error message, so every
 * feature's friendly-error mapper can special-case it identically instead of
 * each re-implementing the same regex (Sprint R1).
 */
export function isNetworkFailure(message: string): boolean {
  return /failed to fetch|networkerror|load failed|ECONNREFUSED|network request failed/i.test(message)
}

export const NETWORK_ERROR_MESSAGE =
  'Network connection lost. Please check your connection and try again.'
