-- ============================================================================
-- Migration: 006_alter_sessions.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds Multi-Group ownership columns to sessions.
--   Non-breaking migration. Constraints are added later.
-- ============================================================================

BEGIN;

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS group_id uuid;

ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS created_by_profile_id uuid;

CREATE INDEX IF NOT EXISTS idx_sessions_group_id
ON public.sessions(group_id);

CREATE INDEX IF NOT EXISTS idx_sessions_created_by_profile
ON public.sessions(created_by_profile_id);

COMMENT ON COLUMN public.sessions.group_id IS
'Owning group. Will become NOT NULL after data backfill.';

COMMENT ON COLUMN public.sessions.created_by_profile_id IS
'Profile that created the session.';

COMMIT;
