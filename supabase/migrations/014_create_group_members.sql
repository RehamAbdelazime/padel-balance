-- ============================================================================
-- Migration: 003_create_group_members.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Creates the membership table linking authenticated users (profiles)
--   to groups. This table is the ONLY source of truth for permissions.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'group_role'
    ) THEN
        CREATE TYPE public.group_role AS ENUM (
            'OWNER',
            'ADMIN',
            'MEMBER'
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'member_status'
    ) THEN
        CREATE TYPE public.member_status AS ENUM (
            'PENDING',
            'ACTIVE',
            'LEFT',
            'REMOVED',
            'BANNED'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.group_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id uuid NOT NULL
        REFERENCES public.groups(id)
        ON DELETE CASCADE,

    profile_id uuid NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    role public.group_role NOT NULL DEFAULT 'MEMBER',

    status public.member_status NOT NULL DEFAULT 'ACTIVE',

    joined_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_group_member UNIQUE (group_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group
ON public.group_members(group_id);

CREATE INDEX IF NOT EXISTS idx_group_members_profile
ON public.group_members(profile_id);

CREATE INDEX IF NOT EXISTS idx_group_members_role
ON public.group_members(role);

COMMENT ON TABLE public.group_members IS
'Membership and permissions. Sports data belongs to players, not memberships.';

COMMIT;
