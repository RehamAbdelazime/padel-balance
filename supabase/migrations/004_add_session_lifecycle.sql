-- =============================================================================
-- Migration: 004_add_session_lifecycle
-- Sprint F22: Session Lifecycle (Phase 1) — PLANNING / LIVE / FINISHED.
-- Run after 003_add_match_teams_update_policy.sql.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN status     TEXT NOT NULL DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'LIVE', 'FINISHED')),
  ADD COLUMN start_time TIME;

COMMENT ON COLUMN public.sessions.status     IS 'Session lifecycle phase. PLANNING (default) -> LIVE -> FINISHED.';
COMMENT ON COLUMN public.sessions.start_time IS 'Optional planned start time (with session_date) used for auto-start to LIVE.';

CREATE INDEX idx_sessions_status ON public.sessions (status);
