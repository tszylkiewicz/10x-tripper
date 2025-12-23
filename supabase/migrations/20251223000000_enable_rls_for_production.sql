/*
 * Migration: Enable RLS for Production
 * Purpose: Re-enable Row Level Security policies for all tables
 * Date: 2025-12-23
 * Security: Ensures users can only access their own data
 */

-- ============================================================================
-- TABLE: user_preferences
-- ============================================================================

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own preferences
CREATE POLICY "user_preferences_select_own" ON user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only create preferences for themselves
CREATE POLICY "user_preferences_insert_own" ON user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own preferences
CREATE POLICY "user_preferences_update_own" ON user_preferences
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own preferences
CREATE POLICY "user_preferences_delete_own" ON user_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: trip_plans
-- ============================================================================

-- Enable RLS
ALTER TABLE trip_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own non-deleted trip plans
CREATE POLICY "trip_plans_select_own" ON trip_plans
  FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- Policy: Users can only create trip plans for themselves
CREATE POLICY "trip_plans_insert_own" ON trip_plans
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own trip plans
CREATE POLICY "trip_plans_update_own" ON trip_plans
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own trip plans (soft delete)
CREATE POLICY "trip_plans_delete_own" ON trip_plans
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: plan_generations
-- ============================================================================

-- Enable RLS
ALTER TABLE plan_generations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own generation records
CREATE POLICY "plan_generations_select_own" ON plan_generations
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can only create generation records for themselves
CREATE POLICY "plan_generations_insert_own" ON plan_generations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only update their own generation records
CREATE POLICY "plan_generations_update_own" ON plan_generations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only delete their own generation records
CREATE POLICY "plan_generations_delete_own" ON plan_generations
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TABLE: plan_generation_error_logs
-- ============================================================================

-- Enable RLS
ALTER TABLE plan_generation_error_logs ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated users - service_role access only
-- This table is for backend error logging and monitoring
-- Grant statements were already set in initial migration:
-- GRANT SELECT, INSERT ON plan_generation_error_logs TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES (run these after migration to verify)
-- ============================================================================

-- These are commented out but can be run manually to verify RLS is working:

-- Check which tables have RLS enabled:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- View all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;