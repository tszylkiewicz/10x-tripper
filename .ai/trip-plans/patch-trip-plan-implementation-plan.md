# API Endpoint Implementation Plan: PATCH /api/trip-plans/:id

## 1. Przegląd punktu końcowego

**Cel**: Aktualizacja zapisanego planu podróży (ręczne edycje użytkownika).

**Kluczowe zachowania**:

- Wszystkie pola w body są opcjonalne
- Jeśli modyfikowane jest pole `plan_details` i obecne `source` to "ai", automatycznie zmieniane jest na "ai-edited"
- Modyfikacja innych pól (destination, dates, etc.) NIE zmienia pola `source`
- Użytkownik może edytować tylko własne plany (zabezpieczenie przez RLS)

**Metoda HTTP**: PATCH

**Struktura URL**: `/api/trip-plans/:id`

---

## 2. Szczegóły żądania

### URL Parameters

- **id** (wymagany, uuid) - Identyfikator planu podróży

### Request Headers

- `Content-Type: application/json`
- `Authorization: Bearer <token>` (do dodania w przyszłości)

### Request Body (wszystkie pola opcjonalne)

```typescript
{
  destination?: string;              // np. "Paris, France"
  start_date?: string;               // ISO date: "2025-06-15"
  end_date?: string;                 // ISO date: "2025-06-23"
  people_count?: number;             // >= 1
  budget_type?: string;              // np. "low", "medium", "high"
  plan_details?: PlanDetailsDto;     // Zagnieżdżona struktura
}
```

### Przykład Request Body

```json
{
  "destination": "Paris, France",
  "start_date": "2025-06-15",
  "end_date": "2025-06-23",
  "people_count": 3,
  "budget_type": "high",
  "plan_details": {
    "days": [
      {
        "day": 1,
        "date": "2025-06-15",
        "activities": [
          {
            "time": "09:00",
            "title": "Visit Eiffel Tower",
            "description": "Morning tour",
            "location": "Champ de Mars",
            "estimated_cost": 25,
            "duration": "2 hours",
            "category": "sightseeing"
          }
        ]
      }
    ],
    "accommodation": {
      "name": "Hotel Paris",
      "address": "123 Rue de la Paix",
      "check_in": "2025-06-15",
      "check_out": "2025-06-23",
      "estimated_cost": 1200
    },
    "notes": "Remember to book restaurants in advance",
    "total_estimated_cost": 2500
  }
}
```

---

## 3. Wykorzystywane typy

### DTOs (Request/Response)

- **UpdateTripPlanDto** (src/types.ts:181-188) - Request body type
- **TripPlanDto** (src/types.ts:111-116) - Response type
- **PlanDetailsDto** (src/types.ts:54-60) - Nested structure dla plan_details
- **DayDto** (src/types.ts:32-36) - Struktura dnia w planie
- **ActivityDto** (src/types.ts:19-27) - Struktura aktywności
- **AccommodationDto** (src/types.ts:41-48) - Struktura zakwaterowania
- **ApiSuccessResponse<T>** (src/types.ts:330-332)
- **ApiErrorResponse** (src/types.ts:338-344)

### Command Models (Service Layer)

- **UpdatePlanCommand** (src/types.ts:253-262) - Command przekazywany do serwisu

### Database Types (Internal)

- **TripPlanUpdate** (src/types.ts:398-414) - Type dla operacji UPDATE na bazie

---

## 4. Szczegóły odpowiedzi

### Success Response (200 OK)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-23",
    "people_count": 3,
    "budget_type": "high",
    "plan_details": {
      "days": [...],
      "accommodation": {...},
      "notes": "...",
      "total_estimated_cost": 2500
    }
  }
}
```

**Uwaga**: Response NIE zawiera pól: `user_id`, `generation_id`, `source`, `created_at`, `updated_at`, `deleted_at`, `deleted_by` (zgodnie z TripPlanDto).

### Error Responses

#### 400 Bad Request - Invalid UUID

```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "The provided ID is not a valid UUID format",
    "details": {
      "field": "id",
      "value": "invalid-id"
    }
  }
}
```

#### 400 Bad Request - Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {
      "people_count": ["People count must be a positive integer (>= 1)"],
      "end_date": ["End date must be greater than or equal to start date"]
    }
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "TRIP_PLAN_NOT_FOUND",
    "message": "Trip plan not found or doesn't belong to user"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while processing your request"
  }
}
```

---

## 5. Przepływ danych

### 5.1 High-Level Flow

