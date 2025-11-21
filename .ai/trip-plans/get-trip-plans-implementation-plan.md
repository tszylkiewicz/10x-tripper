# API Endpoint Implementation Plan: GET /api/trip-plans

## 1. Endpoint Overview

**Purpose**: Retrieve all accepted/saved trip plans for the authenticated user.

**HTTP Method**: GET
**URL Pattern**: `/api/trip-plans`
**Authentication**: Required (Supabase session)
**Authorization**: Users can only access their own trip plans (filtered by user_id)

This endpoint serves as the primary way for users to fetch their saved trip plans. Plans are returned sorted by start_date (ascending - nearest date first), and only includes active plans (soft-deleted plans are excluded). Returns fully structured trip plan data including nested activities, accommodation, and other details.

---

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

```
/api/trip-plans
```

### Query Parameters

**None** - This endpoint does not accept any query parameters for MVP.

**Note**:

- Sorting is fixed to `start_date ASC` (nearest date first)
- Only active plans are returned (deleted plans are excluded by default)
- Advanced filtering and sorting options may be added in future iterations

### Request Headers

- `Cookie`: Session cookie from Supabase authentication

### Example Requests

```
GET /api/trip-plans
```

---

## 3. Utilized Types

### Input Types

**GetTripPlansQueryDto** (from `src/types.ts`)

```typescript
// No query parameters for MVP - returns only active plans sorted by start_date ASC
export type GetTripPlansQueryDto = Record<string, never>;
```

### Output Types

**TripPlanDto** (from `src/types.ts`)

```typescript
export type TripPlanDto = Pick<
  Tables<"trip_plans">,
  "id" | "destination" | "start_date" | "end_date" | "people_count" | "budget_type"
> & {
  plan_details: PlanDetailsDto;
};
```

**ApiSuccessResponse<TripPlanDto[]>** (from `src/types.ts`)

```typescript
export interface ApiSuccessResponse<T> {
  data: T;
}
```

**ApiErrorResponse** (from `src/types.ts`)

```typescript
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Validation Schema

**Not required for MVP** - Since this endpoint does not accept any query parameters, no validation schema is needed.

---

## 4. Response Details

### Success Response (200 OK)

**Structure**:

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "destination": "Paris, France",
      "start_date": "2025-06-15",
      "end_date": "2025-06-22",
      "people_count": 2,
      "budget_type": "medium",
      "plan_details": {
        "days": [
          {
            "day": 1,
            "date": "2025-06-15",
            "activities": [
              {
                "time": "10:00",
                "title": "Visit Eiffel Tower",
                "description": "Iconic landmark with stunning city views",
                "location": "Champ de Mars, Paris",
                "estimated_cost": 25,
                "duration": "2 hours",
                "category": "Sightseeing"
              }
            ]
          }
        ],
        "accommodation": {
          "name": "Hotel Paris Central",
          "address": "123 Rue de Rivoli, Paris",
          "check_in": "2025-06-15",
          "check_out": "2025-06-22",
          "estimated_cost": 800,
          "booking_url": "https://booking.com/hotel-paris"
        },
        "notes": "Remember to book museum tickets in advance",
        "total_estimated_cost": 1500
      }
    }
  ]
}
```

**Status Code**: `200 OK`

**Note**: The response array may be empty if the user has no saved trip plans.

### Error Responses

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "details": {
      "timestamp": "2025-01-15T10:30:00Z"
    }
  }
}
```

---

## 5. Data Flow

### Request Flow Diagram

```
1. Client sends GET request (no parameters)
   ↓
2. Authentication Check
   - Verify user session via locals.supabase.auth.getUser()
   - Return 401 if not authenticated
   ↓
3. Service Layer (TripPlansService)
   - Build Supabase query with user_id filter
   - Filter out soft-deleted plans (deleted_at IS NULL)
   - Apply fixed sorting by start_date ASC
   - Execute query
   ↓
4. Data Transformation
   - Map database Row to TripPlanDto
   - Ensure plan_details is properly typed as PlanDetailsDto
   ↓
5. Response Construction
   - Wrap data in ApiSuccessResponse
   - Return 200 OK with JSON payload
```

### Database Query Logic

**Base Query**:

```typescript
const query = supabase
  .from("trip_plans")
  .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
  .eq("user_id", userId);
```

**Soft-Delete Filtering**:

```typescript
// Always exclude soft-deleted records in MVP
query.is("deleted_at", null);
```

**Sorting**:

```typescript
// Fixed sorting by start_date ASC (nearest date first)
query.order("start_date", { ascending: true });
```

**Complete Query Example**:

```typescript
const { data, error } = await this.supabase
  .from("trip_plans")
  .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
  .eq("user_id", userId)
  .is("deleted_at", null) // Always exclude soft-deleted plans
  .order("start_date", { ascending: true });
```

---

## 6. Security Considerations

### Authentication

- **Requirement**: Valid Supabase session required
- **Implementation**: Use `locals.supabase.auth.getUser()` to verify authentication
- **Error Handling**: Return 401 Unauthorized if session is invalid or missing

```typescript
const {
  data: { user },
  error: authError,
} = await locals.supabase.auth.getUser();

