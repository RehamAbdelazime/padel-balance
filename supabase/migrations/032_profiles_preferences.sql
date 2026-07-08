-- ============================================================================
-- Migration: 022_profiles_preferences.sql
-- Sprint: A4 - User Identity & Membership
-- ============================================================================

BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Cairo';

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
ON public.profiles(last_seen_at);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'profiles_preferred_language_chk'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_preferred_language_chk
        CHECK (preferred_language IN ('en','ar'));
    END IF;
END $$;

COMMIT;
