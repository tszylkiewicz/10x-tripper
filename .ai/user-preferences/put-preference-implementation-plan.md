# API Endpoint Implementation Plan: PUT /api/preferences/:id

## 1. Endpoint Overview

The `PUT /api/preferences/:id` endpoint allows authenticated users to update their existing preference templates. Preference templates store default trip planning settings (name, people count, budget type) that users can reuse when generating trip plans.

**Key Characteristics:**

- Requires user authentication via Supabase Auth
- Users can only update their own preferences
- Partial updates supported (all fields optional)
- Enforces unique constraint on preference name per user
- Returns updated preference with timestamps

## 2. Request Details

### HTTP Method

`PUT`

### URL Structure

```
PUT /api/preferences/:id
```

### URL Parameters

- **id** (required, uuid): The unique identifier of the preference template to update

### Request Headers

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body

All fields are optional for update operations:

```json
{
  "name": "string", // optional, max 256 chars, must be non-empty if provided
  "people_count": 3, // optional, integer >= 1, nullable
  "budget_type": "high" // optional, string (e.g., "low", "medium", "high"), nullable
}
```

**Validation Rules:**

- At least one field must be provided
- `name`: If provided, must be non-empty string, max 256 characters, unique per user
- `people_count`: If provided, must be positive integer (>= 1) or null
- `budget_type`: If provided, must be non-empty string or null

## 3. Types Used

### Request/Response DTOs (from `src/types.ts`)

**Request Body Type:**

```typescript
UpdateUserPreferenceDto (lines 92-96)
{
  name?: string;
  people_count?: number | null;
  budget_type?: string | null;
}
```

**Response Type:**

```typescript
UserPreferenceDto (line 74)
Pick<Tables<"user_preferences">, "id" | "name" | "people_count" | "budget_type">
```

**API Response Wrapper:**

```typescript
ApiSuccessResponse<UserPreferenceDto> (lines 317-319)
{
  data: UserPreferenceDto
}
```

### Command Model (for service layer)

```typescript
UpdatePreferenceCommand (lines 288-294)
{
  id: string;
  name?: string;
  people_count?: number | null;
  budget_type?: string | null;
  user_id: string;
}
```

### Validation Schema (to be created)

```typescript
// In API route file
const updatePreferenceSchema = z
  .object({
    name: z.string().min(1).max(256).optional(),
    people_count: z.number().int().positive().nullable().optional(),
    budget_type: z.string().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided for update" });

const idParamSchema = z.string().uuid();
```

## 4. Response Details

### Success Response (200 OK)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Family Vacation Updated",
    "people_count": 4,
    "budget_type": "medium"
  }
}
```

**Note:** Response includes only public-facing fields. Does not expose `user_id`, `created_at`, `updated_at`, or soft-delete fields.

### Error Responses

**400 Bad Request** - Validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "people_count",
      "issue": "must be a positive integer"
    }
  }
}
```

**400 Bad Request** - Duplicate name:

```json
{
  "error": {
    "code": "DUPLICATE_PREFERENCE_NAME",
    "message": "A preference with this name already exists",
    "details": {
      "field": "name"
    }
  }
}
```

**401 Unauthorized** - Missing/invalid auth:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found** - Preference not found or doesn't belong to user:

```json
{
  "error": {
    "code": "PREFERENCE_NOT_FOUND",
    "message": "Preference not found or access denied"
  }
}
```

**500 Internal Server Error** - Unexpected errors:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Request Flow

```
1. Client Request
   ↓
2. Astro Middleware (inject Supabase client into context.locals)
   ↓
3. API Route Handler (src/pages/api/preferences/[id].ts)
   │
   ├─→ Extract & validate id from URL params (Zod)
   ├─→ Extract user from Supabase auth (getUser() from JWT)
   ├─→ Validate request body (Zod schema)
   ├─→ Check authentication (401 if no user)
   │
   ↓
4. Service Layer (src/lib/services/preferences.service.ts)
   │
   ├─→ Verify preference exists and belongs to user
   ├─→ Check for duplicate name (if name is being updated)
   ├─→ Update preference in database via Supabase
   ├─→ Return updated preference
   │
   ↓
5. API Route Handler
   │
   ├─→ Transform database result to DTO
   ├─→ Wrap in ApiSuccessResponse
   ├─→ Return 200 with updated data
   │
   ↓
6. Client receives response
```

