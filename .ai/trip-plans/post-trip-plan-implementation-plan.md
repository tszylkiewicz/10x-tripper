# API Endpoint Implementation Plan: POST /api/trip-plans

## 1. Przegląd punktu końcowego

Endpoint `POST /api/trip-plans` służy do akceptowania i zapisywania wygenerowanego planu podróży w bazie danych. Użytkownik może zaakceptować plan dokładnie taki, jaki został wygenerowany przez AI (source="ai"), lub plan po jego modyfikacji (source="ai-edited").

Endpoint wspiera kluczową metrykę PRD: "Odsetek zaakceptowanych planów w pełni wygenerowanych przez AI ≥ 60%" poprzez śledzenie pola `source`.

**Kluczowe cechy:**

- Zapisuje złożone struktury JSONB (dni, aktywności, zakwaterowanie)
- Opcjonalnie linkuje do rekordu generacji (`generation_id`) dla celów analitycznych
- Wymusza izolację danych użytkowników przez RLS
- Waliduje reguły biznesowe (daty, liczba osób, struktura planu)

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

`/api/trip-plans`

### Headers

```
Content-Type: application/json
Authorization: Bearer {token}  // TODO: Obecnie nie zaimplementowane
```

### Parametry

**Request Body (wszystkie pola):**

```typescript
{
  generation_id?: string | null;    // Opcjonalne: UUID linkujący do plan_generations
  destination: string;               // Wymagane: nazwa miejsca docelowego
  start_date: string;                // Wymagane: ISO date (YYYY-MM-DD)
  end_date: string;                  // Wymagane: ISO date (YYYY-MM-DD)
  people_count: number;              // Wymagane: integer >= 1
  budget_type: string;               // Wymagane: typ budżetu
  plan_details: PlanDetailsDto;      // Wymagane: złożona struktura JSONB
  source: "ai" | "ai-edited";        // Wymagane: źródło planu
}
```

**Struktura `plan_details`:**

```typescript
{
  days: Array<{
    day: number;
    date: string;  // ISO date
    activities: Array<{
      time: string;
      title: string;
      description: string;
      location: string;
      estimated_cost?: number;
      duration?: string;
      category?: string;
    }>;
  }>;
  accommodation?: {
    name: string;
    address: string;
    check_in: string;
    check_out: string;
    estimated_cost?: number;
    booking_url?: string;
  };
  notes?: string;
  total_estimated_cost?: number;
  accepted_at?: string;  // ISO timestamp
}
```

### Przykład żądania

```json
{
  "generation_id": "550e8400-e29b-41d4-a716-446655440000",
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
            "time": "09:00",
            "title": "Arrival and Check-in",
            "description": "Arrive at Charles de Gaulle Airport and check into hotel",
            "location": "Marais District Hotel",
            "estimated_cost": 0,
            "duration": "2 hours",
            "category": "logistics"
          },
          {
            "time": "14:00",
            "title": "Louvre Museum",
            "description": "Visit the world's largest art museum",
            "location": "Musée du Louvre",
            "estimated_cost": 17,
            "duration": "3 hours",
            "category": "culture"
          }
        ]
      }
    ],
    "accommodation": {
      "name": "Hotel Marais",
      "address": "123 Rue de Rivoli, Paris",
      "check_in": "2025-06-15",
      "check_out": "2025-06-22",
      "estimated_cost": 800,
      "booking_url": "https://booking.example.com/hotel-marais"
    },
    "notes": "Remember to book Louvre tickets in advance",
    "total_estimated_cost": 1500
  },
  "source": "ai"
}
```

## 3. Wykorzystywane typy

Wszystkie typy są już zdefiniowane w `src/types.ts`:

### Request DTO

- **`AcceptTripPlanDto`** (linie 165-174) - typ dla request body

### Command Model

- **`AcceptPlanCommand`** (linie 230-240) - rozszerzenie AcceptTripPlanDto o `user_id`, używany wewnętrznie przez service

### Response DTO

- **`TripPlanDto`** (linie 111-116) - typ dla response body

### Supporting Types

- **`PlanDetailsDto`** (linie 54-60) - struktura JSONB plan_details
- **`DayDto`** (linie 32-36) - pojedynczy dzień w planie
- **`ActivityDto`** (linie 19-27) - pojedyncza aktywność
- **`AccommodationDto`** (linie 41-48) - informacje o zakwaterowaniu

### Response Wrappers

