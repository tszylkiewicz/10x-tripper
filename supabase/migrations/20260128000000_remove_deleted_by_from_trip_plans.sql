/*
 * Migration: Remove deleted_by from trip_plans
 * Purpose: Remove redundant deleted_by field from single-ownership model
 * Date: 2026-01-28
 * Rationale: In MVP, trip_plans have single ownership (user_id) with RLS enforcement.
 *            Only the owner can delete their plans, making deleted_by redundant.
 *            The field will always equal user_id, providing no additional value.
 */

-- ============================================================================
-- STEP 1: Update the soft-delete trigger function
-- ============================================================================
-- Remove deleted_by logic since it's redundant in single-ownership model
-- Only deleted_at timestamp is needed for soft-delete functionality

create or replace function trip_plans_soft_delete()
returns trigger as $$
begin
  new.deleted_at := now();
  return new;
end;
$$ language plpgsql security definer;

comment on function trip_plans_soft_delete() is
  'Trigger function to set deleted_at timestamp for soft-delete on trip_plans';

-- ============================================================================
-- STEP 2: Drop the deleted_by column
-- ============================================================================
-- Safe to drop: no foreign key constraints reference this column from other tables
-- RLS policies do not use deleted_by field

alter table trip_plans
drop column deleted_by;

-- ============================================================================
-- STEP 3: Update column comment for deleted_at
-- ============================================================================

comment on column trip_plans.deleted_at is
  'Soft-delete timestamp. When set, plan is hidden from user queries but retained in database.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After migration, verify:
-- 1. Trigger still fires on UPDATE when deleted_at changes from NULL to NOT NULL
-- 2. Column deleted_by no longer exists: SELECT * FROM trip_plans LIMIT 1;
-- 3. Soft-delete works: UPDATE trip_plans SET deleted_at = now() WHERE id = '<test-id>';
-- ============================================================================
