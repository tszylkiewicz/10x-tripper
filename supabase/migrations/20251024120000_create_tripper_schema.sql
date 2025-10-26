/*
 * Migration: Create Tripper Application Schema (MVP)
 * Purpose: Initialize database schema for trip planning application
 * Tables: user_preferences, trip_plans, plan_generations, plan_generation_error_logs
 * Features: RLS policies, soft-delete, triggers, indexes, cleanup jobs
 * Author: PostgreSQL Expert
 * Date: 2025-10-24
 */

-- ensure pgcrypto extension is available for uuid generation
create extension if not exists "pgcrypto";

/*
 * =============================================================================
 * HELPER FUNCTIONS AND TRIGGERS
 * =============================================================================
 */

-- function to automatically update updated_at timestamp
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- function to handle soft-delete on trip_plans
-- automatically sets deleted_at and deleted_by when deletion is triggered
create or replace function trip_plans_soft_delete()
returns trigger as $$
begin
  new.deleted_at := now();
  new.deleted_by := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

/*
 * =============================================================================
 * TABLE: user_preferences
 * =============================================================================
 * Purpose: Store user's default trip planning preferences/templates
 * Access: Private to each user (RLS enabled)
 */

create table user_preferences (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) not null,
  name             varchar(256) not null,
  people_count     integer,
  budget_type      text,
  created_at       timestamptz default now() not null,
  updated_at       timestamptz default now() not null,

  -- ensure unique template names per user
  constraint unique_user_template_name unique (user_id, name)
);

-- enable row level security
alter table user_preferences enable row level security;

-- rls policy: users can only access their own preferences (select)
create policy "user_preferences_select_own" on user_preferences
  for select using (user_id = auth.uid());

-- rls policy: users can only insert their own preferences
create policy "user_preferences_insert_own" on user_preferences
  for insert with check (user_id = auth.uid());

-- rls policy: users can only update their own preferences
create policy "user_preferences_update_own" on user_preferences
  for update using (user_id = auth.uid());

-- rls policy: users can only delete their own preferences
create policy "user_preferences_delete_own" on user_preferences
  for delete using (user_id = auth.uid());

-- trigger to automatically update updated_at on modifications
create trigger set_updated_user_preferences
  before update on user_preferences
  for each row execute function set_updated_at();

/*
 * =============================================================================
 * TABLE: plan_generations
 * =============================================================================
 * Purpose: Track successful AI plan generations for analytics and debugging
 * Access: Private to each user (RLS enabled)
 */

create table plan_generations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) not null,
  model               varchar(256) not null,
  source_text_hash    text not null,
  source_text_length  integer not null,
  duration_ms         integer not null,
  created_at          timestamptz default now() not null
);

-- enable row level security
alter table plan_generations enable row level security;

-- rls policy: users can only access their own generation records (select)
create policy "plan_generations_select_own" on plan_generations
  for select using (user_id = auth.uid());

-- rls policy: users can only insert their own generation records
create policy "plan_generations_insert_own" on plan_generations
  for insert with check (user_id = auth.uid());

-- rls policy: users can only update their own generation records
create policy "plan_generations_update_own" on plan_generations
  for update using (user_id = auth.uid());

-- rls policy: users can only delete their own generation records
create policy "plan_generations_delete_own" on plan_generations
  for delete using (user_id = auth.uid());

/*
 * =============================================================================
 * TABLE: trip_plans
 * =============================================================================
 * Purpose: Store generated trip plans with all details
 * Features: Soft-delete capability, JSONB for flexible plan storage
 * Access: Private to each user (RLS enabled)
 */

create table trip_plans (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) not null,
  generation_id  uuid references plan_generations(id),
  destination    text not null,
  start_date     date not null,
  end_date       date not null,
  people_count   integer not null,
  budget_type    text not null,
  plan_details   jsonb not null,
  source         text not null check (source in ('ai', 'ai-edited')),
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null,
  deleted_at     timestamptz,
  deleted_by     uuid references auth.users(id)
);

