/*
 * Migration: Remove Soft-Delete Trigger and Function
 * Purpose: Remove automatic deleted_at timestamp trigger from trip_plans
 * Date: 2026-01-28
 *
 * Rationale: The soft-delete trigger automatically sets deleted_at when it changes
 *            from NULL to NOT NULL. However, this is redundant because:
 *            1. The application explicitly sets deleted_at = now() in DELETE operations
 *            2. The trigger adds unnecessary complexity and potential failure points
 *            3. Direct updates are clearer and more maintainable
 *            4. No business logic requires automatic timestamp setting beyond what the app provides
 */

-- ============================================================================
-- STEP 1: Drop the soft-delete trigger
-- ============================================================================

DROP TRIGGER IF EXISTS set_deleted ON trip_plans;

COMMENT ON TABLE trip_plans IS
  'Generated trip plans with complete itinerary details. Uses soft-delete pattern via deleted_at column.';

-- ============================================================================
-- STEP 2: Drop the trigger function
-- ============================================================================

DROP FUNCTION IF EXISTS trip_plans_soft_delete();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After migration, verify:
-- 1. Trigger no longer exists:
--    SELECT tgname FROM pg_trigger WHERE tgname = 'set_deleted';
--    (Should return 0 rows)
--
-- 2. Function no longer exists:
--    SELECT proname FROM pg_proc WHERE proname = 'trip_plans_soft_delete';
--    (Should return 0 rows)
--
-- 3. Soft-delete still works via application code:
--    UPDATE trip_plans SET deleted_at = now() WHERE id = '<test-id>';
--    (Should succeed and set timestamp correctly)
-- ============================================================================
