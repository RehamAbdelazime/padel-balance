-- ============================================================================
-- Migration: 011_session_schedules_constraints.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds relational constraints for session_schedules.
--   Execute after group_id has been backfilled.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'session_schedules_group_fk'
    ) THEN
        ALTER TABLE public.session_schedules
            ADD CONSTRAINT session_schedules_group_fk
            FOREIGN KEY (group_id)
            REFERENCES public.groups(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Enable after backfill:
-- ALTER TABLE public.session_schedules
--     ALTER COLUMN group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_session_schedules_group_session
ON public.session_schedules(group_id, session_id);

COMMIT;
