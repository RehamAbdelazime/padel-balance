-- ============================================================================
-- Migration: 001_create_profiles.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Creates the application profiles table.
--   One profile maps 1:1 with auth.users.
--   Safe to run once on a new database.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    phone text NOT NULL UNIQUE,

    display_name text NOT NULL,

    avatar_url text,

    created_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_phone
ON public.profiles (phone);

COMMENT ON TABLE public.profiles IS
'Application user profile. One row per authenticated user.';

COMMIT;
