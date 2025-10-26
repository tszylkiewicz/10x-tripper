# API Endpoint Implementation Plan: GET /api/preferences

## 1. Przegląd punktu końcowego

Endpoint GET /api/preferences służy do pobierania wszystkich szablonów preferencji (preference templates) należących do zalogowanego użytkownika. Każdy szablon preferencji zawiera domyślne ustawienia, które użytkownik może wykorzystać podczas planowania kolejnych wycieczek, takie jak liczba osób i typ budżetu.

**Cel:**

- Umożliwienie użytkownikowi przeglądania zapisanych szablonów preferencji
- Zapewnienie szybkiego dostępu do często używanych konfiguracji planowania podróży

**Kluczowe wymagania:**

- Zwracanie tylko preferencji należących do zalogowanego użytkownika
- Uwierzytelnienie użytkownika jest obowiązkowe
- Brak paginacji (wszystkie preferencje użytkownika w jednym response)

## 2. Szczegóły żądania

**Metoda HTTP:** `GET`

**Struktura URL:** `/api/preferences`

**Parametry:**

- **Wymagane:** Brak parametrów query, path ani body
- **Opcjonalne:** Brak
- **Uwierzytelnienie:** Wymagany token Supabase auth w nagłówku `Authorization: Bearer <token>`

**Request Headers:**

```
Authorization: Bearer <supabase_jwt_token>
Content-Type: application/json
```

**Request Body:** Brak (GET request)

**Przykładowe wywołanie:**

```bash
curl -X GET https://yourdomain.com/api/preferences \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

**UserPreferenceDto** - typ odpowiedzi (zdefiniowany w `src/types.ts:74`)

```typescript
export type UserPreferenceDto = Pick<Tables<"user_preferences">, "id" | "name" | "people_count" | "budget_type">;
```

**ApiSuccessResponse** - wrapper sukcesu (zdefiniowany w `src/types.ts:317`)

```typescript
export interface ApiSuccessResponse<T> {
  data: T;
}
```

**ApiErrorResponse** - wrapper błędu (zdefiniowany w `src/types.ts:325`)

```typescript
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Typy odpowiedzi endpointa

```typescript
// Success response type
type GetPreferencesResponse = ApiSuccessResponse<UserPreferenceDto[]>;

// Error response type
type ErrorResponse = ApiErrorResponse;
```

**Uwaga:** Endpoint NIE wykorzystuje Command Models, ponieważ jest to operacja odczytu bez parametrów wejściowych wymagających walidacji biznesowej.

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

**Status Code:** `200 OK`

**Response Body:**

```typescript
{
  "data": UserPreferenceDto[]
}
```

**Przykładowa odpowiedź:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Romantic Getaway",
      "people_count": 2,
      "budget_type": "medium"
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Family Vacation",
      "people_count": 4,
      "budget_type": "high"
    }
  ]
}
```

**Przypadek pustej listy:**

```json
{
  "data": []
}
```

### Błędy

#### 401 Unauthorized - Brak lub nieprawidłowy token

**Status Code:** `401 Unauthorized`

**Response Body:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please provide a valid token."
  }
}
```

**Przypadki:**

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu
- Token wygasł
- Token został unieważniony

#### 500 Internal Server Error - Błąd serwera

**Status Code:** `500 Internal Server Error`

**Response Body:**

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

**Przypadki:**

- Błąd połączenia z bazą danych
- Nieoczekiwany błąd podczas przetwarzania
- Problem z Supabase client

## 5. Przepływ danych

### Diagram przepływu

```
1. Request → Astro API Route Handler (src/pages/api/preferences/index.ts)
                ↓
2. Extract auth token from headers
                ↓
3. Validate authentication via Supabase
                ↓
4. Get authenticated user_id
                ↓
5. Call PreferenceService.getPreferences(user_id)
                ↓
6. Query user_preferences table (filtered by user_id)
                ↓
7. Map database results to UserPreferenceDto[]
                ↓
8. Wrap in ApiSuccessResponse
                ↓
9. Return 200 OK with JSON response
```

### Szczegółowy opis kroków

**Krok 1: Request Processing**

- Astro endpoint handler odbiera żądanie GET
- Wydobywa nagłówki z `context.request.headers`

**Krok 2-4: Authentication**

- Pobiera token z nagłówka Authorization
- Używa `supabaseClient.auth.getUser(token)` do weryfikacji
- Jeśli niepowodzenie → zwraca 401
- Jeśli sukces → wydobywa `user.id`

**Krok 5-6: Data Retrieval**