```
Client Request
    ↓
[API Route: PATCH /api/trip-plans/:id]
    ↓
1. Extract & validate UUID from params
2. Parse & validate JSON body (Zod schema)
3. Extract user_id from session (TODO: implement auth)
4. Build UpdatePlanCommand
    ↓
[TripPlansService]
    ↓
5. Validate command (business rules)
6. Fetch current trip plan from DB
7. Check if plan_details changed
8. Build update object
9. If plan_details changed & source="ai" → set source="ai-edited"
10. Execute UPDATE query with RLS
    ↓
[Supabase Database]
    ↓
11. RLS verifies user_id ownership
12. Update trip_plans table
13. updated_at trigger fires
14. Return updated row
    ↓
[TripPlansService]
    ↓
15. Map database row to TripPlanDto
16. Return to API route
    ↓
[API Route]
    ↓
17. Wrap in ApiSuccessResponse
18. Return 200 with JSON
    ↓
Client Response
```

### 5.2 Detailed Data Flow

#### Step 1-2: API Route - Request Validation

```typescript
// Extract ID from params
const id = params.id;

// Validate UUID format
if (!isValidUUID(id)) {
  return 400 with INVALID_UUID error
}

// Parse JSON body
const body = await request.json();

// Validate with Zod schema
const validatedData = updateTripPlanSchema.parse(body);
```

#### Step 3-4: Command Building

```typescript
// Extract user_id from session (placeholder for now)
const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533"; // TODO: from auth

// Build command
const command: UpdatePlanCommand = {
  id,
  user_id: userId,
  ...validatedData, // spread validated fields
};
```

#### Step 5-9: Service - Business Logic

```typescript
// In TripPlansService.updateTripPlan(command)

// 1. Validate command
this.validateUpdateCommand(command);

// 2. Fetch current plan to check source
const current = await this.getTripPlanById(command.id, command.user_id);
if (!current) return null; // Will result in 404

// 3. Build update object
const updateData: TripPlanUpdate = {};

// Copy provided fields
if (command.destination !== undefined) updateData.destination = command.destination;
if (command.start_date !== undefined) updateData.start_date = command.start_date;
if (command.end_date !== undefined) updateData.end_date = command.end_date;
if (command.people_count !== undefined) updateData.people_count = command.people_count;
if (command.budget_type !== undefined) updateData.budget_type = command.budget_type;

// Handle plan_details and source change logic
if (command.plan_details !== undefined) {
  updateData.plan_details = command.plan_details;

  // If source was "ai", change to "ai-edited"
  if (current.source === "ai") {
    updateData.source = "ai-edited";
  }
}

// 4. Execute UPDATE
const { data, error } = await this.supabase
  .from("trip_plans")
  .update(updateData)
  .eq("id", command.id)
  .eq("user_id", command.user_id) // RLS also checks this
  .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
  .single();
```

#### Step 10-14: Database Operations

- RLS policy `tp_owner` verifies: `user_id = auth.uid()`
- UPDATE query executes
- Trigger `set_updated_trip_plans` fires, setting `updated_at = now()`
- Updated row returned

#### Step 15-18: Response Mapping

```typescript
// Map to TripPlanDto
const tripPlan: TripPlanDto = {
  id: data.id,
  destination: data.destination,
  start_date: data.start_date,
  end_date: data.end_date,
  people_count: data.people_count,
  budget_type: data.budget_type,
  plan_details: data.plan_details as PlanDetailsDto,
};

// Wrap in success response
const response: ApiSuccessResponse<TripPlanDto> = {
  data: tripPlan,
};

return new Response(JSON.stringify(response), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

---

## 6. Względy bezpieczeństwa

### 6.1 Authentication (TODO - not yet implemented)

- **Obecnie**: Używany placeholder `userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533"`
- **Docelowo**:
  ```typescript
  const session = await locals.supabase.auth.getSession();
  if (!session?.user?.id) {
    return 401 Unauthorized
  }
  const userId = session.user.id;
  ```

### 6.2 Authorization

- **RLS Policy**: `CREATE POLICY tp_owner ON trip_plans USING (user_id = auth.uid())`
- Zapewnia, że użytkownik może edytować tylko własne plany
- Nawet jeśli użytkownik poda cudzy `id`, RLS zwróci 0 rows (404)

### 6.3 Input Validation

#### API Layer (Zod)

- **UUID validation**: Wykorzystanie `isValidUUID()` utility
- **JSON parsing**: Try-catch na `request.json()`
- **Schema validation**: Zod schema dla wszystkich pól
- **Type safety**: TypeScript zapewnia zgodność typów

#### Service Layer

- **Business rules validation**:
  - At least one field must be provided
  - `end_date >= start_date`
  - `people_count >= 1`
  - `plan_details` structure validation (days array not empty, etc.)
- **Data sanitization**: String trimming, null handling

### 6.4 SQL Injection Protection

- **Supabase client**: Używa parameterized queries
- **No raw SQL**: Wszystkie operacje przez Supabase Query Builder
- **Type-safe queries**: TypeScript types zapobiegają błędom

### 6.5 XSS Protection