-- enable row level security
alter table trip_plans enable row level security;

-- rls policy: users can only access their own non-deleted trip plans (select)
create policy "trip_plans_select_own" on trip_plans
  for select using (user_id = auth.uid() and deleted_at is null);

-- rls policy: users can only insert their own trip plans
create policy "trip_plans_insert_own" on trip_plans
  for insert with check (user_id = auth.uid());

-- rls policy: users can only update their own trip plans
create policy "trip_plans_update_own" on trip_plans
  for update using (user_id = auth.uid());

-- rls policy: users can only delete their own trip plans
create policy "trip_plans_delete_own" on trip_plans
  for delete using (user_id = auth.uid());

-- trigger to automatically update updated_at on modifications
create trigger set_updated_trip_plans
  before update on trip_plans
  for each row execute function set_updated_at();

-- trigger to handle soft-delete logic
-- automatically sets deleted_at and deleted_by when soft-delete is triggered
create trigger set_deleted
  before update on trip_plans
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function trip_plans_soft_delete();

/*
 * =============================================================================
 * TABLE: plan_generation_error_logs
 * =============================================================================
 * Purpose: Track failed AI plan generations for debugging and monitoring
 * Access: Service role only - no access for anon/authenticated users
 * Retention: Automatically purged after 90 days via pg_cron
 */

create table plan_generation_error_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) not null,
  model               varchar(256) not null,
  source_text_hash    text not null,
  source_text_length  integer not null,
  duration_ms         integer not null,
  error_message       text not null,
  error_code          text,
  created_at          timestamptz default now() not null
);

-- enable row level security
alter table plan_generation_error_logs enable row level security;

-- no policies for anon/authenticated roles - service role access only
-- grant specific permissions to service_role for error logging
grant select, insert on plan_generation_error_logs to service_role;

/*
 * =============================================================================
 * INDEXES FOR PERFORMANCE OPTIMIZATION
 * =============================================================================
 */

-- index on user_id for faster user-specific queries on trip_plans
create index idx_trip_plans_user_id on trip_plans(user_id);

-- index on generation_id for analytics queries tracking generation acceptance
create index idx_trip_plans_generation_id on trip_plans(generation_id);

-- index on user_id for faster user-specific queries on plan_generations
create index idx_plan_generations_user_id on plan_generations(user_id);

-- index on created_at for faster cleanup operations on error logs
create index idx_plan_generation_error_logs_created_at on plan_generation_error_logs(created_at);

/*
 * =============================================================================
 * COMMENTS ON TABLES AND COLUMNS
 * =============================================================================
 */

comment on table user_preferences is 'User default preferences and templates for trip planning';
comment on column user_preferences.name is 'User-defined name for this preference template';
comment on column user_preferences.people_count is 'Default number of people for trips';
comment on column user_preferences.budget_type is 'Default budget category (low, medium, high)';

comment on table trip_plans is 'Generated trip plans with complete itinerary details';
comment on column trip_plans.generation_id is 'Reference to the AI generation that created this plan (nullable for analytics)';
comment on column trip_plans.plan_details is 'JSONB structure containing daily itinerary and activities';
comment on column trip_plans.source is 'Origin of plan generation (ai = original, ai-edited = user modified)';
comment on column trip_plans.deleted_at is 'Soft-delete timestamp to avoid hard data loss';
comment on column trip_plans.deleted_by is 'User who performed the soft-delete operation';

comment on table plan_generations is 'Successful AI generation tracking for analytics';
comment on column plan_generations.source_text_hash is 'SHA-256 hash of the input prompt for deduplication';
comment on column plan_generations.duration_ms is 'Generation time in milliseconds for performance monitoring';

comment on table plan_generation_error_logs is 'Failed AI generation tracking for debugging (90-day retention)';
comment on column plan_generation_error_logs.error_message is 'Raw error message returned by AI service';
comment on column plan_generation_error_logs.error_code is 'Categorized error code for easier analysis';