- Wywołuje serwis: `PreferenceService.getPreferences(userId)`
- Serwis wykonuje query:
  ```typescript
  supabaseClient
    .from("user_preferences")
    .select("id, name, people_count, budget_type")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  ```

**Krok 7-9: Response Formation**

- Mapuje wyniki do typu `UserPreferenceDto[]`
- Owija w `ApiSuccessResponse`
- Zwraca JSON z kodem 200

### Interakcje z zewnętrznymi systemami

**Supabase PostgreSQL:**

- Tabela: `user_preferences`
- Operacja: SELECT
- Filtr: `user_id = <authenticated_user_id>`
- Sortowanie: `created_at DESC` (najnowsze pierwsze)

**Supabase Auth:**

- Weryfikacja tokenu JWT
- Pobranie user_id z sesji

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

**Metoda:** Supabase JWT Token w nagłówku Authorization

**Implementacja:**

```typescript
const authHeader = context.request.headers.get("Authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please provide a valid token.",
      },
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const token = authHeader.replace("Bearer ", "");
const {
  data: { user },
  error,
} = await supabaseClient.auth.getUser(token);

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or expired token.",
      },
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Autoryzacja

**Zasada:** Users can only access their own preferences

**Implementacja:**

- Zawsze filtruj zapytanie przez `user_id` z tokenu
- NIGDY nie akceptuj `user_id` z parametrów żądania
- Wykorzystaj Row Level Security (RLS) w Supabase jako dodatkową warstwę ochrony

**Recommended RLS Policy:**

```sql
CREATE POLICY "Users can view their own preferences"
ON user_preferences
FOR SELECT
USING (auth.uid() = user_id);
```

### Walidacja danych

**Input Validation:**

- Brak parametrów wejściowych do walidacji
- Walidacja formatu tokenu (Bearer scheme)
- Walidacja istnienia użytkownika

**Output Validation:**

- Upewnij się, że zwracane są tylko dozwolone pola (id, name, people_count, budget_type)
- NIGDY nie zwracaj pól: user_id, created_at, updated_at (zgodnie z UserPreferenceDto)

### Zapobieganie atakom

**SQL Injection:**

- Używamy Supabase client z parametryzowanymi zapytaniami
- Brak surowego SQL

**XSS (Cross-Site Scripting):**

- JSON response automatycznie escapuje dane
- Brak renderowania HTML

**CSRF (Cross-Site Request Forgery):**

- GET endpoint bez side effects
- Token JWT zapewnia ochronę

**Rate Limiting:**

- Rozważ implementację rate limiting na poziomie API (np. 100 requests/min per user)
- Można użyć middleware lub Supabase Edge Functions

## 7. Obsługa błędów

### Katalog błędów

| Kod błędu             | Status HTTP | Scenariusz                    | Rozwiązanie                           |
| --------------------- | ----------- | ----------------------------- | ------------------------------------- |
| UNAUTHORIZED          | 401         | Brak nagłówka Authorization   | Dodaj token do nagłówka               |
| UNAUTHORIZED          | 401         | Nieprawidłowy format tokenu   | Użyj formatu: `Bearer <token>`        |
| UNAUTHORIZED          | 401         | Token wygasł                  | Odśwież token przez re-authentication |
| UNAUTHORIZED          | 401         | Token unieważniony            | Zaloguj się ponownie                  |
| INTERNAL_SERVER_ERROR | 500         | Błąd połączenia z bazą danych | Sprawdź konfigurację Supabase         |
| INTERNAL_SERVER_ERROR | 500         | Błąd Supabase client          | Sprawdź logi serwera                  |
| INTERNAL_SERVER_ERROR | 500         | Nieoczekiwany błąd            | Sprawdź logi, zgłoś błąd              |

### Strategia error handling

```typescript
try {
  // 1. Authentication
  const user = await authenticateRequest(context.request);

  // 2. Business logic
  const preferences = await PreferenceService.getPreferences(user.id);

  // 3. Success response
  return new Response(
    JSON.stringify({
      data: preferences,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
} catch (error) {
  // Error logging
  console.error("GET /api/preferences error:", error);

  // Known errors
  if (error instanceof UnauthorizedError) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Unknown errors
  return new Response(
    JSON.stringify({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred. Please try again later.",
        details: {
          timestamp: new Date().toISOString(),
        },
      },
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### Logging

**Co logować:**

- Wszystkie błędy 500 z pełnym stack trace
- Błędy uwierzytelnienia (bez wrażliwych danych)
- Czas wykonania zapytania (monitoring wydajności)

**Czego NIE logować:**

- Tokenów auth
- Pełnych nagłówków Authorization
- Danych osobowych użytkownika

**Przykład:**

```typescript
console.error("[GET /api/preferences]", {
  timestamp: new Date().toISOString(),
  userId: user?.id, // safe to log
  error: error.message,
  stack: error.stack,
});
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła

1. **Database Query Performance**
   - Problem: Wolne zapytanie dla użytkowników z wieloma preferencjami
   - Prawdopodobieństwo: Niskie (typowy użytkownik ma 5-20 preferencji)
   - Impact: Niski

2. **Network Latency**
   - Problem: Opóźnienie między aplikacją a Supabase
   - Impact: Średni
   - Mitigation: Użyj Supabase region najbliżej użytkowników

3. **Authentication Overhead**
   - Problem: Weryfikacja tokenu JWT przy każdym request
   - Impact: Niski (milliseconds)
   - Mitigation: Supabase cache session data

### Strategie optymalizacji

#### 1. Database Indexing

```sql
-- Already exists as primary key
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON user_preferences(user_id);

-- For better sorting performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_created
ON user_preferences(user_id, created_at DESC);
```

#### 2. Query Optimization

```typescript
// ✅ Good - select only needed fields
.select('id, name, people_count, budget_type')

// ❌ Bad - select all fields
.select('*')
```

#### 3. Response Caching

**Client-side caching:**

```typescript
// W frontend code
const preferences = await fetch("/api/preferences", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Cache-Control": "max-age=300", // 5 minutes
  },
});
```

**Server-side caching:** (opcjonalne dla przyszłości)

- Użyj Redis dla cache user preferences
- Invalidate cache przy CREATE/UPDATE/DELETE

#### 4. Connection Pooling

- Supabase automatycznie zarządza connection pooling
- Używaj singleton pattern dla supabaseClient (już zaimplementowane)

### Metryki wydajności (cel)

- **Response Time:** < 200ms (p95)
- **Database Query Time:** < 50ms (p95)
- **Error Rate:** < 0.1%
- **Availability:** > 99.9%

### Monitoring

```typescript
const startTime = performance.now();

// ... endpoint logic ...

const duration = performance.now() - startTime;
console.log(`[GET /api/preferences] Duration: ${duration}ms, User: ${user.id}`);
```

## 9. Etapy wdrożenia

### Krok 1: Przygotowanie struktury plików

**1.1 Utwórz API endpoint handler**

```
src/pages/api/preferences/index.ts
```

**1.2 Utwórz serwis dla logiki biznesowej**

```
src/services/preference.service.ts
```

**1.3 Utwórz helper dla uwierzytelnienia (reusable)**

```
src/lib/auth.helpers.ts
```

### Krok 2: Implementacja auth helper

**Plik:** `src/lib/auth.helpers.ts`

**Zadania:**

- [ ] Stworzyć funkcję `extractAuthToken(request: Request): string | null`
- [ ] Stworzyć funkcję `authenticateUser(token: string): Promise<User>`
- [ ] Stworzyć klasę `UnauthorizedError extends Error`
- [ ] Dodać error handling dla różnych przypadków auth failure

**Przykładowa implementacja:**

```typescript
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication required. Please provide a valid token.");
  }

  const token = authHeader.replace("Bearer ", "");
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(token);

  if (error || !user) {
    throw new UnauthorizedError("Invalid or expired token.");
  }

  return user;
}
```

### Krok 3: Implementacja PreferenceService

**Plik:** `src/services/preference.service.ts`

**Zadania:**

- [ ] Stworzyć klasę lub moduł `PreferenceService`
- [ ] Zaimplementować metodę `getPreferences(userId: string): Promise<UserPreferenceDto[]>`
- [ ] Dodać error handling dla database errors
- [ ] Dodać sortowanie wyników (created_at DESC)

**Przykładowa implementacja:**

```typescript
import { supabaseClient } from "../db/supabase.client";
import type { UserPreferenceDto } from "../types";

export class PreferenceService {
  static async getPreferences(userId: string): Promise<UserPreferenceDto[]> {
    const { data, error } = await supabaseClient
      .from("user_preferences")
      .select("id, name, people_count, budget_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error in getPreferences:", error);
      throw new Error("Failed to fetch preferences");
    }

    return data as UserPreferenceDto[];
  }
}
```

### Krok 4: Implementacja API endpoint

**Plik:** `src/pages/api/preferences/index.ts`

**Zadania:**

- [ ] Stworzyć GET handler funkcję
- [ ] Zintegrować auth helper
- [ ] Wywołać PreferenceService
- [ ] Sformatować response zgodnie z ApiSuccessResponse
- [ ] Dodać comprehensive error handling
- [ ] Dodać response headers (Content-Type, CORS jeśli potrzebne)

**Przykładowa struktura:**

```typescript
import type { APIRoute } from "astro";
import { authenticateRequest, UnauthorizedError } from "../../lib/auth.helpers";
import { PreferenceService } from "../../services/preference.service";
import type { ApiSuccessResponse, UserPreferenceDto, ApiErrorResponse } from "../../types";

export const GET: APIRoute = async (context) => {
  try {
    // 1. Authenticate
    const user = await authenticateRequest(context.request);

    // 2. Fetch preferences
    const preferences = await PreferenceService.getPreferences(user.id);

    // 3. Format response
    const response: ApiSuccessResponse<UserPreferenceDto[]> = {
      data: preferences,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[GET /api/preferences] Error:", error);

    if (error instanceof UnauthorizedError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "UNAUTHORIZED",
          message: error.message,
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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

### Krok 5: Database setup (jeśli jeszcze nie istnieje)

**Zadania:**

- [ ] Sprawdzić czy tabela `user_preferences` istnieje w Supabase
- [ ] Sprawdzić czy istnieje index na `user_id`
- [ ] Dodać RLS policy dla SELECT operation
- [ ] Przetestować connection z local development

**RLS Policy:**

```sql
-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT
CREATE POLICY "Users can view their own preferences"
ON user_preferences
FOR SELECT
USING (auth.uid() = user_id);
```

### Krok 6: Testing

**6.1 Unit Tests**

- [ ] Test PreferenceService.getPreferences()
  - Sukces: zwraca preferencje użytkownika
  - Sukces: zwraca pustą tablicę dla użytkownika bez preferencji
  - Błąd: rzuca wyjątek przy database error

**6.2 Integration Tests**

- [ ] Test GET /api/preferences endpoint
  - 200: authenticated user z preferencjami
  - 200: authenticated user bez preferencji (empty array)
  - 401: brak Authorization header
  - 401: nieprawidłowy token format
  - 401: wygasły token
  - 500: błąd bazy danych (mock)

**6.3 Manual Testing**

- [ ] Test w Postman/Thunder Client
- [ ] Test z frontend aplikacji
- [ ] Test performance (response time)

**Przykładowy test case:**

```bash
# Success case
curl -X GET http://localhost:4321/api/preferences \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json"

# Expected: 200 OK with data array

# Unauthorized case
curl -X GET http://localhost:4321/api/preferences \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
```

### Krok 7: Documentation

**Zadania:**

- [ ] Dodać komentarze JSDoc do functions
- [ ] Zaktualizować API documentation (jeśli istnieje)
- [ ] Dodać przykłady użycia w README (opcjonalne)

### Krok 8: Code Review i Deployment

**Code Review Checklist:**

- [ ] Kod zgodny z TypeScript best practices
- [ ] Wszystkie typy poprawnie zdefiniowane
- [ ] Error handling complete
- [ ] Security measures implemented (auth, filtering)
- [ ] Performance optimized (proper query, indexing)
- [ ] Tests passing
- [ ] No console.logs in production code (use proper logging)
- [ ] Response format matches specification

**Deployment:**

- [ ] Merge do main branch
- [ ] Deploy do staging environment
- [ ] Smoke tests na staging
- [ ] Deploy do production
- [ ] Monitor errors i performance przez pierwsze 24h

### Krok 9: Monitoring post-deployment

**Zadania:**

- [ ] Sprawdzić error logs (pierwsze 24h)
- [ ] Monitorować response times
- [ ] Sprawdzić rate of 401 errors (może wskazywać problemy z auth)
- [ ] Zbierać feedback od użytkowników

**Metryki do śledzenia:**

- Request count (total, per hour)
- Error rate (401, 500)
- Average response time
- P95/P99 response time
- Database query performance

---

## Podsumowanie

Ten endpoint jest fundamentalnym read-only API call o niskiej złożoności. Główne punkty uwagi to:

1. **Security first:** Poprawna implementacja uwierzytelnienia i autoryzacji
2. **Type safety:** Wykorzystanie istniejących DTOs z src/types.ts
3. **Error handling:** Comprehensive error handling dla wszystkich edge cases
4. **Performance:** Optymalizacja query i proper indexing
5. **Maintainability:** Wydzielenie logiki do serwisu i reusable auth helpers

Endpoint powinien być zaimplementowany w ~2-4 godziny pracy, włączając testy i dokumentację.