- **API zwraca JSON**: Brak bezpośredniego renderowania HTML
- **Frontend responsibility**: Frontend musi sanitize dane przed wyświetleniem
- **No script execution**: API nie wykonuje żadnego kodu z user input

### 6.6 Data Leakage Prevention

- **TripPlanDto**: Eksponuje tylko bezpieczne pola (id, destination, dates, plan_details)
- **Ukryte pola**: `user_id`, `generation_id`, `source`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`
- **Error messages**: Generic messages (nie ujawniają struktury DB)

### 6.7 Rate Limiting (Future)

- **Recommendation**: Dodać rate limiting middleware (np. 100 requests/min per user)
- **Implementation**: Można użyć Supabase Edge Functions z Deno KV lub zewnętrzny serwis (Redis)

---

## 7. Obsługa błędów

### 7.1 Client Errors (4xx)

#### 400 Bad Request

**Scenario 1: Invalid UUID format**

```typescript
if (!id || !isValidUUID(id)) {
  return {
    error: {
      code: "INVALID_UUID",
      message: "The provided ID is not a valid UUID format",
      details: { field: "id", value: id },
    },
  };
}
```

**Scenario 2: Invalid JSON body**

```typescript
try {
  body = await request.json();
} catch (e) {
  return {
    error: {
      code: "INVALID_JSON",
      message: "Request body must be valid JSON",
    },
  };
}
```

**Scenario 3: Zod validation failure**

```typescript
const validationResult = updateTripPlanSchema.safeParse(body);

if (!validationResult.success) {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message: "Input validation failed",
      details: validationResult.error.flatten().fieldErrors,
    },
  };
}
```

**Scenario 4: Service-level validation failure**

```typescript
if (error instanceof ValidationError) {
  return {
    error: {
      code: "VALIDATION_ERROR",
      message: error.message,
      details: { field: error.field },
    },
  };
}
```

**Example validation errors**:

- "At least one field must be provided for update"
- "End date must be greater than or equal to start date"
- "People count must be a positive integer (>= 1)"
- "Destination cannot be empty"
- "Plan details must contain at least one day"

#### 401 Unauthorized

**Scenario: Missing or invalid auth token** (TODO: implement)

```typescript
const session = await locals.supabase.auth.getSession();

if (!session?.user?.id) {
  return {
    error: {
      code: "UNAUTHORIZED",
      message: "Missing or invalid authentication token",
    },
  };
}
```

#### 404 Not Found

**Scenario: Trip plan not found or doesn't belong to user**

```typescript
const updatedPlan = await tripPlansService.updateTripPlan(command);

