-- ============================================================================
-- Migration: 004_alter_players.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds Multi-Group columns to the existing players table.
--   This migration is intentionally NON-BREAKING.
--   Foreign keys and NOT NULL constraints will be added later.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'player_status'
    ) THEN
        CREATE TYPE public.player_status AS ENUM (
            'ACTIVE',
            'INACTIVE',
            'LEFT',
            'ARCHIVED'
        );
    END IF;
END $$;

ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS group_id uuid;

ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS linked_profile_id uuid;

ALTER TABLE public.players
    ADD COLUMN IF NOT EXISTS status public.player_status;

UPDATE public.players
SET status = 'ACTIVE'
WHERE status IS NULL;

ALTER TABLE public.players
    ALTER COLUMN status SET DEFAULT 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_players_group_id
ON public.players(group_id);

CREATE INDEX IF NOT EXISTS idx_players_linked_profile
ON public.players(linked_profile_id);

CREATE INDEX IF NOT EXISTS idx_players_status
ON public.players(status);

COMMENT ON COLUMN public.players.group_id IS
'Will become NOT NULL after data backfill.';

COMMENT ON COLUMN public.players.linked_profile_id IS
'Links a sports identity to an authenticated profile when available.';

COMMIT;
