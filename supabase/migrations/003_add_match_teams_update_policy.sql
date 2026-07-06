-- =============================================================================
-- Migration: 003_add_match_teams_update_policy
-- Sprint 2.5: Enable match score editing by adding UPDATE RLS policy.
-- Run after 002_create_sessions_and_matches.sql.
-- =============================================================================

CREATE POLICY "mt_update_all"
  ON public.match_teams
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
