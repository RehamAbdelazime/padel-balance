-- ============================================================================
-- Migration: 023_groups_settings.sql
-- Sprint: A4 - User Identity & Membership
-- ============================================================================

BEGIN;

ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT true;

ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS allow_member_invites boolean NOT NULL DEFAULT false;

ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS require_owner_approval boolean NOT NULL DEFAULT true;

ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS default_language text NOT NULL DEFAULT 'en';

ALTER TABLE public.groups
    ADD COLUMN IF NOT EXISTS max_members integer;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='groups_default_language_chk') THEN
        ALTER TABLE public.groups
            ADD CONSTRAINT groups_default_language_chk
            CHECK (default_language IN ('en','ar'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='groups_max_members_chk') THEN
        ALTER TABLE public.groups
            ADD CONSTRAINT groups_max_members_chk
            CHECK (max_members IS NULL OR max_members > 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_groups_private
ON public.groups(is_private);

COMMIT;