if (!updatedPlan) {
  return {
    error: {
      code: "TRIP_PLAN_NOT_FOUND",
      message: "Trip plan not found or doesn't belong to user",
    },
  };
}
```

**Uwaga**: RLS automatycznie filtruje plany, które nie należą do użytkownika, więc nie ma potrzeby osobnej autoryzacji.

### 7.2 Server Errors (5xx)

#### 500 Internal Server Error

**Scenario 1: Database connection failure**

```typescript
catch (error) {
  console.error("Unexpected error in PATCH /api/trip-plans/:id:", {
    error: error instanceof Error ? { message: error.message, name: error.name } : error,
    timestamp: new Date().toISOString(),
  });

  return {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while processing your request",
    }
  };
}
```

**Scenario 2: Unexpected errors**

- Database timeout
- Supabase client errors
- JSON serialization errors

**Error logging**:

- Log tylko dla 500 errors (unexpected)
- Log zawiera: error name, message, timestamp
- **NIE** logować do `plan_generation_error_logs` (tylko dla AI generation errors)

### 7.3 Error Handling Best Practices

1. **Never expose sensitive data** in error messages
2. **Log errors server-side** with context (timestamp, user_id, etc.)
3. **Return generic messages** for 500 errors
4. **Return specific messages** for 400 errors (validation)
5. **Use consistent error structure** (ApiErrorResponse type)
6. **Include error codes** for client-side handling
7. **Provide details field** for validation errors

---

## 8. Rozważania dotyczące wydajności

### 8.1 Database Query Optimization

**Current approach**:

- Single UPDATE query with `.eq()` filters
- `.select()` only required fields (no `SELECT *`)
- `.single()` ensures single row response

**Indexes**:

- **Primary Key** (`id`): Automatyczny index, bardzo szybkie wyszukiwanie
- **User Index** (`user_id`): Istniejący index przyspiesza RLS checks
- **No full table scan**: Dzięki indexom na `id` i `user_id`

**Potential optimization**:

- Jeśli plan_details jest bardzo duże (>100KB), można rozważyć:
  - Kompresję JSON na poziomie aplikacji
  - Partial updates (JSON merge patches)
  - Ale **nie w MVP** - premature optimization

### 8.2 Request/Response Size

**Request body size**:

- Estimated: 10-50 KB dla typowego planu (5-10 dni)
- Max reasonable: 200 KB (bardzo szczegółowy plan)
- **Recommendation**: Dodać limit rozmiaru body (np. 500 KB) w przyszłości

**Response size**:

- Similar to request (10-50 KB typowo)
- Compression: Astro/hosting platform powinny używać gzip/brotli

### 8.3 Latency Considerations

**Expected latency breakdown**:

- UUID validation: <1ms
- JSON parsing: 1-5ms (depends on size)
- Zod validation: 1-10ms (depends on schema complexity)
- Database query: 10-50ms (depends on DB location, network)
- Response serialization: 1-5ms

**Total expected**: 20-70ms (without auth)

**Bottlenecks**:

- **Database latency**: Największy contributor
  - Solution: Ensure DB is in same region as API
  - Supabase typically has <10ms latency for simple queries
- **plan_details validation**: If very complex schema
  - Solution: Keep Zod schema efficient, avoid deep nesting validation

### 8.4 Concurrent Updates

**Issue**: Two clients updating same trip plan simultaneously

**Current behavior**:

- Last write wins (standard UPDATE behavior)
- `updated_at` trigger overwrites timestamp

**Future consideration** (nie w MVP):

- **Optimistic locking**: Add `version` column, check on update
- **Pessimistic locking**: Use `SELECT FOR UPDATE` (overkill dla MVP)
- **Conflict resolution**: Return 409 Conflict if version mismatch

**MVP approach**: Accept last-write-wins, document this behavior

### 8.5 Caching Considerations

**API Response Caching**: **NIE** cachować (dane są user-specific i często się zmieniają)

**Database Query Caching**: Supabase/Postgres może cachować query plans (automatic)

**Client-side Caching**:

- Frontend może cachować response lokalnie (np. React Query)
- Cache invalidation po successful UPDATE

### 8.6 Monitoring & Metrics (Future)

**Recommended metrics**:

- Request latency (p50, p95, p99)
- Error rate (4xx, 5xx)
- Validation failure rate
- Database query latency
- Response size distribution

**Tools**:

- Supabase Dashboard (query performance)
- Custom logging (request duration)
- APM tool (np. Sentry, DataDog) w przyszłości

---

## 9. Etapy wdrożenia

### 9.1 Utworzenie walidatora Zod (nowy plik)

**Plik**: `src/lib/validators/tripPlans.validator.ts`

```typescript
import { z } from "zod";

// Helper schemas for nested structures
const activitySchema = z.object({
  time: z.string().min(1, "Activity time is required"),
  title: z.string().min(1, "Activity title is required"),
  description: z.string().min(1, "Activity description is required"),
  location: z.string().min(1, "Activity location is required"),
  estimated_cost: z.number().nonnegative().optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
});

const daySchema = z.object({
  day: z.number().int().positive("Day must be a positive integer"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  activities: z.array(activitySchema).min(1, "Each day must have at least one activity"),
});

const accommodationSchema = z.object({
  name: z.string().min(1, "Accommodation name is required"),
  address: z.string().min(1, "Accommodation address is required"),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in date must be in YYYY-MM-DD format"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out date must be in YYYY-MM-DD format"),
  estimated_cost: z.number().nonnegative().optional(),
  booking_url: z.string().url().optional().or(z.literal("")),
});

const planDetailsSchema = z.object({
  days: z.array(daySchema).min(1, "Plan must contain at least one day"),
  accommodation: accommodationSchema.optional(),
  notes: z.string().optional(),
  total_estimated_cost: z.number().nonnegative().optional(),
  accepted_at: z.string().optional(),
});

// Main schema for updating trip plan
export const updateTripPlanSchema = z
  .object({
    destination: z.string().trim().min(1, "Destination cannot be empty").optional(),

    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format")
      .optional(),

    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format")
      .optional(),

    people_count: z
      .number()
      .int("People count must be an integer")
      .positive("People count must be a positive integer (>= 1)")
      .optional(),

    budget_type: z.string().trim().min(1, "Budget type cannot be empty").optional(),

    plan_details: planDetailsSchema.optional(),
  })
  .refine(
    (data) => {
      // At least one field must be provided
      return Object.keys(data).length > 0;
    },
    {
      message: "At least one field must be provided for update",
    }
  )
  .refine(
    (data) => {
      // If both dates provided, end_date must be >= start_date
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message: "End date must be greater than or equal to start date",
      path: ["end_date"],
    }
  );

