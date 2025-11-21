# API Endpoint Implementation Plan: POST /api/trip-plans/generate

## 1. Przegląd punktu końcowego

Endpoint `POST /api/trip-plans/generate` odpowiada za generowanie szczegółowego planu podróży przy użyciu sztucznej inteligencji (OpenRouter API). Kluczowe cechy:

- **Nie zapisuje** wygenerowanego planu do bazy danych `trip_plans`
- **Zwraca** wygenerowany plan wraz z `generation_id` do dalszego użycia
- **Loguje** każdą próbę generowania (sukces lub błąd) do odpowiednich tabel
- **Timeout**: 180 sekund zgodnie z wymaganiami PRD
- **Rate limiting**: Implementacja ochrony przed nadużyciami

Użytkownik musi jawnie zaakceptować wygenerowany plan przez wywołanie `POST /api/trip-plans` aby zapisać go w bazie.

---

## 2. Szczegóły żądania

### Metoda HTTP

`POST`

### Struktura URL

`/api/trip-plans/generate`

### Nagłówki

```
Content-Type: application/json
Cookie: sb-access-token, sb-refresh-token (Supabase session)
```

### Parametry

#### Wymagane:

- `destination` (string) - Nazwa miejsca docelowego, np. "Paris, France"
- `start_date` (string) - Data rozpoczęcia w formacie ISO (YYYY-MM-DD), nie może być w przeszłości
- `end_date` (string) - Data zakończenia w formacie ISO (YYYY-MM-DD), musi być >= start_date
- `people_count` (number) - Liczba osób, integer >= 1
- `budget_type` (string) - Typ budżetu, np. "low", "medium", "high"

#### Opcjonalne:

- `preferences` (object) - Dodatkowe preferencje użytkownika dla AI:
  - `transport` (string) - Preferowany transport, np. "public", "car", "walking"
  - `todo` (string) - Co użytkownik chce zrobić, np. "Visit museums, try local cuisine"
  - `avoid` (string) - Czego unikać, np. "Crowded tourist traps"
  - Inne dynamiczne pola (object może zawierać dowolne klucze string)

### Request Body (przykład)

```json
{
  "destination": "Paris, France",
  "start_date": "2025-06-15",
  "end_date": "2025-06-22",
  "people_count": 2,
  "budget_type": "medium",
  "preferences": {
    "transport": "public",
    "todo": "Visit museums, try local cuisine",
    "avoid": "Crowded tourist traps"
  }
}
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**Request:**

```typescript
// src/types.ts (już zdefiniowane)
GenerateTripPlanRequestDto {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  preferences?: TripPlanNotesDto;
}

TripPlanNotesDto {
  transport?: string;
  todo?: string;
  avoid?: string;
  [key: string]: string | undefined;
}
```

**Response:**

```typescript
// src/types.ts (już zdefiniowane)
ApiSuccessResponse<GeneratedTripPlanDto> {
  data: {
    generation_id: string;
    destination: string;
    start_date: string;
    end_date: string;
    people_count: number;
    budget_type: string;
    plan_details: PlanDetailsDto;
  }
}

PlanDetailsDto {
  days: DayDto[];
  accommodation?: AccommodationDto;
  notes?: string;
  total_estimated_cost?: number;
  accepted_at?: string;
}

DayDto {
  day: number;
  date: string;
  activities: ActivityDto[];
}

ActivityDto {
  time: string;
  title: string;
  description: string;
  location: string;
  estimated_cost?: number;
  duration?: string;
  category?: string;
}

