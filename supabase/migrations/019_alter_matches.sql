-- ============================================================================
-- Migration: 008_alter_matches.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds Multi-Group ownership to matches.
--   Non-breaking migration. Constraints come later.
-- ============================================================================

BEGIN;

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS group_id uuid;

CREATE INDEX IF NOT EXISTS idx_matches_group_id
ON public.matches(group_id);

COMMENT ON COLUMN public.matches.group_id IS
'Owning group. Will become NOT NULL after data backfill.';

COMMIT;
