-- =============================================================================
-- Migration: 005_add_cancelled_session_status
-- Sprint F22 (continued): add CANCELLED as a supported lifecycle state.
-- Not yet reachable from the UI — reserved for a future sprint.
-- Run after 004_add_session_lifecycle.sql.
-- =============================================================================

ALTER TABLE public.sessions
  DROP CONSTRAINT sessions_status_check;

ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('PLANNING', 'LIVE', 'FINISHED', 'CANCELLED'));

COMMENT ON COLUMN public.sessions.status IS
  'Session lifecycle phase. PLANNING (default) -> LIVE -> FINISHED, or PLANNING/LIVE -> CANCELLED.';
