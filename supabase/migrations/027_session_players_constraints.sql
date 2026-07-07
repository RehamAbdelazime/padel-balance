-- ============================================================================
-- Migration: 016_session_players_constraints.sql
-- Sprint: A2 - Historical Session Snapshot
-- Description:
--   Finalizes constraints for session_players after backfill.
-- ============================================================================

BEGIN;

-- Make snapshot data mandatory after migration 015 populated it.
ALTER TABLE public.session_players
    ALTER COLUMN player_name_snapshot SET NOT NULL;

ALTER TABLE public.session_players
    ALTER COLUMN status SET NOT NULL;

-- joined_at / left_at intentionally remain nullable.

COMMENT ON COLUMN public.session_players.player_name_snapshot IS
'Player display name captured when the session was created.';

COMMENT ON COLUMN public.session_players.status IS
'Historical participation state for this session.';

-- Safety check
ALTER TABLE public.session_players
    ADD CONSTRAINT session_players_name_not_empty
    CHECK (char_length(trim(player_name_snapshot)) > 0);

COMMIT;
