-- =============================================================================
-- Migration: 008_add_session_booking_duration
-- Court booking duration is a Session property (booked when creating/editing
-- the session), not a tournament-format property. Single source of truth for
-- the Schedule Preview's "reserved court time" warning — replaces the old
-- wizard-local "Reserved court time" field.
-- Run after 007_create_session_schedules.sql.
-- =============================================================================

ALTER TABLE public.sessions
  ADD COLUMN booking_duration INTEGER NOT NULL DEFAULT 90 CHECK (booking_duration >= 15);

COMMENT ON COLUMN public.sessions.booking_duration IS
  'Court booking duration in minutes, set once at session creation/edit. Single source of truth consumed by the Schedule Preview (estimated duration vs. booked time).';
