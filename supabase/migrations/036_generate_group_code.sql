-- ============================================================================
-- Migration: 026_generate_group_code.sql
-- Sprint: A3.1 - Authentication & Membership Cleanup
-- Description:
--   Generates unique group codes automatically.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Generates a random group code.
-- Alphabet intentionally excludes:
-- 0, O, 1, I, L
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_group_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    code text;
    exists_code boolean;
BEGIN
    LOOP

        code := '';

        FOR i IN 1..6 LOOP
            code := code ||
                substr(
                    alphabet,
                    floor(random() * length(alphabet) + 1)::int,
                    1
                );
        END LOOP;

        SELECT EXISTS (
            SELECT 1
            FROM public.groups
            WHERE group_code = code
        )
        INTO exists_code;

        EXIT WHEN NOT exists_code;

    END LOOP;

    RETURN code;
END;
$$;

-- --------------------------------------------------------------------------
-- Automatically generate a group code when omitted.
-- --------------------------------------------------------------------------

ALTER TABLE public.groups
    ALTER COLUMN group_code
    SET DEFAULT public.generate_group_code();

COMMENT ON FUNCTION public.generate_group_code IS
'Generates a unique 6-character group code. UI may prepend PAD- when displaying.';

COMMIT;