-- ============================================================================
-- Migration: 007_sessions_constraints.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds relational constraints for sessions.
--   Run after group_id has been backfilled.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname='sessions_group_fk'
    ) THEN
        ALTER TABLE public.sessions
        ADD CONSTRAINT sessions_group_fk
        FOREIGN KEY (group_id)
        REFERENCES public.groups(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname='sessions_created_by_profile_fk'
    ) THEN
        ALTER TABLE public.sessions
        ADD CONSTRAINT sessions_created_by_profile_fk
        FOREIGN KEY (created_by_profile_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Enable after existing sessions have been assigned to a group.
-- ALTER TABLE public.sessions
--     ALTER COLUMN group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_group_status
ON public.sessions(group_id, status);

COMMIT;
