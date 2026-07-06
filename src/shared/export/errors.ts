/**
 * Friendly error mapping for export/share failures (Sprint E1 Step 9) —
 * mirrors the pattern already established for Supabase errors
 * (see sessions/utils/*-errors.ts): never show a raw exception message,
 * map known cases precisely, fall back to an action-specific default.
 */
export function friendlyExportErrorMessage(rawMessage: string, fallback: string): string {
  if (/clipboard/i.test(rawMessage)) {
    return 'Clipboard is not available on this device or browser.'
  }
  if (/2D canvas context|encode canvas/i.test(rawMessage)) {
    return 'Could not generate the file. Please try again.'
  }
  return fallback
}