- **`ApiSuccessResponse<T>`** (linie 330-332) - wrapper dla udanych odpowiedzi
- **`ApiErrorResponse`** (linie 338-344) - wrapper dla błędów

## 4. Szczegóły odpowiedzi

### Sukces (201 Created)

**Status:** `201 Created`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "data": {
    "id": "7f3d2c1a-8e9f-4b5c-a3d1-2e4f5a6b7c8d",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-22",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {
      "days": [...],
      "accommodation": {...},
      "notes": "...",
      "total_estimated_cost": 1500
    }
  }
}
```

**Uwaga:** Response **NIE** zawiera pól: `user_id`, `generation_id`, `source`, `created_at`, `updated_at`, `deleted_at`, `deleted_by` zgodnie z definicją `TripPlanDto`.

### Błąd walidacji (400 Bad Request)

**Przykład 1: Nieprawidłowy JSON**

```json
{
  "error": {
    "code": "INVALID_JSON",
    "message": "Invalid JSON in request body"
  }
}
```

**Przykład 2: Błędy walidacji Zod**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "destination": "Destination is required",
      "end_date": "End date must be on or after start date",
      "people_count": "People count must be a positive integer (>= 1)"
    }
  }
}
```

**Przykład 3: Błąd biznesowy z service**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Plan details must contain at least one day",
    "details": {
      "plan_details": "Plan details must contain at least one day"
    }
  }
}
```

**Przykład 4: Nieprawidłowy foreign key**

```json
{
  "error": {
    "code": "INVALID_GENERATION_ID",
    "message": "The provided generation_id does not exist"
  }
}
```

### Błąd autentykacji (401 Unauthorized)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Błąd serwera (500 Internal Server Error)

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/trip-plans
       │ Body: AcceptTripPlanDto
       ▼
┌─────────────────────────────────────────┐
│  API Route: src/pages/api/trip-plans.ts │
│                                         │
│  1. Parse JSON body                     │
│  2. Validate with Zod schema            │
│  3. Extract user_id (hardcoded/session) │
│  4. Create AcceptPlanCommand            │
│  5. Call service.acceptPlan()           │
│  6. Return ApiSuccessResponse           │
│  7. Handle errors                       │
└──────┬──────────────────────────────────┘
       │ AcceptPlanCommand
       ▼
┌───────────────────────────────────────────┐
│  Service: TripPlansService                │
│  Location: src/lib/services/              │
│           tripPlans.service.ts            │
│                                           │
│  1. Validate business rules               │
│     - end_date >= start_date              │
│     - people_count >= 1                   │
│     - plan_details not empty              │
│     - days array has items                │
│  2. Verify generation_id exists (if set)  │
│  3. Insert into trip_plans table          │
│  4. Map to TripPlanDto                    │
│  5. Return result                         │
└──────┬────────────────────────────────────┘
       │ Supabase Query
       ▼
┌─────────────────────────────────┐
│  Database: Supabase PostgreSQL  │
│                                 │
│  Table: trip_plans              │
│  - RLS enabled                  │
│  - user_id isolation            │
│  - Foreign keys:                │
│    * user_id → auth.users       │
│    * generation_id →            │
│      plan_generations           │
│  - Triggers:                    │
│    * set_updated_at             │
│    * soft_delete                │
└─────────────────────────────────┘
```

### Interakcja z zewnętrznymi zasobami

**Supabase:**

- Tabela główna: `trip_plans`
- Tabela powiązana: `plan_generations` (opcjonalnie przez `generation_id`)
- Tabela powiązana: `auth.users` (przez `user_id`)

**Brak interakcji z:**

- `plan_generation_error_logs` - używana tylko podczas generowania planów
- Zewnętrznymi API
- Systemami cache

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja i autoryzacja

**Stan obecny (MVP):**

- Tymczasowo hardcoded `user_id`: `"20eaee6f-d503-41d9-8ce9-4219f2c06533"`
- TODO comment w kodzie dla przyszłej implementacji

**Docelowo:**

```typescript
// Pobierz user_id z sesji Supabase
const {
  data: { session },
} = await locals.supabase.auth.getSession();
if (!session) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
    }),
    { status: 401 }
  );
}
const userId = session.user.id;
```

### 6.2 Row-Level Security (RLS)

**Policy na trip_plans:**

```sql
CREATE POLICY tp_owner ON trip_plans
  USING (user_id = auth.uid());
```

**Implikacje:**

