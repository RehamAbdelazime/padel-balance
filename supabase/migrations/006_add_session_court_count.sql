-- =============================================================================
-- Migration: 006_add_session_court_count
-- Adds the persisted "Number of Courts" field to sessions, set once during
-- Session Information (create/edit) and used by schedule generation,
-- estimated duration, and match runtime initialization.
-- Run after 005_add_cancelled_session_status.sql.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN court_count INTEGER NOT NULL DEFAULT 1 CHECK (court_count >= 1);

COMMENT ON COLUMN public.sessions.court_count IS
  'Number of courts reserved for this session. Drives schedule generation, estimated duration, and match runtime initialization (Start Session).';
