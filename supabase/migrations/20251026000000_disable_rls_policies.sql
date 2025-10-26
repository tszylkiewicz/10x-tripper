/*
 * Migration: Disable RLS Policies
 * Purpose: Remove all RLS policies from trip_plans, plan_generations, plan_generation_error_logs, user_preferences
 * Date: 2025-10-26
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

-- Note: plan_generation_error_logs table has no policies to drop
-- It only has service_role access via explicit grants