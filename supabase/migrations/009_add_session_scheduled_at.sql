-- =============================================================================
-- Migration: 009_add_session_scheduled_at
-- Sprint F24.2: session_date + start_time represented a single concept
-- (when the session happens) as two columns. Replace them with one
-- scheduled_at TIMESTAMPTZ, backfilled from existing data.
--
-- Additive + safe: scheduled_at is added and backfilled from the existing
-- columns; session_date/start_time are kept (not dropped, not lost) but the
-- application no longer reads or writes them after this migration.
-- Run after 008_add_session_booking_duration.sql.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN scheduled_at TIMESTAMPTZ;

-- Backfill: combine the existing DATE + TIME (defaulting missing start_time
-- to midnight) into one timestamp for every existing session.
UPDATE public.sessions
SET scheduled_at = (session_date + COALESCE(start_time, TIME '00:00:00'))::timestamptz
WHERE scheduled_at IS NULL;

ALTER TABLE public.sessions
  ALTER COLUMN scheduled_at SET NOT NULL,
  ALTER COLUMN session_date DROP NOT NULL;

COMMENT ON COLUMN public.sessions.scheduled_at IS
  'Single source of truth for when the session happens (date + time). Replaces session_date + start_time.';
COMMENT ON COLUMN public.sessions.session_date IS
  'Deprecated (migration 009) — superseded by scheduled_at. Retained for history, no longer read or written by the application.';
COMMENT ON COLUMN public.sessions.start_time IS
  'Deprecated (migration 009) — superseded by scheduled_at. Retained for history, no longer read or written by the application.';

CREATE INDEX idx_sessions_scheduled_at ON public.sessions (scheduled_at DESC);
