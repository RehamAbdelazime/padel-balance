import type { Session } from '../types'

/**
 * Whether a PLANNING session's scheduled date+time has been reached and it
 * should auto-transition to LIVE. Pure — the caller is responsible for
 * actually persisting the transition (and thus for it happening only once:
 * once `status` moves away from 'PLANNING' this always returns false).
 */
export function shouldAutoStartSession(
  session: Pick<Session, 'status' | 'scheduled_at'>,
  now: Date = new Date(),
): boolean {
  if (session.status !== 'PLANNING') return false

  const scheduledAt = new Date(session.scheduled_at)
  if (Number.isNaN(scheduledAt.getTime())) return false

  return now >= scheduledAt
}