export type UpdateTripPlanInput = z.infer<typeof updateTripPlanSchema>;
```

**Kluczowe punkty**:

- Wszystkie pola opcjonalne
- Walidacja zagnieżdżonych struktur (days, activities, accommodation)
- Walidacja formatu dat (YYYY-MM-DD)
- Walidacja relacji (end_date >= start_date)
- Custom refine dla "at least one field" rule

---

### 9.2 Utworzenie TripPlansService (nowy plik)

**Plik**: `src/lib/services/tripPlans.service.ts`

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { TripPlanDto, UpdatePlanCommand, PlanDetailsDto, TripPlanUpdate } from "../../types";
import { ValidationError } from "../../errors/validation.error";

export class TripPlansService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves a single trip plan by ID
   * Used internally to check current state before update
   */
  async getTripPlanById(id: string, userId: string): Promise<{ source: string; plan_details: PlanDetailsDto } | null> {
    const { data, error } = await this.supabase
      .from("trip_plans")
      .select("source, plan_details")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      console.error("Database error in getTripPlanById:", error);
      throw error;
    }

    return data as { source: string; plan_details: PlanDetailsDto };
  }

  /**
   * Updates an existing trip plan
   * Automatically changes source to "ai-edited" if plan_details is modified and source was "ai"
   */
  async updateTripPlan(command: UpdatePlanCommand): Promise<TripPlanDto | null> {
    // 1. Validate command
    this.validateUpdateCommand(command);

    // 2. Fetch current plan to check source
    const current = await this.getTripPlanById(command.id, command.user_id);
    if (!current) {
      return null; // Trip plan not found or doesn't belong to user
    }

    // 3. Build update object
    const updateData: TripPlanUpdate = {};

    if (command.destination !== undefined) {
      updateData.destination = command.destination;
    }
    if (command.start_date !== undefined) {
      updateData.start_date = command.start_date;
    }
    if (command.end_date !== undefined) {
      updateData.end_date = command.end_date;
    }
    if (command.people_count !== undefined) {
      updateData.people_count = command.people_count;
    }
    if (command.budget_type !== undefined) {
      updateData.budget_type = command.budget_type;
    }

    // 4. Handle plan_details and source change logic
    if (command.plan_details !== undefined) {
      updateData.plan_details = command.plan_details;

      // If source was "ai", change to "ai-edited"
      if (current.source === "ai") {
        updateData.source = "ai-edited";
      }
    }

    // 5. Execute UPDATE query
    const { data, error } = await this.supabase
      .from("trip_plans")
      .update(updateData)
      .eq("id", command.id)
      .eq("user_id", command.user_id)
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .single();

    // 6. Handle errors
    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found (shouldn't happen after step 2, but safety)
      }
      console.error("Database error in updateTripPlan:", error);
      throw error;
    }

    // 7. Map to TripPlanDto
    return {
      id: data.id,
      destination: data.destination,
      start_date: data.start_date,
      end_date: data.end_date,
      people_count: data.people_count,
      budget_type: data.budget_type,
      plan_details: data.plan_details as PlanDetailsDto,
    };
  }

  /**
   * Validates UpdatePlanCommand
   * Checks business rules that can't be validated by Zod alone
   */
  private validateUpdateCommand(command: UpdatePlanCommand): void {
    // At least one field must be provided (already checked by Zod, but double-check)
    const hasAnyField =
      command.destination !== undefined ||
      command.start_date !== undefined ||
      command.end_date !== undefined ||
      command.people_count !== undefined ||
      command.budget_type !== undefined ||
      command.plan_details !== undefined;

    if (!hasAnyField) {
      throw new ValidationError("At least one field must be provided for update", "general");
    }

    // Validate destination (if provided)
    if (command.destination !== undefined && command.destination.trim().length === 0) {
      throw new ValidationError("Destination cannot be empty", "destination");
    }

    // Validate dates relationship (if both provided)
    if (command.start_date && command.end_date) {
      const startDate = new Date(command.start_date);
      const endDate = new Date(command.end_date);

      if (endDate < startDate) {
        throw new ValidationError("End date must be greater than or equal to start date", "end_date");
      }
    }

    // Validate people_count (if provided)
    if (command.people_count !== undefined) {
      if (!Number.isInteger(command.people_count) || command.people_count < 1) {
        throw new ValidationError("People count must be a positive integer (>= 1)", "people_count");
      }
    }

    // Validate budget_type (if provided)
    if (command.budget_type !== undefined && command.budget_type.trim().length === 0) {
      throw new ValidationError("Budget type cannot be empty", "budget_type");
    }

    // Validate plan_details structure (if provided)
    if (command.plan_details !== undefined) {
      if (!command.plan_details.days || command.plan_details.days.length === 0) {
        throw new ValidationError("Plan details must contain at least one day", "plan_details");
      }

      // Validate each day has activities
      for (const day of command.plan_details.days) {
        if (!day.activities || day.activities.length === 0) {
          throw new ValidationError(`Day ${day.day} must have at least one activity`, "plan_details");
        }
      }
    }
  }
}
```

