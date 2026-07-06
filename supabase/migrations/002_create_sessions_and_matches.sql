-- =============================================================================
-- Migration: 002_create_sessions_and_matches
-- Sprint 2: Session management and match recording.
-- Run after 001_create_players.sql.
-- =============================================================================

-- ── sessions ─────────────────────────────────────────────────────────────────

CREATE TABLE public.sessions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL    CHECK (char_length(trim(name)) BETWEEN 1 AND 100),
  session_date DATE        NOT NULL,
  notes        TEXT,
  archived     BOOLEAN     NOT NULL    DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE  public.sessions          IS 'Padel sessions that group players and matches.';
COMMENT ON COLUMN public.sessions.archived IS 'Archive flag. Archived sessions are hidden from active lists.';

CREATE TRIGGER trg_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_sessions_archived     ON public.sessions (archived);
CREATE INDEX idx_sessions_session_date ON public.sessions (session_date DESC);

-- ── session_players ───────────────────────────────────────────────────────────

CREATE TABLE public.session_players (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL    REFERENCES public.sessions(id)  ON DELETE CASCADE,
  player_id    UUID        NOT NULL    REFERENCES public.players(id)   ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL    DEFAULT now(),
  UNIQUE (session_id, player_id)
);

COMMENT ON TABLE public.session_players IS 'Attendance: which players participated in a session.';

CREATE INDEX idx_session_players_session_id ON public.session_players (session_id);
CREATE INDEX idx_session_players_player_id  ON public.session_players (player_id);

-- ── matches ───────────────────────────────────────────────────────────────────

CREATE TABLE public.matches (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID        NOT NULL    REFERENCES public.sessions(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE public.matches IS 'A single 2v2 padel match within a session.';

CREATE TRIGGER trg_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_matches_session_id ON public.matches (session_id);

-- ── match_teams ───────────────────────────────────────────────────────────────

CREATE TABLE public.match_teams (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID    NOT NULL    REFERENCES public.matches(id) ON DELETE CASCADE,
  team_number INTEGER NOT NULL    CHECK (team_number IN (1, 2)),
  score       INTEGER NOT NULL    DEFAULT 0 CHECK (score >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, team_number)
);

COMMENT ON TABLE  public.match_teams             IS 'One side of a 2v2 match. Always two rows per match.';
COMMENT ON COLUMN public.match_teams.team_number IS '1 or 2. Enforced by CHECK and UNIQUE constraints.';

CREATE INDEX idx_match_teams_match_id ON public.match_teams (match_id);

-- ── match_team_players ────────────────────────────────────────────────────────

CREATE TABLE public.match_team_players (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_team_id UUID NOT NULL REFERENCES public.match_teams(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES public.players(id)     ON DELETE CASCADE,
  UNIQUE (match_team_id, player_id)
);

COMMENT ON TABLE public.match_team_players IS 'Players assigned to a team in a match. Always two rows per match_team.';

CREATE INDEX idx_match_team_players_match_team_id ON public.match_team_players (match_team_id);
CREATE INDEX idx_match_team_players_player_id     ON public.match_team_players (player_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Sprint 2: open policies for development (no auth yet).
-- TODO Sprint-Auth: restrict to authenticated users.

ALTER TABLE public.sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_team_players ENABLE ROW LEVEL SECURITY;

-- sessions: archive-only (no DELETE policy)
CREATE POLICY "sessions_select_all" ON public.sessions FOR SELECT USING (true);
CREATE POLICY "sessions_insert_all" ON public.sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "sessions_update_all" ON public.sessions FOR UPDATE USING (true) WITH CHECK (true);

-- session_players: attendance is explicitly removed when a player leaves a session
CREATE POLICY "sp_select_all" ON public.session_players FOR SELECT USING (true);
CREATE POLICY "sp_insert_all" ON public.session_players FOR INSERT WITH CHECK (true);
CREATE POLICY "sp_delete_all" ON public.session_players FOR DELETE USING (true);

-- matches: insert-only in Sprint 2; match editing deferred
CREATE POLICY "matches_select_all" ON public.matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_all" ON public.matches FOR INSERT WITH CHECK (true);

CREATE POLICY "mt_select_all" ON public.match_teams FOR SELECT USING (true);
CREATE POLICY "mt_insert_all" ON public.match_teams FOR INSERT WITH CHECK (true);

CREATE POLICY "mtp_select_all" ON public.match_team_players FOR SELECT USING (true);
CREATE POLICY "mtp_insert_all" ON public.match_team_players FOR INSERT WITH CHECK (true);
