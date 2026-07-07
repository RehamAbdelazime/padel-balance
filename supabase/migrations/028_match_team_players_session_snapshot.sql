-- ============================================================================
-- Migration: 017_match_team_players_session_snapshot.sql
-- Sprint: A2 - Historical Session Snapshot
-- Description:
--   Introduces session_player_id without breaking existing runtime.
--   Existing player_id remains temporarily for compatibility.
-- ============================================================================

BEGIN;

ALTER TABLE public.match_team_players
    ADD COLUMN IF NOT EXISTS session_player_id uuid;

CREATE INDEX IF NOT EXISTS idx_match_team_players_session_player
ON public.match_team_players(session_player_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'match_team_players_session_player_fk'
    ) THEN
        ALTER TABLE public.match_team_players
            ADD CONSTRAINT match_team_players_session_player_fk
            FOREIGN KEY (session_player_id)
            REFERENCES public.session_players(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

COMMENT ON COLUMN public.match_team_players.session_player_id IS
'Historical reference. player_id will be removed in a later migration after backfill and application refactor.';

COMMIT;
