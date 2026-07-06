-- ============================================================================
-- Migration: 014_backfill_default_group.sql
-- Sprint: A1 - Identity & Multi-Group Foundation
-- Description:
--   Creates a temporary default group and assigns existing records to it.
--   This migration is intended ONLY for upgrading an existing single-group
--   installation.
-- ============================================================================

BEGIN;

-- Create a default group if one does not already exist.
INSERT INTO public.groups (
    name,
    invite_code,
    description
)
SELECT
    'Default Group',
    'DEFAULT-GROUP',
    'Automatically created during multi-group migration.'
WHERE NOT EXISTS (
    SELECT 1
    FROM public.groups
    WHERE invite_code = 'DEFAULT-GROUP'
);

-- Populate players.group_id
UPDATE public.players
SET group_id = (
    SELECT id
    FROM public.groups
    WHERE invite_code = 'DEFAULT-GROUP'
)
WHERE group_id IS NULL;

-- Populate sessions.group_id
UPDATE public.sessions
SET group_id = (
    SELECT id
    FROM public.groups
    WHERE invite_code = 'DEFAULT-GROUP'
)
WHERE group_id IS NULL;

-- Populate matches.group_id
UPDATE public.matches
SET group_id = (
    SELECT id
    FROM public.groups
    WHERE invite_code = 'DEFAULT-GROUP'
)
WHERE group_id IS NULL;

-- Populate session_schedules.group_id
UPDATE public.session_schedules
SET group_id = (
    SELECT id
    FROM public.groups
    WHERE invite_code = 'DEFAULT-GROUP'
)
WHERE group_id IS NULL;

-- Populate session_runtime_events.group_id
UPDATE public.session_runtime_events
SET group_id = (
    SELECT id
    FROM public.groups
    WHERE invite_code = 'DEFAULT-GROUP'
)
WHERE group_id IS NULL;

COMMIT;