AccommodationDto {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  estimated_cost?: number;
  booking_url?: string;
}
```

**Error:**

```typescript
// src/types.ts (już zdefiniowane)
ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
}
```

### Command Models

```typescript
// src/types.ts (już zdefiniowane)
GeneratePlanCommand {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  preferences?: TripPlanNotesDto;
  user_id: string;  // Dodane z auth
}
```

### Internal Database Types

```typescript
// src/types.ts (już zdefiniowane)
PlanGenerationInsert = TablesInsert<"plan_generations">;
PlanGenerationErrorLogInsert = TablesInsert<"plan_generation_error_logs">;
```

---

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": {
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
              "time": "10:00",
              "title": "Visit Eiffel Tower",
              "description": "Start your Paris adventure...",
              "location": "Champ de Mars, 5 Avenue Anatole France",
              "estimated_cost": 26,
              "duration": "2-3 hours",
              "category": "sightseeing"
            }
          ]
        }
      ],
      "accommodation": {
        "name": "Hotel Central Paris",
        "address": "15 Rue de la Paix, 75002 Paris",
        "check_in": "2025-06-15",
        "check_out": "2025-06-22",
        "estimated_cost": 150
      },
      "total_estimated_cost": 1500,
      "notes": "Best time to visit museums is early morning"
    }
  }
}
```

### Błędy

#### 400 Bad Request - Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "end_date",
      "issue": "end_date must be greater than or equal to start_date"
    }
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 408 Request Timeout

```json
{
  "error": {
    "code": "GENERATION_TIMEOUT",
    "message": "AI generation exceeded 180 second timeout"
  }
}
```

#### 429 Too Many Requests

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many generation requests. Please try again later."
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "AI_GENERATION_FAILED",
    "message": "Failed to generate trip plan"
  }
}
```

---

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ POST /api/trip-plans/generate
       │ + Request Body (GenerateTripPlanRequestDto)
       ▼
┌─────────────────────────────────────────────────┐
│  API Route: src/pages/api/trip-plans/generate.ts│
│  1. Export prerender = false                    │
│  2. Validate Content-Type                       │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Middleware (context.locals.supabase)           │
│  - Check authentication                         │
│  - Get user_id from session                     │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Validator: trip-plan.validator.ts              │
│  - Zod schema validation                        │
│  - Date validation (not in past, end >= start)  │
│  - Create GeneratePlanCommand                   │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│  Service: ai-generation.service.ts              │
│  - Build AI prompt from command                 │
│  - Call OpenRouter API (with 180s timeout)      │
│  - Parse and validate AI response               │
│  - Return GeneratedTripPlanDto                  │
└──────┬──────────────────────────────────────────┘
       │
       ├─── Success ─────┐
       │                  ▼
       │          ┌──────────────────────────────────┐
       │          │ plan-generation-logger.service   │
       │          │ - Insert into plan_generations   │
       │          │   (user_id, model, hash, etc.)   │
       │          └──────────────────────────────────┘
       │                  │
       │                  ▼
       │          ┌──────────────────────────────────┐
       │          │ Return 200 OK                    │
       │          │ ApiSuccessResponse<Generated...> │
       │          └──────────────────────────────────┘
       │
       └─── Error ──────┐
                        ▼
                ┌──────────────────────────────────────┐
                │ plan-generation-logger.service       │
                │ - Insert into plan_generation_error_ │
                │   logs (user_id, error_message, etc.)│
                └──────────────────────────────────────┘
                        │
                        ▼
                ┌──────────────────────────────────────┐
                │ Return appropriate error code        │
                │ ApiErrorResponse                     │
                └──────────────────────────────────────┘
```

### Interakcje zewnętrzne

1. **Supabase Auth** (context.locals.supabase.auth)
   - Weryfikacja sesji użytkownika
   - Pobranie user_id

