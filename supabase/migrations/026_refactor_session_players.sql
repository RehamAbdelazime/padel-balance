-- ============================================================================
-- Migration: 015_refactor_session_players.sql
-- Sprint: A2 - Historical Session Snapshot
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'session_player_status'
    ) THEN
        CREATE TYPE public.session_player_status AS ENUM (
            'REGISTERED',
            'PLAYING',
            'RESTING',
            'LEFT',
            'REPLACED',
            'ABSENT'
        );
    END IF;
END $$;

ALTER TABLE public.session_players
    ADD COLUMN IF NOT EXISTS player_name_snapshot text;

ALTER TABLE public.session_players
    ADD COLUMN IF NOT EXISTS status public.session_player_status;

ALTER TABLE public.session_players
    ADD COLUMN IF NOT EXISTS joined_at timestamptz;

ALTER TABLE public.session_players
    ADD COLUMN IF NOT EXISTS left_at timestamptz;

UPDATE public.session_players sp
SET player_name_snapshot = p.name,
    status = 'REGISTERED'
FROM public.players p
WHERE sp.player_id = p.id
  AND sp.player_name_snapshot IS NULL;

ALTER TABLE public.session_players
    ALTER COLUMN status SET DEFAULT 'REGISTERED';

CREATE INDEX IF NOT EXISTS idx_session_players_session
ON public.session_players(session_id);

CREATE INDEX IF NOT EXISTS idx_session_players_player
ON public.session_players(player_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_session_players_session_player
ON public.session_players(session_id, player_id);

COMMIT;