**Kluczowe punkty**:

- `getTripPlanById()`: Pobiera tylko `source` i `plan_details` (optymalizacja)
- `updateTripPlan()`: Implementuje logikę auto-zmiany `source` na "ai-edited"
- `validateUpdateCommand()`: Business logic validation (dodatkowe do Zod)
- Error handling: PGRST116 = not found, inne = throw

---

### 9.3 Utworzenie API route (nowy plik)

**Plik**: `src/pages/api/trip-plans/[id].ts`

```typescript
/**
 * PATCH /api/trip-plans/:id
 * Updates an existing trip plan (manual edits).
 * Automatically changes source to "ai-edited" if plan_details is modified and source was "ai".
 *
 * Requires authentication (to be added later).
 */

import type { APIRoute } from "astro";
import { TripPlansService } from "../../../lib/services/tripPlans.service";
import { isValidUUID } from "../../../lib/validators/uuid.validator";
import { updateTripPlanSchema } from "../../../lib/validators/tripPlans.validator";
import { ValidationError } from "../../../errors/validation.error";
import type { ApiSuccessResponse, ApiErrorResponse, TripPlanDto, UpdatePlanCommand } from "../../../types";

export const prerender = false;

/**
 * PATCH handler - Update a trip plan by ID
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Extract and validate ID parameter
    const id = params.id;

    if (!id || !isValidUUID(id)) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_UUID",
          message: "The provided ID is not a valid UUID format",
          details: { field: "id", value: id },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Validate input with Zod schema
    const validationResult = updateTripPlanSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. TODO: Get user_id from authenticated session
    // For now, using a placeholder - will be replaced with actual auth
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

    // 5. Build update command
    const command: UpdatePlanCommand = {
      id,
      user_id: userId,
      ...validationResult.data,
    };

    // 6. Update trip plan using service
    const tripPlansService = new TripPlansService(locals.supabase);
    const updatedPlan = await tripPlansService.updateTripPlan(command);

    // 7. Handle not found case
    if (!updatedPlan) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "TRIP_PLAN_NOT_FOUND",
          message: "Trip plan not found or doesn't belong to user",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 8. Return success response
    const successResponse: ApiSuccessResponse<TripPlanDto> = {
      data: updatedPlan,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 9. Handle validation errors
    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: { field: error.field },
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 10. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in PATCH /api/trip-plans/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 11. Return generic server error
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred while processing your request",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Kluczowe punkty**:

- Follows existing patterns from `src/pages/api/user/preferences/[id].ts`
- Uses `PATCH` method (not `PUT`) - semantic correctness for partial updates
- Consistent error handling and response structure
- TODO comment for authentication

---

### 9.4 Testowanie manualne

**Setup**:

1. Ensure database migrations applied (trip_plans table exists)
2. Insert test data:
   ```sql
   -- Insert test trip plan
   INSERT INTO trip_plans (
     id,
     user_id,
     destination,
     start_date,
     end_date,
     people_count,
     budget_type,
     source,
     plan_details
   ) VALUES (
     '550e8400-e29b-41d4-a716-446655440000',
     '20eaee6f-d503-41d9-8ce9-4219f2c06533',
     'Warsaw, Poland',
     '2025-06-01',
     '2025-06-05',
     2,
     'medium',
     'ai',
     '{"days": [{"day": 1, "date": "2025-06-01", "activities": [{"time": "09:00", "title": "Old Town Tour", "description": "Walking tour", "location": "Old Town"}]}]}'::jsonb
   );
   ```

**Test cases**:

#### TC1: Update destination only

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"destination": "Krakow, Poland"}'
```

**Expected**: 200 OK, destination changed, source still "ai"

---

#### TC2: Update plan_details (should change source to "ai-edited")

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "plan_details": {
      "days": [
        {
          "day": 1,
          "date": "2025-06-01",
          "activities": [
            {
              "time": "10:00",
              "title": "Castle Visit",
              "description": "Visit Wawel Castle",
              "location": "Wawel Hill"
            }
          ]
        }
      ]
    }
  }'
```

**Expected**: 200 OK, plan_details changed, source changed to "ai-edited"

---

#### TC3: Invalid UUID

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/invalid-uuid \
  -H "Content-Type: application/json" \
  -d '{"destination": "Paris"}'
```

**Expected**: 400 Bad Request, error code "INVALID_UUID"

---

#### TC4: Validation error (end_date < start_date)

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-06-10",
    "end_date": "2025-06-05"
  }'
```

**Expected**: 400 Bad Request, error code "VALIDATION_ERROR", details about date mismatch

---

#### TC5: Trip plan not found

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"destination": "Paris"}'
```

**Expected**: 404 Not Found, error code "TRIP_PLAN_NOT_FOUND"

---

