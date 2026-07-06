-- =============================================================================
-- Migration: 010_runtime_player_management
-- Sprint F26: Runtime Player Management.
--
-- 1. session_schedule_player_states.status vocabulary changes from the
--    Sprint F23/F25 placeholder set (AVAILABLE/PLAYING/RESTING/LEFT_SESSION/
--    SKIP_NEXT_MATCH — never wired to any UI) to the real runtime states:
--    AVAILABLE/RESTING/ABSENT/LEFT/REPLACED.
-- 2. Adds replaced_by_player_id, so a REPLACED player's substitute is tracked.
-- 3. Adds session_runtime_events — an append-only audit log of runtime
--    player-management actions, to feed future Reports.
--
-- Run after 009_add_session_scheduled_at.sql.
-- =============================================================================

-- ── session_schedule_player_states — new status vocabulary ───────────────────

ALTER TABLE public.session_schedule_player_states
  DROP CONSTRAINT session_schedule_player_states_status_check;

-- No production data used the old placeholder values yet (never wired to a
-- UI action), so a plain re-check is safe — nothing to migrate.
ALTER TABLE public.session_schedule_player_states
  ADD CONSTRAINT session_schedule_player_states_status_check
  CHECK (status IN ('AVAILABLE', 'RESTING', 'ABSENT', 'LEFT', 'REPLACED'));

ALTER TABLE public.session_schedule_player_states
  ADD COLUMN replaced_by_player_id UUID REFERENCES public.players(id);

COMMENT ON COLUMN public.session_schedule_player_states.replaced_by_player_id IS
  'Present only when status = REPLACED — the attendee who took over this player''s remaining rounds.';

-- ── session_runtime_events — audit log ────────────────────────────────────────

CREATE TABLE public.session_runtime_events (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID        NOT NULL    REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type        TEXT        NOT NULL    CHECK (event_type IN ('REST', 'RETURN', 'LEAVE', 'ABSENT', 'REPLACE')),
  player_id         UUID        NOT NULL    REFERENCES public.players(id),
  related_player_id UUID        REFERENCES public.players(id),
  round_number      INTEGER,
  message           TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE public.session_runtime_events IS
  'Append-only audit log of runtime player-management actions (rest/return/leave/absent/replace). Feeds future Reports.';

CREATE INDEX idx_session_runtime_events_session_id ON public.session_runtime_events (session_id, created_at);

ALTER TABLE public.session_runtime_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sre_select_all" ON public.session_runtime_events FOR SELECT USING (true);
CREATE POLICY "sre_insert_all" ON public.session_runtime_events FOR INSERT WITH CHECK (true);
