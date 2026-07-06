-- ============================================================================
-- Migration: 010_alter_session_schedules.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds Multi-Group ownership columns to session_schedules.
--   Non-breaking migration.
-- ============================================================================

BEGIN;

ALTER TABLE public.session_schedules
    ADD COLUMN IF NOT EXISTS group_id uuid;

CREATE INDEX IF NOT EXISTS idx_session_schedules_group_id
ON public.session_schedules(group_id);

COMMENT ON COLUMN public.session_schedules.group_id IS
'Owning group. Will become NOT NULL after data backfill.';

COMMIT;