#### TC6: No fields provided

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 Bad Request, error code "VALIDATION_ERROR", message "At least one field must be provided"

---

#### TC7: Invalid JSON

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected**: 400 Bad Request, error code "INVALID_JSON"

---

#### TC8: Update multiple fields at once

```bash
curl -X PATCH http://localhost:4321/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris, France",
    "people_count": 4,
    "budget_type": "high"
  }'
```

**Expected**: 200 OK, all fields updated, source unchanged (because plan_details not modified)

---

### 9.5 Dodanie testów jednostkowych (opcjonalnie, nice to have)

**Plik**: `src/lib/services/tripPlans.service.test.ts` (jeśli framework testowy skonfigurowany)

**Test cases**:

1. `updateTripPlan()` - should update destination successfully
2. `updateTripPlan()` - should change source to "ai-edited" when plan_details modified
3. `updateTripPlan()` - should NOT change source when only other fields modified
4. `updateTripPlan()` - should return null for non-existent trip plan
5. `validateUpdateCommand()` - should throw ValidationError for end_date < start_date
6. `validateUpdateCommand()` - should throw ValidationError for people_count < 1
7. `validateUpdateCommand()` - should throw ValidationError for empty plan_details.days

**Framework**: Vitest (recommended for Astro projects)

**Uwaga**: To jest opcjonalne dla MVP, ale recommended dla production readiness.

---

### 9.6 Dokumentacja API (opcjonalnie)

**Update API docs** (jeśli istnieją):

- Dodać PATCH /api/trip-plans/:id do dokumentacji
- Opisać request/response format
- Wymienić możliwe error codes
- Wyjaśnić logikę zmiany source na "ai-edited"

**Formaty**:

- OpenAPI/Swagger spec
- Postman collection
- README.md w repozytorium

---

### 9.7 Checklist implementacji

- [ ] Utworzony plik `src/lib/validators/tripPlans.validator.ts`
  - [ ] `updateTripPlanSchema` z zagnieżdżonymi schematami
  - [ ] Walidacja formatu dat (YYYY-MM-DD)
  - [ ] Walidacja relacji (end_date >= start_date)
  - [ ] Walidacja "at least one field" rule

- [ ] Utworzony plik `src/lib/services/tripPlans.service.ts`
  - [ ] Klasa `TripPlansService`
  - [ ] Metoda `getTripPlanById()` (internal)
  - [ ] Metoda `updateTripPlan()` z logiką zmiany source
  - [ ] Metoda prywatna `validateUpdateCommand()`

- [ ] Utworzony plik `src/pages/api/trip-plans/[id].ts`
  - [ ] Export handler `PATCH`
  - [ ] Walidacja UUID parametru
  - [ ] Parsowanie i walidacja JSON body (Zod)
  - [ ] Budowanie `UpdatePlanCommand`
  - [ ] Wywołanie `tripPlansService.updateTripPlan()`
  - [ ] Obsługa błędów (400, 404, 500)
  - [ ] Consistent error response structure

- [ ] Testy manualne
  - [ ] TC1: Update destination only
  - [ ] TC2: Update plan_details (source changes)
  - [ ] TC3: Invalid UUID
  - [ ] TC4: Validation error (dates)
  - [ ] TC5: Trip plan not found
  - [ ] TC6: No fields provided
  - [ ] TC7: Invalid JSON
  - [ ] TC8: Update multiple fields

- [ ] Code review
  - [ ] Consistent naming conventions
  - [ ] Error handling complete
  - [ ] TypeScript types correct
  - [ ] Security considerations addressed

- [ ] Dokumentacja (opcjonalnie)
  - [ ] API docs updated
  - [ ] README.md updated with usage examples
  - [ ] Postman collection updated

---

## 10. Kolejne kroki (post-MVP)

### 10.1 Authentication Integration

- Zamienić placeholder `userId` na rzeczywiste `session.user.id`
- Dodać middleware dla auth verification
- Implementacja 401 Unauthorized responses

### 10.2 Optimistic Locking (jeśli potrzebne)

- Dodać kolumnę `version` do trip_plans
- Check version on update, return 409 Conflict if mismatch
- Frontend retry logic

### 10.3 Audit Logging

- Log all updates to separate `trip_plans_audit` table
- Store: user_id, trip_plan_id, changed_fields, old_values, new_values, timestamp
- Useful for debugging and user support

### 10.4 Websocket Notifications (advanced)

- Notify other connected clients when plan is updated
- Useful for collaborative editing (future feature)

### 10.5 Rate Limiting

- Implement per-user rate limiting (e.g., 100 requests/min)
- Use Redis or Deno KV
- Return 429 Too Many Requests

### 10.6 Performance Monitoring

- Add APM tool (Sentry, DataDog)
- Track request latency, error rates
- Set up alerts for anomalies

