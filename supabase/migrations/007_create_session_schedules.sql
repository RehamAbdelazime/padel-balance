-- =============================================================================
-- Migration: 007_create_session_schedules
-- Sprint F24: Persist the Planning-phase SessionSchedule so it survives a
-- page refresh / reopening the session. Normalized design (not a JSON blob
-- on sessions) so future Live Runtime features can query match/player-state
-- rows directly.
-- Run after 006_add_session_court_count.sql.
-- =============================================================================

-- ── session_schedules ─────────────────────────────────────────────────────────
-- One row per session. Quality is NOT persisted — it is a pure function of
-- (matches, playerIds) and is recomputed on load.

CREATE TABLE public.session_schedules (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID        NOT NULL    UNIQUE REFERENCES public.sessions(id) ON DELETE CASCADE,
  format_id           TEXT        NOT NULL,
  version             INTEGER     NOT NULL    DEFAULT 0,
  target_count        INTEGER     NOT NULL,
  current_match_index INTEGER,
  created_at          TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE  public.session_schedules             IS 'Persisted Planning-phase schedule for a session. One row per session.';
COMMENT ON COLUMN public.session_schedules.format_id   IS 'TournamentFormat id used to generate this schedule (see sessions/formats/registry.ts).';
COMMENT ON COLUMN public.session_schedules.version     IS 'Mutation counter — mirrors SessionSchedule.version.';

CREATE TRIGGER trg_session_schedules_updated_at
  BEFORE UPDATE ON public.session_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── session_schedule_matches ──────────────────────────────────────────────────

CREATE TABLE public.session_schedule_matches (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id    UUID        NOT NULL    REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  match_id       TEXT        NOT NULL,
  position       INTEGER     NOT NULL,
  origin         TEXT        NOT NULL    CHECK (origin IN ('AUTO', 'MANUAL')),
  protection     TEXT        NOT NULL    CHECK (protection IN ('LOCKED', 'UNLOCKED')),
  modified       BOOLEAN     NOT NULL    DEFAULT FALSE,
  court_number   INTEGER,
  team_a_player1 UUID        NOT NULL    REFERENCES public.players(id),
  team_a_player2 UUID        NOT NULL    REFERENCES public.players(id),
  team_b_player1 UUID        NOT NULL    REFERENCES public.players(id),
  team_b_player2 UUID        NOT NULL    REFERENCES public.players(id),
  explanation    TEXT[]      NOT NULL    DEFAULT '{}',
  warnings       TEXT[]      NOT NULL    DEFAULT '{}',
  is_completed   BOOLEAN     NOT NULL    DEFAULT FALSE,
  result_team1   INTEGER,
  result_team2   INTEGER,
  match_status   TEXT        NOT NULL    DEFAULT 'PENDING' CHECK (match_status IN ('PENDING', 'LIVE', 'FINISHED')),
  UNIQUE (schedule_id, match_id),
  UNIQUE (schedule_id, position)
);

COMMENT ON TABLE  public.session_schedule_matches          IS 'One row per PlannedMatch. match_id is the client-generated id (schedule-helpers.ts matchId()).';
COMMENT ON COLUMN public.session_schedule_matches.position IS '0-based index within SessionSchedule.matches, preserving order.';

CREATE INDEX idx_ssm_schedule_id ON public.session_schedule_matches (schedule_id);

-- ── session_schedule_player_states ────────────────────────────────────────────

CREATE TABLE public.session_schedule_player_states (
  schedule_id UUID NOT NULL REFERENCES public.session_schedules(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES public.players(id)           ON DELETE CASCADE,
  status      TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'PLAYING', 'RESTING', 'LEFT_SESSION', 'SKIP_NEXT_MATCH')),
  PRIMARY KEY (schedule_id, player_id)
);

COMMENT ON TABLE public.session_schedule_player_states IS 'Runtime availability of each attendee within a persisted schedule.';

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Open policies for development (no auth yet), matching existing tables.
-- TODO Sprint-Auth: restrict to authenticated users.

ALTER TABLE public.session_schedules             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_schedule_matches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_schedule_player_states  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss_select_all" ON public.session_schedules FOR SELECT USING (true);
CREATE POLICY "ss_insert_all" ON public.session_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "ss_update_all" ON public.session_schedules FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ss_delete_all" ON public.session_schedules FOR DELETE USING (true);

CREATE POLICY "ssm_select_all" ON public.session_schedule_matches FOR SELECT USING (true);
CREATE POLICY "ssm_insert_all" ON public.session_schedule_matches FOR INSERT WITH CHECK (true);
CREATE POLICY "ssm_update_all" ON public.session_schedule_matches FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ssm_delete_all" ON public.session_schedule_matches FOR DELETE USING (true);

CREATE POLICY "sps_select_all" ON public.session_schedule_player_states FOR SELECT USING (true);
CREATE POLICY "sps_insert_all" ON public.session_schedule_player_states FOR INSERT WITH CHECK (true);
CREATE POLICY "sps_update_all" ON public.session_schedule_player_states FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "sps_delete_all" ON public.session_schedule_player_states FOR DELETE USING (true);
