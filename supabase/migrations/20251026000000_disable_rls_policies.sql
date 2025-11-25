/*
 * Migration: Disable RLS Policies
 * Purpose: Remove all RLS policies and disable RLS for development/testing
 * Date: 2025-10-26
 * WARNING: This is for development only. Re-enable RLS for production!
 */

-- Drop all policies for user_preferences
DROP POLICY IF EXISTS "user_preferences_select_own" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_insert_own" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_update_own" ON user_preferences;
DROP POLICY IF EXISTS "user_preferences_delete_own" ON user_preferences;

-- Drop all policies for trip_plans
DROP POLICY IF EXISTS "trip_plans_select_own" ON trip_plans;
DROP POLICY IF EXISTS "trip_plans_insert_own" ON trip_plans;
DROP POLICY IF EXISTS "trip_plans_update_own" ON trip_plans;
DROP POLICY IF EXISTS "trip_plans_delete_own" ON trip_plans;

-- Drop all policies for plan_generations
DROP POLICY IF EXISTS "plan_generations_select_own" ON plan_generations;
DROP POLICY IF EXISTS "plan_generations_insert_own" ON plan_generations;
DROP POLICY IF EXISTS "plan_generations_update_own" ON plan_generations;
DROP POLICY IF EXISTS "plan_generations_delete_own" ON plan_generations;

-- Disable RLS on all tables
-- Without this, RLS will still block all operations even without policies
ALTER TABLE user_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE plan_generation_error_logs DISABLE ROW LEVEL SECURITY;