---

## 11. Potencjalne problemy i rozwiązania

### Problem 1: Concurrent updates (race condition)

**Scenario**: Two clients update same trip plan at the same time

**Current behavior**: Last write wins

**Solution (future)**:

- Add `version` column
- Check version on update
- Return 409 Conflict if version mismatch

---

### Problem 2: Very large plan_details (>1MB)

**Scenario**: User creates extremely detailed plan with hundreds of activities

**Current behavior**: May hit JSON size limits, slow queries

**Solution**:

- Add request body size limit (e.g., 500KB)
- Consider compressing plan_details
- Or split into separate `activities` table (major refactor)

---

### Problem 3: Invalid dates not caught by Zod

**Scenario**: User sends `"2025-02-31"` (invalid date)

**Current behavior**: Zod regex passes, but `new Date()` creates invalid date

**Solution**:

- Add custom Zod refinement:
  ```typescript
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date",
  })
  ```

---

### Problem 4: User tries to update soft-deleted trip plan

**Scenario**: Trip plan has `deleted_at` set

**Current behavior**: Service returns null (404 Not Found)

**Expected behavior**: Same (soft-deleted plans are hidden)

**No action needed**: RLS policy filters out soft-deleted plans

---

### Problem 5: Database schema changes break types

**Scenario**: Database schema updated (new column added), but types not updated

**Solution**:

- Run `supabase gen types typescript` after migrations
- Update `src/types.ts` with new fields
- Review all TripPlanDto/TripPlanUpdate usages

---

## 12. Dodatkowe uwagi

### 12.1 Source Field Logic

**Important**: Zmiana source z "ai" na "ai-edited" następuje TYLKO gdy:

1. `plan_details` jest modyfikowane (command.plan_details !== undefined)
2. Aktualne `source` to "ai"

**Nie** zmienia się w przypadku:

- Edycji destination, dates, people_count, budget_type (tylko te pola)
- Jeśli source już jest "ai-edited" (pozostaje "ai-edited")

### 12.2 Partial Updates

Endpoint wspiera partial updates - można przesłać tylko zmieniane pola.

**Przykład**:

```json
// Update tylko destination
{ "destination": "New City" }

// Update tylko plan_details
{ "plan_details": {...} }

// Update multiple fields
{ "destination": "New City", "people_count": 5 }
```

### 12.3 RLS Protection

RLS policy `tp_owner` zapewnia, że:

- Użytkownik nie może edytować cudzych planów
- Nawet jeśli zna UUID cudego planu, query zwróci 0 rows
- Service zwraca null → API zwraca 404 Not Found

**Security**: Nie można distinguishować "plan not exists" vs "plan not yours" (zapobiega information leakage).

### 12.4 Trigger Behavior

Trigger `set_updated_trip_plans` automatycznie ustawia `updated_at = now()` przy każdym UPDATE.

**Benefit**: Nie trzeba ręcznie ustawiać tego pola w kodzie.

### 12.5 Transaction Safety

Supabase/Postgres zapewnia transakcyjność:

- UPDATE albo się wykona w całości, albo wcale
- Nie ma "partial updates" na poziomie bazy
- JSONB plan_details jest atomic (cała struktura albo nie)

### 12.6 NULL vs Undefined Handling

**Zod schema**: Nie ma `.nullable()` na polach (bo wszystkie optional)
**Service**: Sprawdza `!== undefined` (nie `!== null`)
**Database**: NULL values nie są wysyłane w UPDATE (brak pola w updateData)

**Result**: Nie można "wyczyścić" pola ustawiając je na NULL (wymaga explicit NULL support).

**Future consideration**: Jeśli potrzeba NULL support, dodać `.nullable()` do Zod i zmienić logikę w service.

---

## 13. Podsumowanie

**Endpoint**: PATCH /api/trip-plans/:id

**Główne funkcje**:

- Update zapisanego planu podróży (partial updates)
- Auto-zmiana source z "ai" na "ai-edited" gdy modyfikowane plan_details
- Walidacja na poziomie API (Zod) i service (business rules)
- RLS protection (user może edytować tylko swoje plany)
- Consistent error handling (400, 404, 500)

**Pliki do utworzenia**:

1. `src/lib/validators/tripPlans.validator.ts` (Zod schema)
2. `src/lib/services/tripPlans.service.ts` (business logic)
3. `src/pages/api/trip-plans/[id].ts` (API route handler)

**Dependencies**:

- Existing: `src/types.ts`, `src/lib/validators/uuid.validator.ts`, `src/errors/validation.error.ts`
- Database: trip_plans table (already exists from migrations)

**Estimated implementation time**: 2-4 hours (bez testów jednostkowych)

**Testing**: 8 manual test cases provided

**Post-MVP**: Authentication, optimistic locking, audit logging, rate limiting
