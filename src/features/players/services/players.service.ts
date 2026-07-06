import { supabase } from '@/infrastructure/supabase/client'
import type { Player, CreatePlayerInput, UpdatePlayerInput } from '../types'

/**
 * Player service.
 *
 * Rules:
 * - No React, no hooks, no side-effects beyond Supabase calls.
 * - Throws `Error` on failure — TanStack Query catches and exposes it.
 * - Returns typed data on success.
 *
 * Delete strategy: archive-only.
 * Players are never hard-deleted. `archive()` sets `archived = true`,
 * preserving history for sessions, matches, and statistics.
 */

async function getAll(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('archived', false)
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

/** Count-only query (no rows fetched) — used by the Dashboard's Players Overview. */
async function getArchivedCount(): Promise<number> {
  const { count, error } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })
    .eq('archived', true)

  if (error) throw new Error(error.message)
  return count ?? 0
}

async function getById(id: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function create(input: CreatePlayerInput): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

async function update(id: string, input: UpdatePlayerInput): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/** Sets `archived = true`. The row is retained; no hard delete is performed. */
async function archive(id: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ archived: true })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export const playersService = {
  getAll,
  getArchivedCount,
  getById,
  create,
  update,
  archive,
} as const
