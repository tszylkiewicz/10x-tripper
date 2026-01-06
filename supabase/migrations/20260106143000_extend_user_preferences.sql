-- ============================================================================
-- Migration: Extend user_preferences with multi-select fields
-- Date: 2026-01-06 14:30:00 UTC
-- Purpose: Add transport, activities_todo, and activities_avoid columns
--          to support multi-select preferences with predefined and custom options
-- ============================================================================
-- Affected tables: user_preferences
-- New columns:
--   - transport: Array of transport options (predefined IDs or custom text with "custom:" prefix)
--   - activities_todo: Array of activity preferences (what to do)
--   - activities_avoid: Array of activities to avoid
--
-- Data format:
--   - Predefined options stored as IDs (e.g., "airplane", "museums")
--   - Custom options prefixed with "custom:" (e.g., "custom:Segway", "custom:Lokalne targi")
--
-- Backward compatibility: New columns have default empty array values,
--                          existing records will continue to work
-- ============================================================================

-- add new columns to user_preferences table
alter table user_preferences
add column transport text[] default '{}',
add column activities_todo text[] default '{}',
add column activities_avoid text[] default '{}';

-- add column comments for documentation
comment on column user_preferences.transport is
  'Array of transport options - predefined IDs or custom text prefixed with "custom:"';

comment on column user_preferences.activities_todo is
  'Array of activity preferences (what to do) - predefined IDs or custom text prefixed with "custom:"';

comment on column user_preferences.activities_avoid is
  'Array of activities to avoid - predefined IDs or custom text prefixed with "custom:"';
