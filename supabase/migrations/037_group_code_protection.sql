-- ============================================================================
-- Migration: 027_group_code_protection.sql
-- Sprint: A3.1 - Authentication & Membership Cleanup
-- Description:
--   Protects and validates group codes.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Validate format
-- --------------------------------------------------------------------------

ALTER TABLE public.groups
DROP CONSTRAINT IF EXISTS groups_group_code_chk;

ALTER TABLE public.groups
ADD CONSTRAINT groups_group_code_chk
CHECK (
    group_code ~ '^[A-Z2-9]{6}$'
);

-- --------------------------------------------------------------------------
-- Group code can never be empty
-- --------------------------------------------------------------------------

ALTER TABLE public.groups
ALTER COLUMN group_code SET NOT NULL;

-- --------------------------------------------------------------------------
-- Ensure uniqueness
-- --------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS uq_groups_group_code
ON public.groups(group_code);

COMMENT ON COLUMN public.groups.group_code IS
'Permanent unique group identifier. UI may display it as PAD-XXXXXX.';

COMMIT;