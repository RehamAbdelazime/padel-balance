-- ============================================================================
-- Migration: 002_create_groups.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Creates logical groups (tenants) for organizers.
--   Ownership is NOT stored here. Permissions live in group_members.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    name text NOT NULL,

    invite_code text NOT NULL UNIQUE,

    description text,

    image_url text,

    archived boolean NOT NULL DEFAULT false,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_name
ON public.groups(name);

CREATE INDEX IF NOT EXISTS idx_groups_invite_code
ON public.groups(invite_code);

COMMENT ON TABLE public.groups IS
'Logical organizer group. Permissions are managed through group_members.';

COMMIT;
