# Tripper – PostgreSQL Schema (MVP)

## 1. Tables

### 1.1 user_preferences

| Column       | Type         | Constraints                   | Description                   |
| ------------ | ------------ | ----------------------------- | ----------------------------- |
| id           | uuid         | PK, default gen_random_uuid() | Primary key                   |
| user_id      | uuid         | FK → auth.users(id), NOT NULL | Owner                         |
| name         | varchar(256) | NOT NULL                      | Template name                 |
| people_count | integer      |                               | Default group size preference |
| budget_type  | text         |                               | E.g. `low`, `medium`, `high`  |
| created_at   | timestamptz  | DEFAULT now()                 |                               |
| updated_at   | timestamptz  | DEFAULT now()                 | Updated via trigger           |

**Additional constraints**: UNIQUE (user_id, name)

---

### 1.2 trip_plans

| Column       | Type        | Constraints                                    | Description                      |
| ------------ | ----------- | ---------------------------------------------- | -------------------------------- |
| id           | uuid        | PK, default gen_random_uuid()                  |                                  |
| user_id      | uuid        | FK → auth.users(id), NOT NULL                  | Owner                            |
| destination  | text        | NOT NULL                                       | City / region                    |
| start_date   | date        | NOT NULL                                       | Trip start                       |
| end_date     | date        | NOT NULL                                       | Trip end                         |
| people_count | integer     | NOT NULL                                       | Copied from preferences or form  |
| budget_type  | text        | NOT NULL                                       | Copied from preferences or form  |
| plan_details | jsonb       | NOT NULL                                       | Nested structure of days / items |
| source       | text        | NOT NULL, CHECK (source IN ('ai','ai-edited')) | Generation origin                |
| created_at   | timestamptz | DEFAULT now()                                  |                                  |
| updated_at   | timestamptz | DEFAULT now()                                  | Updated via trigger              |
| deleted_at   | timestamptz |                                                | Soft-delete timestamp            |
| deleted_by   | uuid        | FK → auth.users(id)                            | User who deleted                 |

---

### 1.3 plan_generations

| Column             | Type         | Constraints                   | Description                    |
| ------------------ | ------------ | ----------------------------- | ------------------------------ |
| id                 | uuid         | PK, default gen_random_uuid() |                                |
| user_id            | uuid         | FK → auth.users(id), NOT NULL | Owner                          |
| plan_id            | uuid         | FK → trip_plans(id)           | Nullable until success         |
| model              | varchar(256) | NOT NULL                      | LLM model identifier           |
| source_text_hash   | text         | NOT NULL                      | SHA-256 (or similar) of prompt |
| source_text_length | integer      | NOT NULL                      | Prompt length (chars)          |
| duration_ms        | integer      | NOT NULL                      | Generation latency             |
| created_at         | timestamptz  | DEFAULT now()                 |                                |

---

### 1.4 plan_generation_error_logs

| Column             | Type         | Constraints                   | Description          |
| ------------------ | ------------ | ----------------------------- | -------------------- |
| id                 | uuid         | PK, default gen_random_uuid() |                      |
| user_id            | uuid         | FK → auth.users(id), NOT NULL | Requesting user      |
| model              | varchar(256) | NOT NULL                      | LLM model identifier |
| source_text_hash   | text         | NOT NULL                      | SHA-256 of prompt    |
| source_text_length | integer      | NOT NULL                      | Prompt length        |
| duration_ms        | integer      | NOT NULL                      | Time until error     |
| error_message      | text         | NOT NULL                      | Raw error returned   |
| error_code         | text         |                               | Categorised code     |
| created_at         | timestamptz  | DEFAULT now()                 |                      |

---

## 2. Relationships

1. **auth.users 1 — N user_preferences** (`auth.users.id` → `user_preferences.user_id`)
2. **auth.users 1 — N trip_plans** (`auth.users.id` → `trip_plans.user_id`)
3. **trip_plans 1 — N plan_generations** (`trip_plans.id` → `plan_generations.plan_id`)
4. **auth.users 1 — N plan_generations** (`auth.users.id` → `plan_generations.user_id`)
5. **auth.users 1 — N plan_generation_error_logs** (`auth.users.id` → `plan_generation_error_logs.user_id`)

All are one-to-many; no many-to-many tables required in MVP.

## 3. Indexes

| Table                      | Index                  | Purpose                          |
| -------------------------- | ---------------------- | -------------------------------- |
| user_preferences           | UNIQUE (user_id, name) | Prevent duplicate template names |
| trip_plans                 | (user_id)              | Speed up owner queries           |
| plan_generations           | (user_id)              |                                  |
| plan_generation_error_logs | (created_at)           | Accelerate housekeeping (≥90d)   |

Additional GIN / JSONB indexes can be added later for complex searches inside `plan_details`.

## 4. Constraints & Triggers

### 4.1 Soft-delete trigger on trip_plans

```sql
CREATE OR REPLACE FUNCTION trip_plans_soft_delete()
RETURNS trigger AS $$
BEGIN
  NEW.deleted_at := now();
  NEW.deleted_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_deleted
BEFORE UPDATE ON trip_plans
FOR EACH ROW
WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
EXECUTE FUNCTION trip_plans_soft_delete();
```

### 4.2 updated_at triggers (generic)

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to relevant tables
CREATE TRIGGER set_updated_user_preferences
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_trip_plans
BEFORE UPDATE ON trip_plans
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

## 5. Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_generation_error_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY up_owner ON user_preferences
  USING (user_id = auth.uid());

CREATE POLICY tp_owner ON trip_plans
  USING (user_id = auth.uid());

CREATE POLICY pg_owner ON plan_generations
  USING (user_id = auth.uid());

-- No policies on plan_generation_error_logs for anon/authenticated roles
-- Service roles only:
GRANT SELECT, INSERT ON plan_generation_error_logs TO service_role;
```

## 6. Additional Notes

- All primary keys use `gen_random_uuid()` (requires `pgcrypto`).
- Soft-delete avoids hard data loss while keeping schema simple; `deleted_at` lacks index to reduce write amplification—can be added when physical purging or frequent queries require it.
- Denormalisation of `people_count` and `budget_type` into `trip_plans` optimises reads and keeps queries simple.
- `plan_details` JSONB structure keeps MVP flexible; future iterations may normalise into day/item tables if querying needs grow.
- **Supabase configuration**: Remember to add the above RLS policies and triggers through migrations (e.g. using `supabase db push`).