if (authError || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const userId = user.id;
```

### Authorization

- **Row-Level Security**: Always filter by `user_id` to prevent unauthorized access
- **Data Isolation**: Users can only see their own trip plans
- **Soft Deletes**: Always exclude soft-deleted plans (`deleted_at IS NULL`)

### Input Validation

- **No Query Parameters**: Endpoint does not accept query parameters for MVP
- **Injection Prevention**: Use Supabase client's parameterized queries (built-in protection)

### Data Exposure

- **Field Selection**: Only return fields defined in TripPlanDto
- **Excluded Fields**: Never expose `user_id`, `deleted_at`, `deleted_by`, `generation_id` in response
- **Sensitive Data**: Ensure plan_details doesn't contain PII or sensitive information

### Additional Security Measures

- **Rate Limiting**: Consider implementing rate limiting for this endpoint (future enhancement)
- **CORS**: Configure CORS headers appropriately for production
- **HTTPS Only**: Ensure API is only accessible via HTTPS in production

---

## 7. Error Handling

### Error Categories and Responses

#### 1. Authentication Errors (401)

**Scenario**: Missing or invalid authentication token

**Detection**:

```typescript
const {
  data: { user },
  error: authError,
} = await locals.supabase.auth.getUser();
if (authError || !user) {
  // Handle 401
}
```

**Response**:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 2. Database Errors (500)

**Scenarios**:

- Supabase connection failures
- Query execution errors
- Unexpected database errors

**Detection**:

```typescript
const { data, error } = await this.supabase.from("trip_plans").select(...);
if (error) {
  console.error("Database error in getTripPlans:", error);
  throw error;
}
```

**Response**:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later.",
    "details": {
      "timestamp": "2025-01-15T10:30:00Z"
    }
  }
}
```

**Logging**: Log full error details to console for debugging (never expose to client)

#### 4. Unexpected Errors (500)

**Scenarios**:

- Unhandled exceptions
- Type conversion errors
- JSON parsing errors

**Handling**:

```typescript
try {
  // API logic
} catch (error) {
  console.error("Unexpected error in GET /api/trip-plans:", {
    error: error instanceof Error ? { message: error.message, name: error.name } : error,
    timestamp: new Date().toISOString(),
  });

  // Return generic 500 response
}
```

### Error Handling Best Practices

- **Never expose sensitive information** in error messages
- **Log detailed errors** to console for debugging
- **Return user-friendly messages** in API responses
- **Include timestamps** in error responses for correlation
- **Use consistent error codes** (e.g., VALIDATION_ERROR, UNAUTHORIZED, INTERNAL_SERVER_ERROR)

---

## 8. Performance Considerations

### Database Query Optimization

1. **Indexing**
   - Ensure indexes exist on `user_id` column (primary filter)
   - Ensure index exists on `start_date` (for sorting)
   - Ensure index exists on `deleted_at` (for soft-delete filtering)
   - Consider composite index on `(user_id, deleted_at, start_date)` for optimal query performance

2. **Query Efficiency**
   - Use `.select()` to fetch only required columns (avoid `SELECT *`)
   - Apply filters before sorting to reduce dataset size
   - Use Supabase's built-in query optimization

3. **Pagination** (Future Enhancement)
   - Current implementation returns all records
   - Consider adding pagination for users with many trip plans:
     - Add `limit` and `offset` query parameters
     - Add `page` and `page_size` query parameters
     - Return pagination metadata (total_count, page, page_size)

### Response Size Management

1. **JSONB Handling**
   - `plan_details` can be large (nested days, activities, accommodation)
   - Monitor response sizes for users with extensive trip plans
   - Consider compression for large responses (gzip)

2. **Field Selection**
   - Only return fields defined in TripPlanDto
   - Exclude unnecessary fields (user_id, deleted_at, etc.)

### Caching Strategy (Future Enhancement)

1. **Client-Side Caching**
   - Add `Cache-Control` headers for appropriate caching
   - Use ETags for conditional requests
   - Implement `If-None-Match` support

2. **Server-Side Caching**
   - Consider Redis caching for frequently accessed trip plans
   - Invalidate cache on updates, deletes, or new creations
   - Set appropriate TTL (Time To Live) values

### Monitoring

1. **Performance Metrics**
   - Track query execution time
   - Monitor response payload sizes
   - Track error rates and types

2. **Alerting**
   - Set up alerts for slow queries (> 1 second)
   - Monitor for unusual error rates
   - Track authentication failures

---

## 9. Implementation Steps

### Step 1: Create TripPlansService

**File**: `src/lib/services/tripPlans.service.ts`

Create service class with `getTripPlans` method:

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { GetTripPlansQueryDto, TripPlanDto } from "../../types";

export class TripPlansService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all active trip plans for a specific user
   * Plans are sorted by start_date ascending (nearest date first)
   * Soft-deleted plans are always excluded
   *
   * @param userId - The ID of the user whose trip plans to retrieve
   * @returns Array of trip plans as TripPlanDto[], sorted by start_date ASC
   * @throws Error if database operation fails
   */
  async getTripPlans(userId: string): Promise<TripPlanDto[]> {
    // Build query - always exclude soft-deleted plans
    const { data, error } = await this.supabase
      .from("trip_plans")
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .eq("user_id", userId)
      .is("deleted_at", null) // Always exclude soft-deleted plans
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Database error in getTripPlans:", error);
      throw new Error("Failed to fetch trip plans");
    }

    return data as TripPlanDto[];
  }
}
```

### Step 2: Create API Route Handler

**File**: `src/pages/api/trip-plans.ts`

Create GET handler following existing patterns:

```typescript
import type { APIRoute } from "astro";
import { TripPlansService } from "../../lib/services/tripPlans.service";
import type { ApiSuccessResponse, ApiErrorResponse, TripPlanDto } from "../../types";