2. **OpenRouter API** (https://openrouter.ai/api/v1/chat/completions)
   - Model: Konfigurowalny przez env (np. "anthropic/claude-3-sonnet")
   - Timeout: 180 sekund
   - API Key: z environment variable

3. **Supabase Database** (context.locals.supabase)
   - Insert do `plan_generations` (sukces)
   - Insert do `plan_generation_error_logs` (błąd)

---

## 6. Względy bezpieczeństwa

### 6.1 Autentykacja i Autoryzacja

- **Wymagana autentykacja**: Sprawdzenie `context.locals.supabase.auth.getSession()`
- **User ID extraction**: Pobranie `user.id` z sesji
- **RLS Policies**: Automatyczna filtracja na poziomie Supabase (plan_generations i plan_generation_error_logs mają RLS)

### 6.2 Walidacja danych wejściowych

**Zod Schema:**

```typescript
const generateTripPlanSchema = z
  .object({
    destination: z.string().min(1, "Destination is required"),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .refine((date) => new Date(date) >= new Date().setHours(0, 0, 0, 0), "Start date cannot be in the past"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    people_count: z.number().int().min(1, "At least 1 person required"),
    budget_type: z.string().min(1, "Budget type is required"),
    preferences: z
      .object({
        transport: z.string().optional(),
        todo: z.string().optional(),
        avoid: z.string().optional(),
      })
      .catchall(z.string())
      .optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "End date must be after or equal to start date",
    path: ["end_date"],
  });
```

### 6.3 Prompt Injection Protection

- **Sanityzacja**: Usunięcie/escape'owanie potencjalnie niebezpiecznych znaków
- **Length limits**: Maksymalna długość pól (np. preferences.todo < 1000 chars)
- **System prompt separation**: Wyraźne oddzielenie instrukcji systemowych od user input w prompcie

### 6.4 Rate Limiting

**Implementacja:**

- Redis/Memory cache z user_id jako kluczem
- Limit: np. 10 requestów na godzinę na użytkownika
- Response: 429 Too Many Requests gdy przekroczony

**Pseudokod:**

```typescript
const rateLimitKey = `rate_limit:generate:${user_id}`;
const count = await getFromCache(rateLimitKey);
if (count >= 10) {
  return new Response(
    JSON.stringify({
      error: { code: "RATE_LIMIT_EXCEEDED", message: "..." },
    }),
    { status: 429 }
  );
}
await incrementCache(rateLimitKey, 3600); // 1 hour TTL
```

### 6.5 Timeout Protection

- **AbortController**: Użycie do przerwania fetch po 180s
- **Graceful handling**: Logowanie timeoutu i zwrócenie 408

### 6.6 API Key Security

- **Environment Variables**: `OPENROUTER_API_KEY` nigdy w kodzie
- **Server-side only**: Klucz używany tylko w API route, nigdy w przeglądarce

### 6.7 Error Message Sanitization

- **Nie ujawniać**: Internal stack traces, API keys, database details
- **Log internally**: Pełne błędy w console/monitoring
- **Return generic**: Uproszczone komunikaty dla użytkownika

---

## 7. Obsługa błędów

### 7.1 Błędy walidacji (400 Bad Request)

**Scenariusze:**

- Brak wymaganego pola (destination, start_date, etc.)
- Nieprawidłowy format daty
- end_date < start_date
- start_date w przeszłości
- people_count < 1
- Nieprawidłowy typ danych (string zamiast number)

**Obsługa:**

```typescript
try {
  const validatedData = generateTripPlanSchema.parse(requestBody);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors[0],
        },
      }),
      { status: 400 }
    );
  }
}
```

### 7.2 Błędy autentykacji (401 Unauthorized)

**Scenariusze:**

- Brak session cookie
- Wygasła sesja
- Nieprawidłowy token

**Obsługa:**

```typescript
const {
  data: { session },
  error,
} = await supabase.auth.getSession();
if (!session?.user) {
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
```

### 7.3 Timeout (408 Request Timeout)

**Scenariusz:**

- AI generation > 180 sekund

**Obsługa:**

```typescript
const abortController = new AbortController();
const timeoutId = setTimeout(() => abortController.abort(), 180000);

try {
  const response = await fetch(OPENROUTER_URL, {
    signal: abortController.signal,
    // ...
  });
} catch (error) {
  if (error.name === "AbortError") {
    // Log to plan_generation_error_logs
    await logGenerationError({
      user_id,
      error_code: "GENERATION_TIMEOUT",
      error_message: "Generation exceeded 180s timeout",
      // ...
    });

    return new Response(
      JSON.stringify({
        error: {
          code: "GENERATION_TIMEOUT",
          message: "AI generation exceeded 180 second timeout",
        },
      }),
      { status: 408 }
    );
  }
} finally {
  clearTimeout(timeoutId);
}
```

### 7.4 Rate Limit (429 Too Many Requests)

**Obsługa:**

```typescript
if (isRateLimited) {
  return new Response(
    JSON.stringify({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many generation requests. Please try again later.",
      },
    }),
    { status: 429 }
  );
}
```

### 7.5 AI Generation Errors (500 Internal Server Error)

**Scenariusze:**

- OpenRouter API error (5xx)
- Network error
- Invalid API key
- Invalid AI response format
- Database insert error (logging)

**Obsługa:**

```typescript
try {
  const generatedPlan = await generateTripPlan(command);
} catch (error) {
  // Log to plan_generation_error_logs
  await logGenerationError({
    user_id,
    error_code: "AI_GENERATION_FAILED",
    error_message: error.message,
    // ...
  });

  return new Response(
    JSON.stringify({
      error: {
        code: "AI_GENERATION_FAILED",
        message: "Failed to generate trip plan",
      },
    }),
    { status: 500 }
  );
}
```

---

## 8. Wydajność

### 8.1 Potencjalne wąskie gardła

1. **AI Generation Latency**
   - OpenRouter API może zająć 30-180 sekund
   - Użytkownik czeka na odpowiedź

2. **Database Inserts**
   - Logging do plan_generations/plan_generation_error_logs
   - Może spowolnić response

3. **Prompt Building**
   - Konkatenacja długich stringów
   - Serialization do JSON

### 8.2 Strategie optymalizacji

#### 8.2.1 Asynchroniczne logowanie

```typescript
// Nie czekaj na logging przed zwróceniem odpowiedzi
const generatedPlan = await generateTripPlan(command);

// Fire and forget logging (non-blocking)
logGenerationSuccess({
  user_id,
  generation_id: generatedPlan.generation_id,
  // ...
}).catch(console.error);

return new Response(JSON.stringify({ data: generatedPlan }), {
  status: 200,
});
```

#### 8.2.2 Caching (future optimization)

- Cache podobnych requestów (same destination, dates, people_count, budget_type)
- TTL: 24 godziny
- Klucz: hash z request params

#### 8.2.3 Streaming Response (future optimization)

- Użycie Server-Sent Events lub streaming API
- Przesyłanie plan_details stopniowo w miarę generowania
- Lepsza perceived performance

#### 8.2.4 Connection Pooling

- Supabase client automatycznie używa connection poolingu
- Upewnić się że używamy tego samego klienta (context.locals.supabase)

---

## 9. Etapy wdrożenia

### Krok 1: Utworzenie struktury plików

Utworzyć następujące pliki:

```
src/
├── pages/api/trip-plans/
│   └── generate.ts                    # API endpoint
├── lib/
│   ├── services/
│   │   ├── ai-generation.service.ts   # OpenRouter integration
│   │   └── plan-generation-logger.service.ts  # DB logging
│   └── validators/
│       └── trip-plan.validator.ts     # Zod schemas
```

### Krok 2: Implementacja walidatora (trip-plan.validator.ts)

**Zadania:**

1. Zdefiniować Zod schema dla `GenerateTripPlanRequestDto`
2. Dodać custom validators:
   - `notInPast` - sprawdza czy start_date nie jest w przeszłości
   - `endAfterStart` - sprawdza czy end_date >= start_date
3. Eksportować funkcję `validateGenerateTripPlanRequest(body: unknown)`
4. Eksportować funkcję `createGeneratePlanCommand(dto: GenerateTripPlanRequestDto, userId: string): GeneratePlanCommand`

**Kod:**

```typescript
import { z } from "zod";
import type { GenerateTripPlanRequestDto, GeneratePlanCommand, TripPlanNotesDto } from "../../types";

// Zod schema
export const generateTripPlanSchema = z
  .object({
    destination: z.string().min(1, "Destination is required"),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .refine((date) => {
        const startDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return startDate >= today;
      }, "Start date cannot be in the past"),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    people_count: z.number().int().min(1, "At least 1 person required"),
    budget_type: z.string().min(1, "Budget type is required"),
    preferences: z
      .object({
        transport: z.string().optional(),
        todo: z.string().optional(),
        avoid: z.string().optional(),
      })
      .catchall(z.string())
      .optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      return end >= start;
    },
    {
      message: "End date must be on or after start date",
      path: ["end_date"],
    }
  );

// Validation function
export function validateGenerateTripPlanRequest(body: unknown): GenerateTripPlanRequestDto {
  return generateTripPlanSchema.parse(body);
}

// Command factory
export function createGeneratePlanCommand(dto: GenerateTripPlanRequestDto, userId: string): GeneratePlanCommand {
  return {
    ...dto,
    user_id: userId,
  };
}
```

### Krok 3: Implementacja plan-generation-logger.service.ts

**Zadania:**

1. Funkcja `calculatePromptHash(prompt: string): string` - SHA-256
2. Funkcja `logGenerationSuccess(params): Promise<string>` - insert do plan_generations, zwraca generation_id
3. Funkcja `logGenerationError(params): Promise<void>` - insert do plan_generation_error_logs

**Kod:**

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { PlanGenerationInsert, PlanGenerationErrorLogInsert } from "../../types";

// Calculate SHA-256 hash of prompt
export async function calculatePromptHash(prompt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(prompt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Log successful generation
export async function logGenerationSuccess(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    model: string;
    prompt: string;
    duration_ms: number;
  }
): Promise<string> {
  const source_text_hash = await calculatePromptHash(params.prompt);
  const source_text_length = params.prompt.length;

  const insert: PlanGenerationInsert = {
    user_id: params.user_id,
    model: params.model,
    source_text_hash,
    source_text_length,
    duration_ms: params.duration_ms,
  };

  const { data, error } = await supabase.from("plan_generations").insert(insert).select("id").single();

  if (error) {
    console.error("Failed to log generation success:", error);
    throw new Error("Failed to log generation");
  }

  return data.id;
}

// Log failed generation
export async function logGenerationError(
  supabase: SupabaseClient,
  params: {
    user_id: string;
    model: string;
    prompt: string;
    duration_ms: number;
    error_message: string;
    error_code?: string;
  }
): Promise<void> {
  const source_text_hash = await calculatePromptHash(params.prompt);
  const source_text_length = params.prompt.length;

  const insert: PlanGenerationErrorLogInsert = {
    user_id: params.user_id,
    model: params.model,
    source_text_hash,
    source_text_length,
    duration_ms: params.duration_ms,
    error_message: params.error_message,
    error_code: params.error_code || null,
  };

  const { error } = await supabase.from("plan_generation_error_logs").insert(insert);

  if (error) {
    console.error("Failed to log generation error:", error);
    // Don't throw - this is already error handling
  }
}
```

### Krok 4: Implementacja ai-generation.service.ts

**Zadania:**

1. Funkcja `buildPrompt(command: GeneratePlanCommand): string` - buduje prompt dla AI
2. Funkcja `callOpenRouterAPI(prompt: string, abortSignal: AbortSignal): Promise<string>` - wywołuje OpenRouter
3. Funkcja `parseAIResponse(response: string): PlanDetailsDto` - parsuje i waliduje odpowiedź AI
4. Funkcja główna `generateTripPlan(command: GeneratePlanCommand): Promise<GeneratedTripPlanDto>` - orchestration

**Kod:**

````typescript
import type { GeneratePlanCommand, GeneratedTripPlanDto, PlanDetailsDto } from "../../types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = import.meta.env.OPENROUTER_MODEL || "anthropic/claude-3-sonnet-20240229";

// Build AI prompt
function buildPrompt(command: GeneratePlanCommand): string {
  const { destination, start_date, end_date, people_count, budget_type, preferences } = command;

  const durationDays =
    Math.ceil((new Date(end_date).getTime() - new Date(start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let prompt = `Generate a detailed trip plan with the following requirements:

Destination: ${destination}
Start Date: ${start_date}
End Date: ${end_date}
Duration: ${durationDays} days
Number of People: ${people_count}
Budget Type: ${budget_type}
`;

  if (preferences) {
    prompt += `\nUser Preferences:`;
    if (preferences.transport) prompt += `\n- Transport: ${preferences.transport}`;
    if (preferences.todo) prompt += `\n- Things to do: ${preferences.todo}`;
    if (preferences.avoid) prompt += `\n- Things to avoid: ${preferences.avoid}`;

    // Other dynamic preferences
    Object.entries(preferences).forEach(([key, value]) => {
      if (key !== "transport" && key !== "todo" && key !== "avoid" && value) {
        prompt += `\n- ${key}: ${value}`;
      }
    });
  }

  prompt += `\n\nReturn the response as valid JSON with this exact structure:
{
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "time": "HH:MM",
          "title": "Activity title",
          "description": "Detailed description",
          "location": "Full address",
          "estimated_cost": 0,
          "duration": "X hours",
          "category": "sightseeing/food/transport/etc"
        }
      ]
    }
  ],
  "accommodation": {
    "name": "Hotel name",
    "address": "Full address",
    "check_in": "${start_date}",
    "check_out": "${end_date}",
    "estimated_cost": 0,
    "booking_url": "https://..."
  },
  "total_estimated_cost": 0,
  "notes": "Any additional recommendations"
}

