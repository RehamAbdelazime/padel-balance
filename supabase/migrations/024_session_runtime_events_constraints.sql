-- ============================================================================
-- Migration: 013_session_runtime_events_constraints.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds relational constraints for session_runtime_events.
--   Execute after group_id has been populated.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'session_runtime_events_group_fk'
    ) THEN
        ALTER TABLE public.session_runtime_events
            ADD CONSTRAINT session_runtime_events_group_fk
            FOREIGN KEY (group_id)
            REFERENCES public.groups(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Enable after backfill:
-- ALTER TABLE public.session_runtime_events
--     ALTER COLUMN group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_runtime_events_group_session
ON public.session_runtime_events(group_id, session_id);

COMMIT;
