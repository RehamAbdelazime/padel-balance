-- ============================================================================
-- Migration: 012_alter_session_runtime_events.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds Multi-Group ownership to session_runtime_events.
--   Non-breaking migration. Constraints are added separately.
-- ============================================================================

BEGIN;

ALTER TABLE public.session_runtime_events
    ADD COLUMN IF NOT EXISTS group_id uuid;

CREATE INDEX IF NOT EXISTS idx_runtime_events_group_id
ON public.session_runtime_events(group_id);

COMMENT ON COLUMN public.session_runtime_events.group_id IS
'Owning group. Will become NOT NULL after data backfill.';

COMMIT;
