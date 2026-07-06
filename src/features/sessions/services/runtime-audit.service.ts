import { supabase } from '@/infrastructure/supabase/client'
import type { RuntimeEventTypeRow } from '@/infrastructure/supabase/types'

/**
 * runtime-audit.service — append-only log of runtime player-management
 * actions (session_runtime_events, migration 010). Feeds future Reports;
 * no UI reads this yet.
 */

export type RuntimeEventType = RuntimeEventTypeRow

export type RuntimeEvent = {
  readonly id:               string
  readonly eventType:        RuntimeEventType
  /** null for session/round/match-level events with no single "actor" player. */
  readonly playerId:         string | null
  readonly relatedPlayerId:  string | null
  readonly roundNumber:      number | null
  readonly message:          string
  readonly createdAt:        string
}

async function logEvent(
  sessionId: string,
  eventType: RuntimeEventType,
  playerId: string | null,
  message: string,
  options: { relatedPlayerId?: string; roundNumber?: number } = {},
): Promise<void> {
  const { error } = await supabase.from('session_runtime_events').insert({
    session_id:        sessionId,
    event_type:        eventType,
    player_id:         playerId,
    related_player_id: options.relatedPlayerId ?? null,
    round_number:       options.roundNumber ?? null,
    message,
  })
  if (error) throw new Error(error.message)
}

async function getEvents(sessionId: string): Promise<RuntimeEvent[]> {
  const { data, error } = await supabase
    .from('session_runtime_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data.map(row => ({
    id:              row.id,
    eventType:       row.event_type,
    playerId:        row.player_id,
    relatedPlayerId: row.related_player_id,
    roundNumber:     row.round_number,
    message:         row.message,
    createdAt:       row.created_at,
  }))
}

export const runtimeAuditService = {
  logEvent,
  getEvents,
} as const
