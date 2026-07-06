-- =============================================================================
-- Migration: 011_add_match_cancelled_status
-- Runtime layer: adds CANCELLED as a valid match runtime status, alongside
-- PENDING/LIVE/FINISHED. A cancelled match counts as terminal for round
-- completion (see deriveRoundStatus) but carries no score.
-- Also widens session_runtime_events.event_type for the additional
-- session/round/match lifecycle events the runtime timeline now logs, and
-- relaxes player_id to nullable since those events aren't about one player.
-- Run after 010_runtime_player_management.sql.
-- =============================================================================

ALTER TABLE public.session_schedule_matches
  DROP CONSTRAINT session_schedule_matches_match_status_check;

ALTER TABLE public.session_schedule_matches
  ADD CONSTRAINT session_schedule_matches_match_status_check
  CHECK (match_status IN ('PENDING', 'LIVE', 'FINISHED', 'CANCELLED'));

ALTER TABLE public.session_runtime_events
  ALTER COLUMN player_id DROP NOT NULL;

ALTER TABLE public.session_runtime_events
  DROP CONSTRAINT session_runtime_events_event_type_check;

ALTER TABLE public.session_runtime_events
  ADD CONSTRAINT session_runtime_events_event_type_check
  CHECK (event_type IN (
    'REST', 'RETURN', 'LEAVE', 'ABSENT', 'REPLACE',
    'SESSION_STARTED', 'ROUND_STARTED', 'ROUND_FINISHED',
    'MATCH_FINISHED', 'MATCH_CANCELLED', 'SESSION_FINISHED'
  ));
