import { supabase } from '@/infrastructure/supabase/client'
import type { Session, CreateSessionInput, UpdateSessionInput } from '../types'

/**
 * Sessions service.
 * Archive-only strategy: sessions are never hard-deleted.
 */

async function getAll(): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('archived', false)
    .order('scheduled_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

async function getById(id: string): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function create(input: CreateSessionInput): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id: string, input: UpdateSessionInput): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Sets archived = true. The session row and all match history are retained. */
async function archive(id: string): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ archived: true })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ── Lifecycle (Sprint F22) ────────────────────────────────────────────────────

/** PLANNING -> LIVE. Organiser-triggered or auto-start. */
async function startSession(id: string): Promise<Session> {
  return update(id, { status: 'LIVE' })
}

/** LIVE -> FINISHED. Temporary — full live-session teardown is a future sprint. */
async function finishSession(id: string): Promise<Session> {
  return update(id, { status: 'FINISHED' })
}

/** Changes the scheduled date/time while still in PLANNING. Never touches the schedule. */
async function postpone(
  id: string,
  input: { scheduled_at: string },
): Promise<Session> {
  return update(id, input)
}

export const sessionsService = {
  getAll,
  getById,
  create,
  update,
  archive,
  startSession,
  finishSession,
  postpone,
} as const