export const prerender = false;

/**
 * GET handler - Retrieve all active trip plans for authenticated user
 * Returns plans sorted by start_date ASC (nearest date first)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Verify authentication
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Fetch trip plans using service
    const tripPlansService = new TripPlansService(locals.supabase);
    const tripPlans = await tripPlansService.getTripPlans(user.id);

    // 3. Return success response
    const successResponse: ApiSuccessResponse<TripPlanDto[]> = {
      data: tripPlans,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 4. Handle unexpected errors
    console.error("Unexpected error in GET /api/trip-plans:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        details: { timestamp: new Date().toISOString() },
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 3: Manual Testing

Test the endpoint with various scenarios:

1. **Successful Request** (authenticated user with trip plans):

   ```bash
   curl -X GET "http://localhost:4321/api/trip-plans" \
     -H "Cookie: sb-access-token=<valid-token>"
   ```

   Expected: 200 OK with array of active trip plans sorted by start_date ASC

2. **Unauthenticated Request**:

   ```bash
   curl -X GET "http://localhost:4321/api/trip-plans"
   ```

   Expected: 401 Unauthorized

3. **Empty Result Set** (authenticated user with no trip plans):

   ```bash
   curl -X GET "http://localhost:4321/api/trip-plans" \
     -H "Cookie: sb-access-token=<valid-token>"
   ```

   Expected: 200 OK with empty array

4. **Verify Soft-Deleted Plans are Excluded**:
   - Create a trip plan via POST /api/trip-plans
   - Verify it appears in GET /api/trip-plans
   - Soft-delete it via DELETE /api/trip-plans/:id
   - Verify it no longer appears in GET /api/trip-plans

### Step 4: Integration Testing (Future)

Create integration tests using a testing framework (e.g., Vitest):

- Test authentication flow
- Test that soft-deleted plans are excluded
- Test sorting (start_date ASC)
- Test error handling scenarios
- Test with mock Supabase client

### Step 5: Documentation

Update API documentation:

- Add endpoint to API reference documentation
- Include example requests and responses
- Document that only active plans are returned
- Add authentication requirements

### Step 6: Deployment Checklist

Before deploying to production:

- [ ] Verify database indexes exist on user_id, start_date, deleted_at
- [ ] Consider composite index (user_id, deleted_at, start_date) for optimal performance
- [ ] Test authentication flow with real Supabase sessions
- [ ] Verify CORS configuration for frontend domain
- [ ] Enable HTTPS only in production
- [ ] Set up monitoring and alerting
- [ ] Review error logging (ensure no sensitive data is logged)
- [ ] Test with production-like data volumes
- [ ] Verify rate limiting configuration (if applicable)
- [ ] Update frontend to consume this endpoint

---

## 10. Additional Notes

### Future Enhancements

1. **Include Deleted Plans**: Add `include_deleted` query parameter for accessing soft-deleted plans (admin/audit purposes)
2. **Advanced Sorting**: Add query parameters for flexible sorting (sort_by, sort_order)
3. **Pagination**: Add limit/offset or cursor-based pagination for large result sets
4. **Filtering**: Add additional filters (destination, date range, budget_type)
5. **Search**: Implement full-text search on destination or plan_details
6. **Caching**: Implement Redis caching for frequently accessed data
7. **GraphQL**: Consider GraphQL API for more flexible querying
8. **Real-time**: Add WebSocket support for real-time updates

### Related Endpoints

This endpoint is part of the Trip Plans API family:

- `POST /api/trip-plans/generate` - Generate new trip plan with AI
- `POST /api/trip-plans` - Accept and save generated trip plan
- `GET /api/trip-plans/:id` - Get single trip plan by ID
- `PATCH /api/trip-plans/:id` - Update existing trip plan
- `DELETE /api/trip-plans/:id` - Soft-delete trip plan

### Dependencies

- Astro 5 (API Routes)
- Supabase Client (database access)
- Zod (validation)
- TypeScript 5 (type safety)

### Testing Considerations

- Mock Supabase client for unit tests
- Use test database for integration tests
- Test with various user scenarios (no plans, many plans, soft-deleted plans)
- Test authentication edge cases (expired tokens, invalid sessions)
- Test that soft-deleted plans are never returned
