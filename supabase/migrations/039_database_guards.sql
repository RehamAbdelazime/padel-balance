-- ============================================================================
-- Migration: 029_database_guards.sql
-- Sprint: A3.2 - Database Guards
-- Description:
--   Adds integrity constraints that are independent of authentication.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- A profile can only be a member of a group once.
-- --------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_group_members_group_profile
ON public.group_members(group_id, profile_id);

-- --------------------------------------------------------------------------
-- A player can only exist once per group for the same phone number.
-- Ignore NULL phone numbers.
-- --------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_players_group_phone
ON public.players(group_id, phone)
WHERE phone IS NOT NULL;

-- --------------------------------------------------------------------------
-- A player can only appear once in a session.
-- --------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_session_players_session_player
ON public.session_players(session_id, player_id);

-- --------------------------------------------------------------------------
-- A player can only appear once inside a team.
-- --------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_match_team_players
ON public.match_team_players(match_team_id, player_id);

COMMIT;  