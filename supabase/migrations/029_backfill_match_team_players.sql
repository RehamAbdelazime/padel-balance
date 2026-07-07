-- ============================================================================
-- Migration: 018_backfill_match_team_players.sql
-- Sprint: A2 - Historical Session Snapshot
-- Description:
--   Backfills match_team_players.session_player_id from existing data.
--   Safe to run multiple times.
-- ============================================================================

BEGIN;

UPDATE public.match_team_players mtp
SET session_player_id = sp.id
FROM public.match_teams mt
JOIN public.matches m
  ON m.id = mt.match_id
JOIN public.session_players sp
  ON sp.session_id = m.session_id
 AND sp.player_id = mtp.player_id
WHERE mt.id = mtp.match_team_id
  AND mtp.session_player_id IS NULL;

-- Validation:
-- This should return zero rows before removing player_id in a future sprint.
-- SELECT *
-- FROM public.match_team_players
-- WHERE session_player_id IS NULL;

COMMIT;