- Użytkownicy widzą tylko swoje plany
- Nawet z hardcoded userId, RLS chroni przed nieautoryzowanym dostępem
- INSERT automatycznie weryfikuje user_id

### 6.3 Walidacja danych wejściowych

**Poziom 1: Zod Schema**

- Walidacja typów
- Walidacja formatów (daty, UUID)
- Walidacja struktur zagnieżdżonych
- Walidacja wymaganych pól

**Poziom 2: Service Layer**

- Reguły biznesowe
- Weryfikacja foreign keys
- Walidacja logiczna (end >= start)

**Poziom 3: Database Constraints**

- CHECK constraints (source enum)
- Foreign key constraints
- NOT NULL constraints

### 6.4 Ochrona przed atakami

**SQL Injection:**

- Supabase client używa parametryzowanych zapytań
- Brak surowego SQL w kodzie aplikacji

**XSS:**

- Backend zwraca czysty JSON
- Frontend odpowiedzialny za sanityzację przy renderowaniu

**Mass Assignment:**

- Explicit picking pól w DTO
- Command object kontroluje co trafia do DB

**DoS przez duże payloady:**

- Astro limit: 4MB request body (domyślnie)
- Rozważyć dodatkowe limity na plan_details:
  - Max 30 dni
  - Max 20 aktywności na dzień

### 6.5 Wrażliwe dane

**NIE ujawniać w response:**

- `user_id` - wewnętrzne ID
- `source` - informacja analityczna
- `generation_id` - wewnętrzne linkowanie
- `deleted_at`, `deleted_by` - soft-delete metadata
- `created_at`, `updated_at` - timestamps (opcjonalnie można dodać)

**Logowanie błędów:**

- Console.error z kontekstem dla debugowania
- NIE logować haseł, tokenów, PII
- W production: zintegrować z systemem monitoringu (np. Sentry)

## 7. Obsługa błędów

### 7.1 Hierarchia błędów

```
Error Handling Flow:
│
├─ 1. JSON Parsing Error
│  └─ 400 INVALID_JSON
│
├─ 2. Zod Validation Error
│  └─ 400 VALIDATION_ERROR (with field details)
│
├─ 3. Service ValidationError
│  └─ 400 VALIDATION_ERROR (business rules)
│
├─ 4. Database Constraint Violations
│  ├─ Foreign key (23503)
│  │  └─ 400 INVALID_GENERATION_ID
│  └─ Other constraints
│     └─ 400 VALIDATION_ERROR
│
├─ 5. Authentication Error (future)
│  └─ 401 UNAUTHORIZED
│
└─ 6. Unexpected Errors
   └─ 500 INTERNAL_SERVER_ERROR
```

### 7.2 Szczegółowe scenariusze błędów

| Scenariusz                 | HTTP Status | Error Code            | Przykład Message                            |
| -------------------------- | ----------- | --------------------- | ------------------------------------------- |
| Nieprawidłowy JSON         | 400         | INVALID_JSON          | "Invalid JSON in request body"              |
| Brak destination           | 400         | VALIDATION_ERROR      | "Destination is required"                   |
| Nieprawidłowy format daty  | 400         | VALIDATION_ERROR      | "Invalid date format, expected YYYY-MM-DD"  |
| end_date < start_date      | 400         | VALIDATION_ERROR      | "End date must be on or after start date"   |
| people_count < 1           | 400         | VALIDATION_ERROR      | "People count must be at least 1"           |
| Nieprawidłowy source       | 400         | VALIDATION_ERROR      | "Source must be either 'ai' or 'ai-edited'" |
| Pusty plan_details         | 400         | VALIDATION_ERROR      | "Plan details cannot be empty"              |
| Brak dni w planie          | 400         | VALIDATION_ERROR      | "Plan must contain at least one day"        |
| Nieprawidłowy UUID         | 400         | VALIDATION_ERROR      | "Invalid UUID format for generation_id"     |
| generation_id nie istnieje | 400         | INVALID_GENERATION_ID | "The provided generation_id does not exist" |
| Brak autentykacji (future) | 401         | UNAUTHORIZED          | "Authentication required"                   |
| Błąd połączenia z DB       | 500         | INTERNAL_SERVER_ERROR | "An unexpected error occurred"              |
| Nieoczekiwany błąd         | 500         | INTERNAL_SERVER_ERROR | "An unexpected error occurred"              |

### 7.3 Implementacja error handlingu w API route

