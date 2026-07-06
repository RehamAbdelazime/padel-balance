/**
 * Player domain types — derived from the approved Database schema.
 *
 * Single source of truth: update src/infrastructure/supabase/types.ts
 * and these types update automatically.
 */
import type { Database } from '@/infrastructure/supabase/types'

type PlayerTable = Database['public']['Tables']['players']

/** Full player row as returned by the database. */
export type Player = PlayerTable['Row']

/** Payload for creating a new player. */
export type CreatePlayerInput = PlayerTable['Insert']

/** Payload for updating an existing player (all fields optional). */
export type UpdatePlayerInput = PlayerTable['Update']

/** Opaque player identifier — prevents cross-entity ID mix-ups. */
export type PlayerId = string & { readonly __brand: unique symbol }
