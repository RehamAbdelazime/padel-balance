-- ============================================================================
-- Migration: 025_cleanup_membership_model.sql
-- Sprint: A3.1 - Authentication & Membership Cleanup
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='groups'
          AND column_name='invite_code'
    ) THEN
        ALTER TABLE public.groups
            RENAME COLUMN invite_code TO group_code;
    END IF;
END $$;

ALTER TABLE public.group_members
    DROP COLUMN IF EXISTS invited_phone,
    DROP COLUMN IF EXISTS invited_by_profile_id,
    DROP COLUMN IF EXISTS invitation_sent_at,
    DROP COLUMN IF EXISTS accepted_at;

ALTER TABLE public.groups
    DROP COLUMN IF EXISTS allow_member_invites,
    DROP COLUMN IF EXISTS require_owner_approval;

COMMENT ON TABLE public.group_members IS
'Membership and permissions only.';

COMMENT ON COLUMN public.groups.group_code IS
'Permanent unique code used by players to join a group.';

COMMIT;