```typescript
try {
  // 1. Parse JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_JSON",
          message: "Invalid JSON in request body",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Validate with Zod
  let validatedData: AcceptTripPlanDto;
  try {
    validatedData = acceptTripPlanSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      e.errors.forEach((err) => {
        const path = err.path.join(".");
        fieldErrors[path] = err.message;
      });

      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: fieldErrors,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    throw e;
  }

  // 3. Call service
  const service = new TripPlansService(locals.supabase);
  const command: AcceptPlanCommand = {
    ...validatedData,
    user_id: "20eaee6f-d503-41d9-8ce9-4219f2c06533", // TODO: from auth
  };

  const result = await service.acceptPlan(command);

  // 4. Return success
  return new Response(JSON.stringify({ data: result }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  // Handle service errors
  if (error instanceof ValidationError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.field ? { [error.field]: error.message } : undefined,
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle database foreign key violations (generation_id)
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "23503") {
      // Foreign key violation
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_GENERATION_ID",
            message: "The provided generation_id does not exist",
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Log and return generic error
  console.error("Unexpected error in POST /api/trip-plans:", {
    error,
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
  });

  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### 7.4 Logowanie błędów

**Development:**

```typescript
console.error("Error details:", {
  endpoint: "POST /api/trip-plans",
  userId: command.user_id,
  error: error,
  message: error instanceof Error ? error.message : "Unknown",
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
});
```

**Production (future):**

- Integracja z Sentry lub podobnym
- Structured logging (JSON format)
- Alert dla krytycznych błędów
- Nie logować wrażliwych danych (PII, tokeny)

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

**1. Rozmiar payloadu JSONB:**

- Plan na 7-14 dni z wieloma aktywnościami może być duży (10-50 KB)
- PostgreSQL JSONB jest zoptymalizowane, ale duże dokumenty zwiększają I/O
- **Mitygacja:** Limity na strukturę (max 30 dni, max 20 aktywności/dzień)

**2. Walidacja złożonych struktur:**

- Zod musi zwalidować całą zagnieżdżoną strukturę plan_details
- Przy dużych planach może to zająć 10-50ms
- **Mitygacja:** Akceptowalne dla operacji CREATE (jednorazowa)

**3. Database INSERT z JSONB:**

- PostgreSQL musi zserializować i zindeksować JSONB
- Typowy czas: 5-20ms
- **Mitygacja:** Brak indeksów GIN na plan_details w MVP (dodać później jeśli potrzebne)

**4. Foreign key verification:**

- Sprawdzenie czy generation_id istnieje wymaga JOINa
- PostgreSQL optymalizuje to przez indeksy
- **Mitygacja:** Index na plan_generations.id już istnieje (PK)

### 8.2 Strategie optymalizacji

**Obecne (MVP):**

1. **Explicit field selection** - wybieramy tylko potrzebne pola w SELECT
2. **RLS indexing** - index na user_id już istnieje
3. **Connection pooling** - Supabase zarządza połączeniami
4. **Brak transakcji** - pojedynczy INSERT, ACID przez PostgreSQL

**Przyszłe (jeśli potrzebne):**

1. **JSONB indexing:**

   ```sql
   CREATE INDEX idx_trip_plans_plan_details_days
   ON trip_plans USING GIN ((plan_details->'days'));
   ```

2. **Pagination dla GET /api/trip-plans:**
   - Obecnie nie implementowane, ale API gotowe

3. **Caching:**
   - Redis dla często czytanych planów
   - Invalidation przy UPDATE/DELETE

4. **Compression:**
   - JSONB już jest binarnie skompresowane przez PostgreSQL
   - HTTP gzip compression przez hosting (DigitalOcean)

### 8.3 Monitoring wydajności

**Metryki do śledzenia:**

- Request duration (p50, p95, p99)
- Database query time
- Payload size distribution
- Error rate
- Throughput (requests/second)

**Alerty:**

- Request duration > 1000ms
- Error rate > 5%
- Database connection pool exhaustion

### 8.4 Limity i rate limiting

**Request size:**

- Astro default: 4MB
- Rekomendacja: 512KB limit dla plan_details

**Rate limiting (future):**

- 100 requests/minute per user
- 10 trip plans created per day per user (business limit)

**Database limits:**

- Supabase Free tier: 500MB database
- Pojedynczy plan: ~10-50KB → ~10,000-50,000 planów możliwych

## 9. Etapy wdrożenia

### Krok 1: Utworzenie Zod Validator

**Plik:** `src/lib/validators/tripPlans.validator.ts`

**Zawartość:**

```typescript
import { z } from "zod";

