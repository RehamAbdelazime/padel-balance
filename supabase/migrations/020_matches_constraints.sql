-- ============================================================================
-- Migration: 009_matches_constraints.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds relational constraints for matches.
--   Run after existing rows have been assigned a group_id.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'matches_group_fk'
    ) THEN
        ALTER TABLE public.matches
            ADD CONSTRAINT matches_group_fk
            FOREIGN KEY (group_id)
            REFERENCES public.groups(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Enable after backfilling existing data.
-- ALTER TABLE public.matches
--     ALTER COLUMN group_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_group_session
ON public.matches(group_id, session_id);

COMMIT;
