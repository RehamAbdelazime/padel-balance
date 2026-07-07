-- ============================================================================
-- Migration: 019_session_schedule_snapshot_foundation.sql
-- Sprint: A2 - Historical Session Snapshot
-- Description:
--   Introduces session_player_id to session_schedule_player_states.
--   Existing player_id remains temporarily for compatibility.
-- ============================================================================

BEGIN;

ALTER TABLE public.session_schedule_player_states
    ADD COLUMN IF NOT EXISTS session_player_id uuid;

CREATE INDEX IF NOT EXISTS idx_schedule_player_states_session_player
ON public.session_schedule_player_states(session_player_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'schedule_player_states_session_player_fk'
    ) THEN
        ALTER TABLE public.session_schedule_player_states
            ADD CONSTRAINT schedule_player_states_session_player_fk
            FOREIGN KEY (session_player_id)
            REFERENCES public.session_players(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

COMMENT ON COLUMN public.session_schedule_player_states.session_player_id IS
'Historical snapshot reference. player_id will be removed after runtime migration.';

COMMIT;
