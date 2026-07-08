-- ============================================================================
-- Migration: 021_group_members_enhancements.sql
-- Sprint: A4 - User Identity & Membership
-- Description:
--   Adds invitation workflow support to group_members.
-- ============================================================================

BEGIN;

ALTER TABLE public.group_members
    ADD COLUMN IF NOT EXISTS invited_phone text;

ALTER TABLE public.group_members
    ADD COLUMN IF NOT EXISTS invited_by_profile_id uuid;

ALTER TABLE public.group_members
    ADD COLUMN IF NOT EXISTS invitation_sent_at timestamptz;

ALTER TABLE public.group_members
    ADD COLUMN IF NOT EXISTS accepted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_group_members_invited_phone
ON public.group_members(invited_phone);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'group_members_invited_by_profile_fk'
    ) THEN
        ALTER TABLE public.group_members
        ADD CONSTRAINT group_members_invited_by_profile_fk
        FOREIGN KEY (invited_by_profile_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;