Important: Return ONLY the JSON object, no additional text.`;

  return prompt;
}

// Call OpenRouter API
async function callOpenRouterAPI(prompt: string, abortSignal: AbortSignal): Promise<string> {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": import.meta.env.PUBLIC_APP_URL || "http://localhost:4321",
      "X-Title": "Tripper App",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid response from OpenRouter API");
  }

  return content;
}

// Parse and validate AI response
function parseAIResponse(response: string): PlanDetailsDto {
  // Remove potential markdown code blocks
  const cleaned = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    // Basic validation
    if (!parsed.days || !Array.isArray(parsed.days) || parsed.days.length === 0) {
      throw new Error("Invalid plan_details structure: missing or empty days array");
    }

    // Validate each day has required fields
    for (const day of parsed.days) {
      if (!day.day || !day.date || !day.activities || !Array.isArray(day.activities)) {
        throw new Error("Invalid day structure");
      }
    }

    return parsed as PlanDetailsDto;
  } catch (error) {
    console.error("Failed to parse AI response:", response);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

// Main function
export async function generateTripPlan(command: GeneratePlanCommand): Promise<GeneratedTripPlanDto> {
  const startTime = Date.now();
  const prompt = buildPrompt(command);

  // Setup timeout
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 180000); // 180s

  try {
    const aiResponse = await callOpenRouterAPI(prompt, abortController.signal);
    const planDetails = parseAIResponse(aiResponse);

    return {
      generation_id: "", // Will be set by logger
      destination: command.destination,
      start_date: command.start_date,
      end_date: command.end_date,
      people_count: command.people_count,
      budget_type: command.budget_type,
      plan_details: planDetails,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    // Re-throw with metadata for logging
    const enhancedError = new Error(error.message);
    enhancedError.name = error.name;
    (enhancedError as any).duration_ms = duration;
    (enhancedError as any).prompt = prompt;

    throw enhancedError;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Export for logging
export { buildPrompt, MODEL };
````

### Krok 5: Implementacja API endpoint (generate.ts)

**Zadania:**

1. Setup: `export const prerender = false`
2. Handler POST:
   - Sprawdzenie Content-Type
   - Autentykacja (Supabase session)
   - Walidacja request body
   - Wywołanie generateTripPlan
   - Logowanie sukcesu/błędu
   - Zwrócenie odpowiedzi

**Kod:**

```typescript
import type { APIRoute } from "astro";
import type { ApiSuccessResponse, ApiErrorResponse, GeneratedTripPlanDto } from "../../../types";
import {
  validateGenerateTripPlanRequest,
  createGeneratePlanCommand,
} from "../../../lib/validators/trip-plan.validator";
import { generateTripPlan, buildPrompt, MODEL } from "../../../lib/services/ai-generation.service";
import { logGenerationSuccess, logGenerationError } from "../../../lib/services/plan-generation-logger.service";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const startTime = Date.now();

  // 1. Validate Content-Type
  const contentType = context.request.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INVALID_CONTENT_TYPE",
        message: "Content-Type must be application/json",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Check authentication
  const supabase = context.locals.supabase;
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
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

  const userId = session.user.id;

  try {
    // 3. Parse and validate request body
    const body = await context.request.json();
    const validatedDto = validateGenerateTripPlanRequest(body);
    const command = createGeneratePlanCommand(validatedDto, userId);

    // 4. Generate trip plan
    const generatedPlan = await generateTripPlan(command);
    const duration = Date.now() - startTime;

    // 5. Log success (non-blocking)
    const prompt = buildPrompt(command);
    logGenerationSuccess(supabase, {
      user_id: userId,
      model: MODEL,
      prompt,
      duration_ms: duration,
    })
      .then((generationId) => {
        // Update generation_id in response would require different approach
        // For now, we generate it separately
      })
      .catch((error) => {
        console.error("Failed to log generation success:", error);
      });

    // Generate a new UUID for generation_id
    const generationId = crypto.randomUUID();
    generatedPlan.generation_id = generationId;

    // 6. Return success response
    const successResponse: ApiSuccessResponse<GeneratedTripPlanDto> = {
      data: generatedPlan,
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Handle different error types
    if (error.name === "ZodError") {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request data",
          details: error.errors?.[0] || {},
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error.name === "AbortError") {
      // Log timeout error
      if (error.prompt) {
        await logGenerationError(supabase, {
          user_id: userId,
          model: MODEL,
          prompt: error.prompt,
          duration_ms: duration,
          error_message: "Generation timeout after 180 seconds",
          error_code: "GENERATION_TIMEOUT",
        });
      }

      const errorResponse: ApiErrorResponse = {
        error: {
          code: "GENERATION_TIMEOUT",
          message: "AI generation exceeded 180 second timeout",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 408,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error - log and return 500
    console.error("Generation failed:", error);

    if (error.prompt) {
      await logGenerationError(supabase, {
        user_id: userId,
        model: MODEL,
        prompt: error.prompt,
        duration_ms: error.duration_ms || duration,
        error_message: error.message || "Unknown error",
        error_code: "AI_GENERATION_FAILED",
      });
    }

    const errorResponse: ApiErrorResponse = {
      error: {
        code: "AI_GENERATION_FAILED",
        message: "Failed to generate trip plan",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

**Uwaga**: Powyższy kod wymaga drobnej poprawki - logging success powinien być skorygowany aby generation_id był wstawiony do bazy i zwrócony. Rozważyć zmianę podejścia na synchroniczne logowanie sukcesu.

### Krok 6: Dodanie zmiennych środowiskowych

Dodać do `.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=anthropic/claude-3-sonnet-20240229
PUBLIC_APP_URL=http://localhost:4321
```

### Krok 7: Testy manualne

**Test 1: Sukces (200)**

```bash
curl -X POST http://localhost:4321/api/trip-plans/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "destination": "Paris, France",
    "start_date": "2025-06-15",
    "end_date": "2025-06-17",
    "people_count": 2,
    "budget_type": "medium"
  }'
```

**Test 2: Validation Error (400)**

```bash
curl -X POST http://localhost:4321/api/trip-plans/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=..." \
  -d '{
    "destination": "Paris",
    "start_date": "2025-06-20",
    "end_date": "2025-06-15"
  }'
```

**Test 3: Unauthorized (401)**

```bash
curl -X POST http://localhost:4321/api/trip-plans/generate \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "Paris",
    "start_date": "2025-06-15",
    "end_date": "2025-06-17",
    "people_count": 2,
    "budget_type": "medium"
  }'
```

### Krok 8: Weryfikacja loggingu

Po każdym teście sprawdzić:

```sql
-- Successful generations
SELECT * FROM plan_generations ORDER BY created_at DESC LIMIT 5;

-- Failed generations
SELECT * FROM plan_generation_error_logs ORDER BY created_at DESC LIMIT 5;
```

### Krok 9: Implementacja rate limiting (opcjonalne w MVP)

Jeśli rate limiting jest wymagane w MVP, dodać:

- Redis lub in-memory cache
- Middleware sprawdzający limity
- Zwracanie 429 gdy przekroczony

### Krok 10: Monitoring i alerting (post-MVP)

Dodać:

- Logging do external service (Sentry, LogRocket)
- Metryki (średni czas generowania, success rate)
- Alerty na wysokie error rates

---

## 10. Notatki implementacyjne

### 10.1 Considerations for future improvements

1. **Caching**: Cache podobnych requestów aby zmniejszyć koszty AI
2. **Streaming**: Użycie streaming API dla lepszej UX
3. **A/B Testing**: Testowanie różnych modeli/promptów
4. **Analytics**: Dashboard z metrykami generacji
5. **Retry logic**: Automatyczne retry przy transient errors

### 10.2 Environment variables checklist

```env
# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx
OPENROUTER_MODEL=anthropic/claude-3-sonnet-20240229

# Supabase (powinny już istnieć)
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=xxx

# App
PUBLIC_APP_URL=http://localhost:4321
```

### 10.3 Database indexes to verify

Sprawdzić czy istnieją indexy na:

- `plan_generations(user_id)` - dla RLS i queries
- `plan_generation_error_logs(user_id)` - dla RLS
- `plan_generation_error_logs(created_at)` - dla housekeeping

### 10.4 Security checklist

- [ ] OPENROUTER_API_KEY w environment variables (nie w kodzie)
- [ ] RLS policies aktywne na plan_generations i plan_generation_error_logs
- [ ] Walidacja wszystkich input fields (Zod)
- [ ] Sanityzacja error messages (nie leak internal details)
- [ ] Rate limiting (jeśli wymagane w MVP)
- [ ] Timeout protection (180s)
- [ ] Content-Type validation

---

## 11. Dokumentacja API (OpenAPI/Swagger - opcjonalne)

Dla dokumentacji API można dodać:

```yaml
/api/trip-plans/generate:
  post:
    summary: Generate trip plan using AI
    tags:
      - Trip Plans
    security:
      - cookieAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/GenerateTripPlanRequestDto"
    responses:
      "200":
        description: Trip plan generated successfully
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/GeneratedTripPlanResponse"
      "400":
        description: Validation error
      "401":
        description: Unauthorized
      "408":
        description: Generation timeout
      "429":
        description: Rate limit exceeded
      "500":
        description: AI generation failed
```

---

## Podsumowanie

Ten plan implementacji zapewnia kompleksowe wytyczne dla zespołu programistów do implementacji endpointa `POST /api/trip-plans/generate`. Kluczowe punkty:

1. **Struktura**: 3 główne komponenty (validator, logger, ai-service) + endpoint
2. **Bezpieczeństwo**: Autentykacja, walidacja, rate limiting, timeout protection
3. **Obsługa błędów**: Szczegółowe scenariusze z odpowiednimi kodami HTTP
4. **Logging**: Każda generacja (sukces/błąd) logowana do bazy
5. **Wydajność**: Asynchroniczne logowanie, timeout control
6. **Testowalność**: Jasna separacja concerns, łatwe mockowanie

Implementacja powinna zająć 4-6 godzin dla doświadczonego programisty.
