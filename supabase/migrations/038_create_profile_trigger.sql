-- ============================================================================
-- Migration: 028_create_profile_trigger.sql
-- Sprint: A3.2 - Authentication
-- Description:
--   Automatically creates a profile whenever a new auth user is created.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Trigger Function
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        phone,
        display_name
    )
    VALUES (
        NEW.id,
        NEW.phone,
        ''
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;

END;
$$;

-- --------------------------------------------------------------------------
-- Trigger
-- --------------------------------------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

COMMIT;