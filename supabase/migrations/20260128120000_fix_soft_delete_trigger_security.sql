/*
 * Migration: Fix Soft-Delete Trigger Security Context
 * Purpose: Change trip_plans_soft_delete() from SECURITY DEFINER to SECURITY INVOKER
 * Date: 2026-01-28
 *
 * Issue: The SECURITY DEFINER attribute causes the trigger to execute in the function
 *        owner's security context, which breaks RLS WITH CHECK evaluation because
 *        auth.uid() returns NULL or the wrong user ID during the RLS check.
 *
 * Fix: Use SECURITY INVOKER so the trigger executes in the calling user's context,
 *      allowing auth.uid() to correctly return the user's ID during RLS checks.
 */

-- ============================================================================
-- Update the soft-delete trigger function to use SECURITY INVOKER
-- ============================================================================

CREATE OR REPLACE FUNCTION trip_plans_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
  new.deleted_at := now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;  -- Changed from SECURITY DEFINER

COMMENT ON FUNCTION trip_plans_soft_delete() IS
  'Trigger function to set deleted_at timestamp for soft-delete on trip_plans. Uses SECURITY INVOKER to preserve user auth context for RLS checks.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After migration, verify:
-- 1. Check function security type:
--    SELECT proname, prosecdef FROM pg_proc WHERE proname = 'trip_plans_soft_delete';
--    (prosecdef should be FALSE for SECURITY INVOKER)
--
-- 2. Test soft-delete operation:
--    UPDATE trip_plans SET deleted_at = now() WHERE id = '<test-id>';
--    (Should succeed without RLS violation)
-- ============================================================================
