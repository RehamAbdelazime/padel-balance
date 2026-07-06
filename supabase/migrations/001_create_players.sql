-- =============================================================================
-- Migration: 001_create_players
-- Description: Creates the players table with supporting objects.
-- Run in: Supabase Dashboard → SQL Editor, or via `supabase db push`.
-- Schema approved: Sprint 1 cleanup.
-- =============================================================================

-- ── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE public.players (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL    CHECK (char_length(trim(name)) BETWEEN 2 AND 100),
  phone        TEXT                    CHECK (phone IS NULL OR char_length(trim(phone)) <= 20),
  archived     BOOLEAN     NOT NULL    DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL    DEFAULT now()
);

COMMENT ON TABLE  public.players           IS 'Padel players managed by this application.';
COMMENT ON COLUMN public.players.archived  IS 'Archive flag. Archived players are hidden from active lists but history is preserved.';

-- ── Auto-update updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_players_archived  ON public.players (archived);
CREATE INDEX idx_players_name      ON public.players (name);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- Sprint 1: open read/write policies for development (no auth yet).
-- No DELETE policy: archive-only strategy is enforced at DB level.
-- TODO Sprint-Auth: restrict to authenticated users.

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_select_all"
  ON public.players FOR SELECT USING (true);

CREATE POLICY "players_insert_all"
  ON public.players FOR INSERT WITH CHECK (true);

CREATE POLICY "players_update_all"
  ON public.players FOR UPDATE USING (true) WITH CHECK (true);