### Database Interaction

**Table:** `user_preferences`

**Update Query Pattern:**

```typescript
const { data, error } = await supabase
  .from("user_preferences")
  .update({
    name: command.name,
    people_count: command.people_count,
    budget_type: command.budget_type,
    updated_at: new Date().toISOString(), // handled by trigger
  })
  .eq("id", command.id)
  .eq("user_id", command.user_id) // ensures user owns the preference
  .select()
  .single();
```

**RLS Policy Required:**

- Policy name: `Users can update own preferences`
- Rule: `user_id = auth.uid()`
- Operation: UPDATE

## 6. Security Considerations

### Authentication

- **Method**: JWT token in Authorization header (Bearer token)
- **Implementation**: Use `context.locals.supabase.auth.getUser()` in API route
- **Action on failure**: Return 401 Unauthorized

### Authorization

- **Check**: Preference must belong to authenticated user
- **Implementation**:
  - Option 1 (Recommended): Rely on Supabase RLS policies with `.eq('user_id', user.id)`
  - Option 2: Explicit check by fetching preference first and comparing user_id
- **Action on failure**: Return 404 Not Found (don't reveal if preference exists but belongs to another user)

### Input Validation

- **Tool**: Zod schemas for type-safe validation
- **Validation points**:
  1. URL parameter (id must be valid UUID)
  2. Request body (all fields must match schema if provided)
  3. Business rules (name uniqueness, positive people_count)

### Data Sanitization

- Zod automatically coerces and validates types
- String fields are automatically trimmed (add .trim() to schema)
- No direct SQL queries (Supabase client handles parameterization)

### CORS

- Handle via Astro response headers if needed for cross-origin requests
- For same-origin requests, CORS not required

### Rate Limiting

- Should be implemented at middleware level (future enhancement)
- Consider per-user limits for update operations

## 7. Error Handling

### Validation Errors (400)

**Trigger Conditions:**

- Invalid UUID format for id parameter
- Empty string for name when provided
- name exceeds 256 characters
- people_count is not a positive integer
- No fields provided in request body
- Duplicate name for same user (UNIQUE constraint)

**Handling:**

```typescript
try {
  const validatedId = idParamSchema.parse(id);
  const validatedBody = updatePreferenceSchema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input data",
          details: error.errors[0],
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

**Unique Constraint Violation:**

```typescript
// In service layer
if (error?.code === "23505") {
  // PostgreSQL unique violation
  throw new Error("DUPLICATE_PREFERENCE_NAME");
}
```

### Authentication Errors (401)

**Trigger Conditions:**

- Missing Authorization header
- Invalid JWT token
- Expired JWT token

**Handling:**

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser();

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

### Not Found Errors (404)

**Trigger Conditions:**

- Preference with given id doesn't exist
- Preference exists but belongs to different user (authorization failure)

**Handling:**

```typescript
// In service layer, after update attempt
if (!data) {
  throw new Error("PREFERENCE_NOT_FOUND");
}

// In API route
if (error?.message === "PREFERENCE_NOT_FOUND") {
  return new Response(
    JSON.stringify({
      error: {
        code: "PREFERENCE_NOT_FOUND",
        message: "Preference not found or access denied",
      },
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

### Server Errors (500)

**Trigger Conditions:**

- Database connection failures
- Unexpected Supabase errors
- Unhandled exceptions

**Handling:**

```typescript
try {
  // ... main logic
} catch (error) {
  console.error("Error updating preference:", error);

  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

## 8. Performance Considerations

### Database Optimization

- **Indexes**: Ensure composite index on `(user_id, name)` exists for unique constraint
- **Query efficiency**: Single update query with `.eq()` clauses is efficient
- **Connection pooling**: Handled by Supabase client

### Response Time

- **Expected**: < 100ms for successful updates
- **Database round trips**: 1 (single update query with RLS)
- **No N+1 queries**: Single atomic operation

### Caching

- **Not applicable**: User preferences are frequently updated and user-specific
- **Cache invalidation**: If implementing caching later, invalidate on update

### Optimization Opportunities

- Consider batch updates if multiple preferences need updating (future feature)
- Add database-level optimistic locking with `updated_at` version checking if needed

## 9. Implementation Steps

### Step 1: Create Service Layer

**File:** `src/lib/services/preferences.service.ts`

**Tasks:**

1. Create `updatePreference` function accepting `UpdatePreferenceCommand`
2. Implement Supabase update query with RLS checks
3. Handle unique constraint violations
4. Transform database result to `UserPreferenceDto`
5. Add proper error handling with custom error types

**Code Structure:**

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { UpdatePreferenceCommand, UserPreferenceDto } from "../types";

export async function updatePreference(
  supabase: SupabaseClient,
  command: UpdatePreferenceCommand
): Promise<UserPreferenceDto> {
  // Implementation
}
```

### Step 2: Create Zod Validation Schemas

**File:** `src/pages/api/preferences/[id].ts` (inline) or `src/lib/validators/preference.validators.ts` (shared)

**Tasks:**

1. Create `updatePreferenceSchema` for request body validation
2. Create `idParamSchema` for URL parameter validation
3. Add refinement for "at least one field" requirement
4. Export schemas for reuse in tests

### Step 3: Create API Route Handler

**File:** `src/pages/api/preferences/[id].ts`

**Tasks:**

1. Export `const prerender = false` for SSR
2. Create `PUT` function handler
3. Extract and validate id from URL params
4. Extract user from Supabase auth
5. Validate request body with Zod
6. Call service layer with `UpdatePreferenceCommand`
7. Transform result and return response
8. Implement comprehensive error handling

**Code Structure:**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { updatePreference } from "../../../lib/services/preferences.service";
import type { UpdatePreferenceCommand } from "../../../types";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, locals }) => {
  // Implementation
};
```

### Step 4: Add Type Definitions (if missing)

**File:** `src/types.ts`

**Tasks:**

1. Verify `UpdateUserPreferenceDto` is correctly defined (lines 92-96) ✓
2. Verify `UserPreferenceDto` is correctly defined (line 74) ✓
3. Verify `UpdatePreferenceCommand` is correctly defined (lines 288-294) ✓
4. Ensure `ApiSuccessResponse` and `ApiErrorResponse` are exported ✓

**Status:** All types already defined, no action needed.

### Step 5: Add Database Migration (if needed)

**File:** `supabase/migrations/XXX_add_user_preferences_rls.sql`

**Tasks:**

1. Ensure RLS is enabled on `user_preferences` table
2. Create policy: `Users can update own preferences`
3. Verify indexes exist: primary key on `id`, unique index on `(user_id, name)`
4. Verify `updated_at` trigger exists

**SQL Example:**

```sql
-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Update policy
CREATE POLICY "Users can update own preferences"
ON user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Ensure indexes exist
CREATE UNIQUE INDEX IF NOT EXISTS user_preferences_user_name_unique
ON user_preferences(user_id, name);
```

### Step 6: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

**Tasks:**

1. Verify Supabase client is injected into `context.locals` ✓
2. Add authentication middleware if not exists (extract user early)
3. Add request logging for API routes (optional)

**Status:** Basic middleware exists, may need authentication enhancement.

### Step 7: Add Unit Tests

**File:** `src/lib/services/__tests__/preferences.service.test.ts`

**Tasks:**

1. Test successful update with all fields
2. Test successful update with partial fields
3. Test unique constraint violation handling
4. Test not found error (non-existent id)
5. Test authorization (different user_id)
6. Mock Supabase client responses

### Step 8: Add Integration Tests

**File:** `tests/api/preferences.test.ts`

**Tasks:**

1. Test PUT with valid authentication and data
2. Test PUT with missing authentication (401)
3. Test PUT with invalid id format (400)
4. Test PUT with validation errors (400)
5. Test PUT with duplicate name (400)
6. Test PUT for non-existent preference (404)
7. Test PUT for another user's preference (404)

### Step 9: Update API Documentation

**File:** `docs/api/preferences.md` or similar

**Tasks:**

1. Document PUT endpoint with examples
2. Add authentication requirements
3. Document all possible error codes
4. Add cURL examples for testing

### Step 10: Manual Testing Checklist

**Tasks:**

1. Test with valid JWT token and data
2. Test with expired JWT token
3. Test with malformed request body
4. Test with non-existent preference id
5. Test with another user's preference id
6. Test duplicate name scenario
7. Verify timestamps update correctly
8. Test with each field individually (partial updates)
9. Verify response format matches specification

## 10. Implementation Checklist

- [ ] Create `src/lib/services/preferences.service.ts` with `updatePreference` function
- [ ] Create Zod validation schemas for request body and id parameter
- [ ] Create API route at `src/pages/api/preferences/[id].ts` with PUT handler
- [ ] Verify all required types exist in `src/types.ts`
- [ ] Create/verify database RLS policies for user_preferences UPDATE
- [ ] Ensure middleware injects Supabase client into context
- [ ] Write unit tests for service layer
- [ ] Write integration tests for API endpoint
- [ ] Update API documentation
- [ ] Perform manual testing with various scenarios
- [ ] Verify error responses match specification
- [ ] Check performance (response time < 100ms)
- [ ] Review security considerations (auth, validation, RLS)

## 11. Testing Scenarios Summary

### Happy Path

1. ✓ Update all fields with valid data
2. ✓ Update only name
3. ✓ Update only people_count
4. ✓ Update only budget_type
5. ✓ Set nullable fields to null

### Error Cases

1. ✓ Missing authentication token (401)
2. ✓ Invalid JWT token (401)
3. ✓ Invalid UUID format for id (400)
4. ✓ Empty request body (400)
5. ✓ Invalid people_count (negative, zero) (400)
6. ✓ Name too long (> 256 chars) (400)
7. ✓ Duplicate name for user (400)
8. ✓ Non-existent preference id (404)
9. ✓ Attempting to update another user's preference (404)

### Edge Cases

1. ✓ Update with same values (should succeed, update timestamp)
2. ✓ Update name to existing name of same preference (should succeed)
3. ✓ Concurrent updates (last write wins, verify no data corruption)
4. ✓ Update immediately after creation
5. ✓ Very long budget_type string (should succeed if within column limits)

## 12. Dependencies

### NPM Packages (already in project)

- `@supabase/supabase-js` - Supabase client
- `zod` - Validation
- `astro` - Framework

### Internal Dependencies

- `src/db/supabase.client.ts` - Supabase client instance
- `src/db/database.types.ts` - Generated database types
- `src/types.ts` - Application DTOs and commands
- `src/middleware/index.ts` - Middleware for context injection

### External Services

- Supabase instance (PostgreSQL + Auth)

## 13. Rollout Plan

1. **Development**: Implement all steps in feature branch
2. **Unit Testing**: Verify service layer logic
3. **Integration Testing**: Test full request/response cycle
4. **Code Review**: Peer review focusing on security and error handling
5. **Staging Deployment**: Deploy to staging environment
6. **Manual QA**: Run through all test scenarios
7. **Production Deployment**: Deploy during low-traffic period
8. **Monitoring**: Watch for errors in logs, verify success rate
9. **Documentation**: Update API docs and developer guides

## 14. Success Metrics

- [ ] All tests pass (unit + integration)
- [ ] Response time < 100ms for p95
- [ ] Zero 500 errors in production
- [ ] Proper error responses for all validation failures
- [ ] Authentication and authorization working correctly
- [ ] No security vulnerabilities identified in review
- [ ] API documentation complete and accurate
