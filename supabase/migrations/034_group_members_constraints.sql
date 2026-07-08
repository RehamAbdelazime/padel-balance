-- ============================================================================
-- Migration: 024_group_members_constraints.sql
-- Sprint: A4 - User Identity & Membership
-- Description:
--   Adds membership validation constraints and indexes.
--   Supports multiple owners per group.
-- ============================================================================

BEGIN;

-- One active membership per profile per group.
CREATE UNIQUE INDEX IF NOT EXISTS uq_group_members_group_profile
ON public.group_members(group_id, profile_id);

-- A phone invitation cannot be duplicated inside the same group.
CREATE UNIQUE INDEX IF NOT EXISTS uq_group_members_group_invited_phone
ON public.group_members(group_id, invited_phone)
WHERE invited_phone IS NOT NULL;

ALTER TABLE public.group_members
    ADD CONSTRAINT group_members_joined_after_invite_chk
    CHECK (
        accepted_at IS NULL
        OR invitation_sent_at IS NULL
        OR accepted_at >= invitation_sent_at
    );

CREATE INDEX IF NOT EXISTS idx_group_members_status
ON public.group_members(status);

CREATE INDEX IF NOT EXISTS idx_group_members_role_status
ON public.group_members(role, status);

COMMENT ON TABLE public.group_members IS
'Membership and permissions. Multiple owners are supported.';

COMMIT;
