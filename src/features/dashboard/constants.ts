/** How many upcoming/recent sessions the Dashboard shows before "see all". */
export const UPCOMING_SESSIONS_LIMIT = 5
export const RECENT_SESSIONS_LIMIT = 5

/**
 * Displayed in the System Health card. Kept in sync with package.json's
 * `version` field by hand — importing package.json directly would require
 * enabling `resolveJsonModule` project-wide for one subtle, rarely-changing
 * display value.
 */
export const APP_VERSION = '0.0.0'
