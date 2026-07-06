import { useEffect, useRef } from 'react'
import { shouldAutoStartSession } from '../utils'
import { useStartSessionMutation } from './useSessions'
import type { Session } from '../types'

/**
 * Automatically transitions a PLANNING session to LIVE once its scheduled
 * date + start time is reached. Runs once per mount per session id — after
 * a successful transition `session.status` is no longer 'PLANNING', so
 * `shouldAutoStartSession` naturally returns false on every subsequent
 * check (including after a page reload, since status is persisted).
 *
 * `onAutoStart` calls the same `scheduleHook.startMatches(courtCount)` the
 * manual "Start Session" button makes — this only marks the session
 * started (logs the SESSION_STARTED event); it does not activate any
 * match. Every match stays PENDING until the organiser explicitly presses
 * Start Match (see match-runtime.service's startMatch) — that is
 * intentional (Critical Runtime Review), not a gap to fill here.
 */
export function useAutoStartSession(session: Session | undefined, onAutoStart: () => void): void {
  const startMutation = useStartSessionMutation()
  const firedForId = useRef<string | null>(null)

  useEffect(() => {
    if (!session) return
    if (firedForId.current === session.id) return
    if (!shouldAutoStartSession(session)) return

    firedForId.current = session.id
    startMutation.mutate(session.id)
    onAutoStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])
}
