-- ============================================================================
-- Migration: 005_players_constraints.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Adds relational constraints for players after data backfill.
--   Execute ONLY after group_id has been populated for existing players.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'players_group_fk'
    ) THEN
        ALTER TABLE public.players
            ADD CONSTRAINT players_group_fk
            FOREIGN KEY (group_id)
            REFERENCES public.groups(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'players_linked_profile_fk'
    ) THEN
        ALTER TABLE public.players
            ADD CONSTRAINT players_linked_profile_fk
            FOREIGN KEY (linked_profile_id)
            REFERENCES public.profiles(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- Uncomment ONLY after migrating existing data.
-- ALTER TABLE public.players
--     ALTER COLUMN group_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_players_group_phone
ON public.players(group_id, phone)
WHERE phone IS NOT NULL;

COMMIT;