// UUID v4 regex dla opcjonalnego generation_id
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Walidacja pojedynczej aktywności
const activitySchema = z.object({
  time: z.string().min(1, "Activity time is required"),
  title: z.string().min(1, "Activity title is required"),
  description: z.string().min(1, "Activity description is required"),
  location: z.string().min(1, "Activity location is required"),
  estimated_cost: z.number().nonnegative("Estimated cost must be non-negative").optional(),
  duration: z.string().optional(),
  category: z.string().optional(),
});

// Walidacja dnia
const daySchema = z.object({
  day: z.number().int().positive("Day number must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  activities: z.array(activitySchema).min(1, "Each day must have at least one activity"),
});

// Walidacja zakwaterowania
const accommodationSchema = z.object({
  name: z.string().min(1, "Accommodation name is required"),
  address: z.string().min(1, "Accommodation address is required"),
  check_in: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-in must be in YYYY-MM-DD format"),
  check_out: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Check-out must be in YYYY-MM-DD format"),
  estimated_cost: z.number().nonnegative("Estimated cost must be non-negative").optional(),
  booking_url: z.string().url("Booking URL must be a valid URL").optional(),
});

// Walidacja plan_details
const planDetailsSchema = z.object({
  days: z.array(daySchema).min(1, "Plan must contain at least one day"),
  accommodation: accommodationSchema.optional(),
  notes: z.string().optional(),
  total_estimated_cost: z.number().nonnegative("Total estimated cost must be non-negative").optional(),
  accepted_at: z.string().optional(),
});

// Główna schema dla AcceptTripPlanDto
export const acceptTripPlanSchema = z
  .object({
    generation_id: z.string().regex(UUID_V4_REGEX, "Invalid UUID format for generation_id").optional().nullable(),

    destination: z
      .string({
        required_error: "Destination is required",
        invalid_type_error: "Destination must be a string",
      })
      .trim()
      .min(1, "Destination cannot be empty"),

    start_date: z
      .string({
        required_error: "Start date is required",
        invalid_type_error: "Start date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),

    end_date: z
      .string({
        required_error: "End date is required",
        invalid_type_error: "End date must be a string",
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),

    people_count: z
      .number({
        required_error: "People count is required",
        invalid_type_error: "People count must be a number",
      })
      .int("People count must be an integer")
      .positive("People count must be at least 1"),

    budget_type: z
      .string({
        required_error: "Budget type is required",
        invalid_type_error: "Budget type must be a string",
      })
      .trim()
      .min(1, "Budget type cannot be empty"),

    plan_details: planDetailsSchema,

    source: z.enum(["ai", "ai-edited"], {
      errorMap: () => ({ message: "Source must be either 'ai' or 'ai-edited'" }),
    }),
  })
  .refine(
    (data) => {
      // Walidacja: end_date >= start_date
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

export type AcceptTripPlanInput = z.infer<typeof acceptTripPlanSchema>;
```

**Testy do wykonania:**

- [ ] Walidacja wszystkich wymaganych pól
- [ ] Walidacja formatu dat (YYYY-MM-DD)
- [ ] Walidacja end_date >= start_date
- [ ] Walidacja people_count >= 1
- [ ] Walidacja source enum
- [ ] Walidacja UUID dla generation_id
- [ ] Walidacja struktury plan_details (dni, aktywności)
- [ ] Walidacja pustych stringów (trim)

---

### Krok 2: Utworzenie TripPlansService

**Plik:** `src/lib/services/tripPlans.service.ts`

**Zawartość:**

```typescript
import type { SupabaseClient } from "../db/supabase.client.ts";
import type { AcceptPlanCommand, TripPlanDto } from "../../types.ts";
import { ValidationError } from "../../errors/validation.error.ts";

export class TripPlansService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Accept and save a trip plan to the database
   * @param command - AcceptPlanCommand with user_id
   * @returns TripPlanDto - The saved trip plan
   * @throws ValidationError - If business validation fails
   * @throws Error - If database operation fails
   */
  async acceptPlan(command: AcceptPlanCommand): Promise<TripPlanDto> {
    // 1. Validate business rules
    this.validateAcceptPlanCommand(command);

    // 2. Verify generation_id exists if provided
    if (command.generation_id) {
      await this.verifyGenerationExists(command.generation_id, command.user_id);
    }

    // 3. Insert into trip_plans table
    const { data, error } = await this.supabase
      .from("trip_plans")
      .insert({
        user_id: command.user_id,
        generation_id: command.generation_id,
        destination: command.destination,
        start_date: command.start_date,
        end_date: command.end_date,
        people_count: command.people_count,
        budget_type: command.budget_type,
        plan_details: command.plan_details,
        source: command.source,
      })
      .select("id, destination, start_date, end_date, people_count, budget_type, plan_details")
      .single();

    if (error) {
      throw error;
    }

    // 4. Return as TripPlanDto
    return data as TripPlanDto;
  }

  /**
   * Validate business rules for AcceptPlanCommand
   * @throws ValidationError if validation fails
   */
  private validateAcceptPlanCommand(command: AcceptPlanCommand): void {
    // Validate end_date >= start_date
    const startDate = new Date(command.start_date);
    const endDate = new Date(command.end_date);

    if (endDate < startDate) {
      throw new ValidationError("End date must be on or after start date", "end_date");
    }

    // Validate people_count >= 1
    if (command.people_count < 1) {
      throw new ValidationError("People count must be at least 1", "people_count");
    }

    // Validate plan_details is not empty
    if (!command.plan_details || Object.keys(command.plan_details).length === 0) {
      throw new ValidationError("Plan details cannot be empty", "plan_details");
    }

    // Validate plan_details.days exists and has items
    if (!command.plan_details.days || command.plan_details.days.length === 0) {
      throw new ValidationError("Plan must contain at least one day", "plan_details");
    }

    // Validate source is valid enum value
    if (command.source !== "ai" && command.source !== "ai-edited") {
      throw new ValidationError("Source must be either 'ai' or 'ai-edited'", "source");
    }
  }

  /**
   * Verify that generation_id exists in plan_generations table
   * and belongs to the user
   * @throws ValidationError if generation_id doesn't exist
   */
  private async verifyGenerationExists(generationId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("plan_generations")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        throw new ValidationError(
          "The provided generation_id does not exist or does not belong to you",
          "generation_id"
        );
      }
      throw error;
    }

    if (!data) {
      throw new ValidationError("The provided generation_id does not exist or does not belong to you", "generation_id");
    }
  }
}
```

**Testy do wykonania:**

- [ ] Sukces: zapisanie planu z wszystkimi wymaganymi polami
- [ ] Sukces: zapisanie planu bez generation_id
- [ ] Sukces: zapisanie planu z generation_id
- [ ] Błąd: end_date < start_date
- [ ] Błąd: people_count < 1
- [ ] Błąd: pusty plan_details
- [ ] Błąd: plan_details bez dni
- [ ] Błąd: nieprawidłowy source
- [ ] Błąd: generation_id nie istnieje
- [ ] Błąd: generation_id należy do innego użytkownika

---

### Krok 3: Utworzenie API Endpoint

**Plik:** `src/pages/api/trip-plans.ts`

**Zawartość:**

```typescript
import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { acceptTripPlanSchema } from "../../lib/validators/tripPlans.validator.ts";
import { TripPlansService } from "../../lib/services/tripPlans.service.ts";
import { ValidationError } from "../../errors/validation.error.ts";
import type { AcceptPlanCommand, AcceptTripPlanDto, TripPlanDto } from "../../types.ts";

/**
 * POST /api/trip-plans
 * Accept and save a generated trip plan to the database
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: {
            code: "INVALID_JSON",
            message: "Invalid JSON in request body",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Validate with Zod schema
    let validatedData: AcceptTripPlanDto;
    try {
      validatedData = acceptTripPlanSchema.parse(body);
    } catch (e) {
      if (e instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        e.errors.forEach((err) => {
          const path = err.path.join(".");
          fieldErrors[path] = err.message;
        });

        return new Response(
          JSON.stringify({
            error: {
              code: "VALIDATION_ERROR",
              message: "Validation failed",
              details: fieldErrors,
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      throw e;
    }

    // 3. Get user_id from session
    // TODO: Replace hardcoded userId with auth session
    // const { data: { session } } = await locals.supabase.auth.getSession();
    // if (!session) {
    //   return new Response(
    //     JSON.stringify({
    //       error: {
    //         code: "UNAUTHORIZED",
    //         message: "Authentication required",
    //       },
    //     }),
    //     { status: 401, headers: { "Content-Type": "application/json" } }
    //   );
    // }
    // const userId = session.user.id;
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533"; // Hardcoded for MVP

    // 4. Create command object
    const command: AcceptPlanCommand = {
      ...validatedData,
      user_id: userId,
    };

    // 5. Call service to save trip plan
    const service = new TripPlansService(locals.supabase);
    const result: TripPlanDto = await service.acceptPlan(command);

    // 6. Return success response (201 Created)
    return new Response(JSON.stringify({ data: result }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle ValidationError from service
    if (error instanceof ValidationError) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            details: error.field ? { [error.field]: error.message } : undefined,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle database foreign key violations (generation_id)
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "23503") {
        // Foreign key violation
        return new Response(
          JSON.stringify({
            error: {
              code: "INVALID_GENERATION_ID",
              message: "The provided generation_id does not exist",
            },
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Log unexpected errors
    console.error("Unexpected error in POST /api/trip-plans:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return generic error response
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

**Testy do wykonania:**

- [ ] Sukces: POST z poprawnymi danymi zwraca 201
- [ ] Sukces: response zawiera poprawny TripPlanDto
- [ ] Błąd: nieprawidłowy JSON zwraca 400 INVALID_JSON
- [ ] Błąd: brak wymaganych pól zwraca 400 VALIDATION_ERROR z details
- [ ] Błąd: nieprawidłowy format daty zwraca 400
- [ ] Błąd: end_date < start_date zwraca 400
- [ ] Błąd: nieprawidłowy generation_id zwraca 400 INVALID_GENERATION_ID
- [ ] Błąd: nieoczekiwany błąd zwraca 500 INTERNAL_SERVER_ERROR

---

### Krok 4: Testowanie integracyjne

**Narzędzia:**

- cURL / Postman / Thunder Client
- Supabase Dashboard (sprawdzenie danych w bazie)

**Test Case 1: Sukces - Plan bez generation_id**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Tokyo, Japan",
    "start_date": "2025-07-01",
    "end_date": "2025-07-07",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {
      "days": [
        {
          "day": 1,
          "date": "2025-07-01",
          "activities": [
            {
              "time": "10:00",
              "title": "Arrive in Tokyo",
              "description": "Land at Narita Airport",
              "location": "Narita Airport"
            }
          ]
        }
      ]
    },
    "source": "ai"
  }'
```

**Oczekiwany result:** 201 Created z TripPlanDto

**Test Case 2: Sukces - Plan z generation_id**

```bash
# Najpierw sprawdź istniejący generation_id w bazie:
# SELECT id FROM plan_generations WHERE user_id = '20eaee6f-d503-41d9-8ce9-4219f2c06533' LIMIT 1;

curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "generation_id": "existing-uuid-from-database",
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-22",
    "people_count": 2,
    "budget_type": "high",
    "plan_details": {
      "days": [...],
      "accommodation": {...}
    },
    "source": "ai-edited"
  }'
```

**Oczekiwany result:** 201 Created

**Test Case 3: Błąd - Nieprawidłowy JSON**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Oczekiwany result:** 400 INVALID_JSON

**Test Case 4: Błąd - Brak wymaganych pól**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Berlin"
  }'
```

**Oczekiwany result:** 400 VALIDATION_ERROR z details

**Test Case 5: Błąd - end_date przed start_date**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "London",
    "start_date": "2025-08-20",
    "end_date": "2025-08-15",
    "people_count": 2,
    "budget_type": "low",
    "plan_details": {"days": [...]},
    "source": "ai"
  }'
```

**Oczekiwany result:** 400 VALIDATION_ERROR

**Test Case 6: Błąd - people_count < 1**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Rome",
    "start_date": "2025-09-01",
    "end_date": "2025-09-05",
    "people_count": 0,
    "budget_type": "medium",
    "plan_details": {"days": [...]},
    "source": "ai"
  }'
```

**Oczekiwany result:** 400 VALIDATION_ERROR

**Test Case 7: Błąd - Nieprawidłowy source**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Madrid",
    "start_date": "2025-10-01",
    "end_date": "2025-10-05",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {"days": [...]},
    "source": "manual"
  }'
```

**Oczekiwany result:** 400 VALIDATION_ERROR

**Test Case 8: Błąd - Nieprawidłowy generation_id**

```bash
curl -X POST http://localhost:4321/api/trip-plans \
  -H "Content-Type: application/json" \
  -d '{
    "generation_id": "00000000-0000-0000-0000-000000000000",
    "destination": "Barcelona",
    "start_date": "2025-11-01",
    "end_date": "2025-11-05",
    "people_count": 2,
    "budget_type": "medium",
    "plan_details": {"days": [...]},
    "source": "ai"
  }'
```

**Oczekiwany result:** 400 VALIDATION_ERROR (generation_id nie istnieje)

---

### Krok 5: Weryfikacja w bazie danych

Po udanych testach, sprawdź w Supabase Dashboard:

1. **Otwórz tabelę trip_plans:**

   ```sql
   SELECT
     id,
     user_id,
     generation_id,
     destination,
     start_date,
     end_date,
     people_count,
     budget_type,
     source,
     plan_details,
     created_at,
     updated_at
   FROM trip_plans
   WHERE user_id = '20eaee6f-d503-41d9-8ce9-4219f2c06533'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **Zweryfikuj:**
   - [ ] Wszystkie pola są poprawnie zapisane
   - [ ] plan_details jest poprawnym JSONB
   - [ ] source jest "ai" lub "ai-edited"
   - [ ] generation_id jest poprawnie zlinkowany (jeśli podany)
   - [ ] created_at i updated_at są ustawione
   - [ ] deleted_at i deleted_by są NULL

3. **Sprawdź RLS:**
   ```sql
   -- Jako inny użytkownik, nie powinieneś widzieć planów
   SET request.jwt.claim.sub = 'different-user-id';
   SELECT * FROM trip_plans;  -- Powinno zwrócić 0 wierszy
   ```

---

### Krok 6: Dokumentacja i code review

**Dokumentacja do zaktualizowania:**

- [ ] Dodać komentarze JSDoc do wszystkich public methods
- [ ] Zaktualizować README z przykładami użycia endpointu
- [ ] Dodać endpoint do dokumentacji API (jeśli istnieje)

**Code review checklist:**

- [ ] Kod zgodny z istniejącymi konwencjami (UserPreferencesService pattern)
- [ ] Wszystkie typy są type-safe
- [ ] Error handling jest kompletny
- [ ] Brak hardcoded values (poza tymczasowym userId)
- [ ] TODO comments dla przyszłych ulepszeń
- [ ] Konsekwentne nazewnictwo
- [ ] Brak duplikacji kodu
- [ ] Walidacja na wszystkich poziomach

---

### Krok 7: Przyszłe ulepszenia (Post-MVP)

**Priorytet wysoki:**

1. **Implementacja autentykacji:**
   - Zamienić hardcoded userId na session-based
   - Dodać middleware autentykacji
   - Zwracać 401 dla nieautoryzowanych requestów

2. **Rate limiting:**
   - Limit requestów per user (100/min)
   - Limit utworzonych planów per day (10/day)

**Priorytet średni:** 3. **Optymalizacja walidacji:**

- Dodać limity na rozmiar plan_details (max 30 dni, 20 aktywności/dzień)
- Walidacja dat w kontekście (nie w przeszłości)

4. **Monitoring i analytics:**
   - Integracja z Sentry dla error tracking
   - Metryki wydajności (request duration, payload size)
   - Dashboard dla source="ai" vs "ai-edited" ratio

**Priorytet niski:** 5. **JSONB indexing:**

- GIN index na plan_details->days (jeśli będziemy wyszukiwać po zawartości)

6. **Caching:**
   - Redis cache dla często czytanych planów

7. **Webhooks:**
   - Powiadomienia po zaakceptowaniu planu (email, push notification)

---

## Podsumowanie

Ten plan implementacji zapewnia:

✅ **Kompletną specyfikację** endpointu POST /api/trip-plans
✅ **Zgodność z istniejącymi wzorcami** (UserPreferencesService)
✅ **Type-safety** na wszystkich poziomach
✅ **Robustną walidację** (Zod + service layer)
✅ **Profesjonalny error handling** ze szczegółowymi kodami błędów
✅ **Bezpieczeństwo** (RLS, input validation, data isolation)
✅ **Szczegółowe kroki implementacji** z testami
✅ **Plan na przyszłość** (autentykacja, monitoring, optymalizacja)

**Szacowany czas implementacji:** 2-3 godziny (bez testów manualnych)

**Pliki do utworzenia:**

1. `src/lib/validators/tripPlans.validator.ts` (~100 linii)
2. `src/lib/services/tripPlans.service.ts` (~120 linii)
3. `src/pages/api/trip-plans.ts` (~150 linii)

**Razem:** ~370 linii nowego kodu + testy
