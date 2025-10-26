# API Endpoint Implementation Plan: GET /api/preferences/:id

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania szczegółów pojedynczego szablonu preferencji użytkownika na podstawie jego identyfikatora UUID. Umożliwia użytkownikowi odczytanie zapisanego szablonu preferencji, który może być następnie wykorzystany do szybkiego tworzenia planów podróży z predefiniowanymi ustawieniami (liczba osób, typ budżetu).

**Cel biznesowy:** Umożliwienie użytkownikom zarządzania własnymi szablonami preferencji poprzez dostęp do konkretnego szablonu po ID.

**Zabezpieczenia:** Endpoint jest chroniony autoryzacją - użytkownik może pobrać tylko swoje własne preferencje.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/preferences/:id`
- **Content-Type:** N/A (GET request, brak body)
- **Autoryzacja:** Required (JWT Bearer Token)

### Parametry:

#### URL Parameters:

- **id** (wymagany, string w formacie UUID v4)
  - Identyfikator szablonu preferencji
  - Przykład: `550e8400-e29b-41d4-a716-446655440000`
  - Walidacja: Musi być poprawnym UUID v4

#### Query Parameters:

- Brak

#### Request Headers:

- `Authorization: Bearer <jwt_token>` (wymagany)
  - JWT token z Supabase Auth
  - Zawiera `user_id` w payload

#### Request Body:

- Brak (metoda GET)

## 3. Wykorzystywane typy

### Typy DTO (Response):

```typescript
// Z src/types.ts (linia 74)
export type UserPreferenceDto = Pick<Tables<"user_preferences">, "id" | "name" | "people_count" | "budget_type">;
```

### Typy Response Wrapper:

```typescript
// Z src/types.ts (linia 317-319)
export interface ApiSuccessResponse<T> {
  data: T;
}

// Z src/types.ts (linia 325-331)
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Typy wewnętrzne (Database):

```typescript
// Z src/db/database.types.ts
Tables<"user_preferences">; // Typ tabeli z bazy danych
```

## 4. Szczegóły odpowiedzi

### Sukces - 200 OK:

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Family Vacation Template",
    "people_count": 4,
    "budget_type": "medium"
  }
}
```

### Błąd - 400 Bad Request:

```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "The provided ID is not a valid UUID format",
    "details": {
      "field": "id",
      "value": "invalid-uuid"
    }
  }
}
```

### Błąd - 401 Unauthorized:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### Błąd - 404 Not Found:

```json
{
  "error": {
    "code": "PREFERENCE_NOT_FOUND",
    "message": "Preference not found or doesn't belong to user"
  }
}
```

**Uwaga bezpieczeństwa:** Celowo nie rozróżniamy między "nie istnieje" a "nie należy do użytkownika", aby uniknąć wycieków informacji o istniejących ID.

### Błąd - 500 Internal Server Error:

```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred while processing your request"
  }
}
```

## 5. Przepływ danych

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/preferences/:id
       │ Headers: Authorization: Bearer <token>
       ▼
┌─────────────────────────────┐
│  Astro API Route Handler    │
│  src/pages/api/             │
│  preferences/[id].ts        │
└──────┬──────────────────────┘
       │
       ├─► 1. Extract `id` from params
       │
       ├─► 2. Validate UUID format
       │    └─► If invalid → 400 Bad Request
       │
       ├─► 3. Extract JWT from Authorization header
       │    │
       │    ▼
       │   ┌──────────────────────┐
       │   │  Supabase Auth       │
       │   │  Verify JWT Token    │
       │   └──────────────────────┘
       │    │
       │    ├─► If invalid/missing → 401 Unauthorized
       │    └─► Extract user_id from token payload
       │
       ▼
┌─────────────────────────────┐
│  PreferencesService         │
│  src/services/              │
│  preferences.service.ts     │
└──────┬──────────────────────┘
       │
       │ getPreferenceById(id, user_id)
       │
       ▼
┌─────────────────────────────┐
│  Supabase Client            │
│  Database Query             │
└──────┬──────────────────────┘
       │
       │ SELECT * FROM user_preferences
       │ WHERE id = $1 AND user_id = $2
       │
       ├─► If not found → 404 Not Found
       │
       ├─► If DB error → 500 Internal Server Error
       │
       ▼
┌─────────────────────────────┐
│  Map to UserPreferenceDto   │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Wrap in                    │
│  ApiSuccessResponse         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────┐
│   Client    │ 200 OK + JSON Response
└─────────────┘
```

### Interakcje z zewnętrznymi serwisami:

1. **Supabase Auth:**
   - Weryfikacja JWT tokenu
   - Ekstrakcja `user_id` z tokenu

2. **Supabase Database (PostgreSQL):**
   - Query do tabeli `user_preferences`
   - Filtrowanie po `id` AND `user_id` (zapobieganie IDOR)

## 6. Względy bezpieczeństwa

### 6.1 Autoryzacja i Autentykacja

**Wymagania:**

- Każde żądanie MUSI zawierać ważny JWT token w headerze `Authorization: Bearer <token>`
- Token jest weryfikowany przez Supabase Auth
- Z tokenu ekstrahowany jest `user_id` użytkownika

**Implementacja:**

```typescript
const authHeader = request.headers.get("Authorization");
if (!authHeader?.startsWith("Bearer ")) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token",
      },
    }),
    { status: 401 }
  );
}

const token = authHeader.substring(7);
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid authentication token",
      },
    }),
    { status: 401 }
  );
}

const userId = user.id;
```

### 6.2 Ochrona przed IDOR (Insecure Direct Object Reference)

**Zagrożenie:** Użytkownik może próbować uzyskać dostęp do preferencji innego użytkownika, zgadując lub podstawiając UUID.

**Ochrona:**

```typescript
// Query MUSI zawierać oba warunki:
// 1. id = requested_id
// 2. user_id = authenticated_user_id

const { data, error } = await supabase
  .from("user_preferences")
  .select("*")
  .eq("id", id)
  .eq("user_id", userId) // ← Krytyczne zabezpieczenie
  .single();
```

**Uwaga:** Zwracamy generyczny błąd 404 zarówno gdy zasób nie istnieje, jak i gdy należy do innego użytkownika. To zapobiega wyciekowi informacji o istniejących ID.

### 6.3 Walidacja Danych Wejściowych

**UUID Validation:**

```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!UUID_REGEX.test(id)) {
  return new Response(
    JSON.stringify({
      error: {
        code: "INVALID_UUID",
        message: "The provided ID is not a valid UUID format",
        details: { field: "id" },
      },
    }),
    { status: 400 }
  );
}
```

### 6.4 Rate Limiting (Opcjonalne, ale zalecane)

Rozważyć implementację rate limiting per użytkownika:

- np. 100 requests/minute per user
- Ochrona przed nadmiernym odpytywaniem API
- Implementacja przez middleware lub Supabase Edge Functions

### 6.5 SQL Injection Prevention

- Używamy Supabase SDK, które automatycznie parametryzuje query
- NIE konstruujemy raw SQL queries z interpolacją stringów
- Walidacja UUID przed użyciem w query jako dodatkowa warstwa ochrony

## 7. Obsługa błędów

### 7.1 Katalog błędów

| Kod HTTP | Error Code            | Opis                               | Przyczyna                                        |
| -------- | --------------------- | ---------------------------------- | ------------------------------------------------ |
| 400      | INVALID_UUID          | Nieprawidłowy format UUID          | ID nie jest poprawnym UUID v4                    |
| 401      | UNAUTHORIZED          | Brak lub nieprawidłowa autoryzacja | Brak tokenu, token wygasły, token nieprawidłowy  |
| 404      | PREFERENCE_NOT_FOUND  | Preferencja nie znaleziona         | ID nie istnieje LUB należy do innego użytkownika |
| 500      | INTERNAL_SERVER_ERROR | Wewnętrzny błąd serwera            | Błąd DB, nieoczekiwany wyjątek                   |
| 500      | DATABASE_ERROR        | Błąd komunikacji z bazą danych     | Timeout, connection error                        |

### 7.2 Szczegółowa obsługa scenariuszy

#### Scenariusz 1: Nieprawidłowy format UUID

```typescript
// Walidacja formatu
if (!isValidUUID(id)) {
  return errorResponse(400, "INVALID_UUID", "The provided ID is not a valid UUID format", { field: "id", value: id });
}
```

#### Scenariusz 2: Brak tokenu autoryzacji

```typescript
const authHeader = request.headers.get("Authorization");
if (!authHeader) {
  return errorResponse(401, "UNAUTHORIZED", "Missing authentication token");
}
```

#### Scenariusz 3: Nieprawidłowy token JWT

```typescript
const {
  data: { user },
  error,
} = await supabase.auth.getUser(token);
if (error || !user) {
  return errorResponse(401, "UNAUTHORIZED", "Invalid or expired authentication token");
}
```

#### Scenariusz 4: Preferencja nie znaleziona lub brak dostępu

```typescript
const { data, error } = await supabase.from("user_preferences").select("*").eq("id", id).eq("user_id", userId).single();

if (error?.code === "PGRST116" || !data) {
  // PGRST116 = not found in PostgREST
  return errorResponse(404, "PREFERENCE_NOT_FOUND", "Preference not found or doesn't belong to user");
}
```

#### Scenariusz 5: Błąd bazy danych

```typescript
if (error && error.code !== "PGRST116") {
  console.error("Database error:", error);
  return errorResponse(500, "DATABASE_ERROR", "An error occurred while accessing the database");
}
```

#### Scenariusz 6: Nieoczekiwany błąd

```typescript
try {
  // ... main logic
} catch (error) {
  console.error("Unexpected error:", error);
  return errorResponse(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred while processing your request");
}
```

### 7.3 Logging

**Co logować:**

- Wszystkie błędy 500 (server errors) → szczegółowe logi
- Błędy 401/404 → podstawowe info (bez sensytywnych danych)
- Błędy 400 → opcjonalnie dla monitoringu

**Gdzie logować:**

- Console logs (server-side)
- Opcjonalnie: Sentry, LogRocket, lub inny monitoring service

**Co NIE logować:**

- JWT tokeny
- Pełne payloady z sentytywnymi danymi
- Internal stack traces w response do klienta

## 8. Rozważania dotyczące wydajności

### 8.1 Potencjalne wąskie gardła

1. **Database Query:**
   - Query do PostgreSQL przez Supabase
   - Potencjalny bottleneck przy wysokim trafficu

2. **JWT Verification:**
   - Weryfikacja tokenu przez Supabase Auth
   - Dodatkowe network call

3. **Cold Start:**
   - Pierwsze wywołanie Astro route może być wolniejsze
   - Dotyczy serverless deployments

### 8.2 Strategie optymalizacji

#### Indexy bazodanowe:

```sql
-- Index na (user_id, id) dla szybkich query
CREATE INDEX idx_user_preferences_user_id_id
ON user_preferences(user_id, id);

-- Primary key index już istnieje na `id`
-- Foreign key index już istnieje na `user_id`
```

#### Caching (opcjonalne):

- Rozważyć cache JWT verification results (krótki TTL, np. 30s)
- Cache user_preferences per user (invalidacja przy UPDATE/DELETE)
- Implementacja przez Redis lub in-memory cache

#### Connection Pooling:

- Supabase automatycznie zarządza connection pooling
- Upewnić się, że używamy jednej instancji Supabase client

#### Response Compression:

- Enable gzip/brotli compression dla JSON responses
- Konfiguracja na poziomie serwera (DigitalOcean/Docker)

### 8.3 Monitoring wydajności

**Metryki do śledzenia:**

- Średni czas odpowiedzi (target: <200ms)
- P95/P99 latency
- Database query time
- Auth verification time
- Error rate (target: <1%)

**Narzędzia:**

- Supabase Dashboard (database performance)
- Application Performance Monitoring (APM) tools
- Custom logging z timestamps

## 9. Etapy wdrożenia

### Krok 1: Aktualizacja definicji typu UserPreferenceDto

**Plik:** `src/types.ts` (linia 74)

**Zmiana:**

```typescript
// PRZED:
export type UserPreferenceDto = Pick<Tables<"user_preferences">, "id" | "name" | "people_count" | "budget_type">;

// PO:
export type UserPreferenceDto = Pick<
  Tables<"user_preferences">,
  "id" | "name" | "people_count" | "budget_type" | "created_at" | "updated_at"
>;
```

**Uzasadnienie:** Specyfikacja API wymaga pól `created_at` i `updated_at` w odpowiedzi.

### Krok 2: Utworzenie PreferencesService (jeśli nie istnieje)

**Plik:** `src/services/preferences.service.ts`

**Zawartość:**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import type { UserPreferenceDto } from "../types";

export class PreferencesService {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  /**
   * Pobiera preferencję użytkownika po ID
   * Weryfikuje, że preferencja należy do użytkownika
   */
  async getPreferenceById(id: string, userId: string): Promise<UserPreferenceDto | null> {
    const { data, error } = await this.supabase
      .from("user_preferences")
      .select("id, name, people_count, budget_type, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found
        return null;
      }
      throw error;
    }

    return data;
  }
}
```

### Krok 3: Utworzenie helper functions dla walidacji i responses

**Plik:** `src/lib/api-helpers.ts` (lub podobny)

```typescript
import type { ApiErrorResponse, ApiSuccessResponse } from "../types";

export function isValidUUID(uuid: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(uuid);
}

export function successResponse<T>(data: T, status: number = 200): Response {
  const response: ApiSuccessResponse<T> = { data };
  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  const response: ApiErrorResponse = {
    error: { code, message, details },
  };
  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function extractUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  // TODO: Implement JWT verification with Supabase
  // For now, this is a placeholder
  return null;
}
```

### Krok 4: Implementacja Astro API Route Handler

**Plik:** `src/pages/api/preferences/[id].ts`

```typescript
import type { APIRoute } from "astro";
import { PreferencesService } from "../../../services/preferences.service";
import { isValidUUID, successResponse, errorResponse } from "../../../lib/api-helpers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";

export const GET: APIRoute = async ({ params, request }) => {
  try {
    // 1. Extract and validate ID parameter
    const id = params.id;

    if (!id || !isValidUUID(id)) {
      return errorResponse(400, "INVALID_UUID", "The provided ID is not a valid UUID format", { field: "id" });
    }

    // 2. Extract and verify JWT token
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "UNAUTHORIZED", "Missing or invalid authentication token");
    }

    const token = authHeader.substring(7);

    // 3. Initialize Supabase client and verify user
    const supabase = createClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errorResponse(401, "UNAUTHORIZED", "Invalid or expired authentication token");
    }

    const userId = user.id;

    // 4. Fetch preference from database
    const preferencesService = new PreferencesService(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_ANON_KEY);

    const preference = await preferencesService.getPreferenceById(id, userId);

    // 5. Handle not found case
    if (!preference) {
      return errorResponse(404, "PREFERENCE_NOT_FOUND", "Preference not found or doesn't belong to user");
    }

    // 6. Return success response
    return successResponse(preference);
  } catch (error) {
    // 7. Handle unexpected errors
    console.error("Unexpected error in GET /api/preferences/:id:", error);

    return errorResponse(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred while processing your request");
  }
};
```

### Krok 5: Konfiguracja zmiennych środowiskowych

**Plik:** `.env` (nie commitować!)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

**Plik:** `astro.config.mjs`

Upewnić się, że zmienne są dostępne:

```javascript
import { defineConfig } from "astro/config";

export default defineConfig({
  // ... other config
  vite: {
    define: {
      "import.meta.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
      "import.meta.env.SUPABASE_ANON_KEY": JSON.stringify(process.env.SUPABASE_ANON_KEY),
    },
  },
});
```

### Krok 6: Weryfikacja indexów bazodanowych

**Sprawdzenie w Supabase Dashboard:**

```sql
-- Sprawdź istniejące indexy
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user_preferences';

-- Jeśli potrzebne, utwórz composite index
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id_id
ON user_preferences(user_id, id);
```

### Krok 7: Testy jednostkowe (opcjonalne, ale zalecane)

**Plik:** `src/services/__tests__/preferences.service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { PreferencesService } from "../preferences.service";

describe("PreferencesService", () => {
  let service: PreferencesService;

  beforeEach(() => {
    service = new PreferencesService(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  });

  it("should return preference for valid id and user_id", async () => {
    // TODO: Implement test
  });

  it("should return null for non-existent preference", async () => {
    // TODO: Implement test
  });

  it("should return null when preference belongs to different user", async () => {
    // TODO: Implement test
  });
});
```

### Krok 8: Testy integracyjne

**Plik:** `tests/api/preferences.test.ts`

```typescript
import { describe, it, expect } from "vitest";

describe("GET /api/preferences/:id", () => {
  it("should return 401 without auth token", async () => {
    // TODO: Implement test
  });

  it("should return 400 for invalid UUID", async () => {
    // TODO: Implement test
  });

  it("should return 404 for non-existent preference", async () => {
    // TODO: Implement test
  });

  it("should return 200 with preference data for valid request", async () => {
    // TODO: Implement test
  });
});
```

### Krok 9: Dokumentacja API (aktualizacja)

**Plik:** `docs/api/preferences.md`

- Dodać przykłady curl/fetch
- Dodać przykłady błędów
- Zaktualizować API reference

### Krok 10: Code Review i Testing

**Checklist:**

- [ ] Typ UserPreferenceDto zawiera wszystkie wymagane pola
- [ ] Walidacja UUID działa poprawnie
- [ ] Autoryzacja JWT jest poprawnie zaimplementowana
- [ ] IDOR protection jest aktywny (eq user_id)
- [ ] Wszystkie error cases są obsłużone
- [ ] Response format zgodny ze specyfikacją
- [ ] Logging błędów jest aktywny
- [ ] Testy jednostkowe przechodzą
- [ ] Testy integracyjne przechodzą
- [ ] Manual testing wykonany
- [ ] Code review completed

### Krok 11: Deployment

1. Merge do branch głównego (master/main)
2. Trigger CI/CD pipeline (Github Actions)
3. Deploy na DigitalOcean
4. Smoke tests na produkcji
5. Monitoring przez pierwsze 24h

---

## 10. Dodatkowe uwagi

### Zgodność z tech stack:

- ✅ Astro 5 - API Routes
- ✅ TypeScript 5 - Full typing
- ✅ Supabase - Auth + Database
- ✅ PostgreSQL - user_preferences table

### Bezpieczeństwo:

- ✅ JWT Authentication
- ✅ IDOR Protection
- ✅ SQL Injection Prevention
- ✅ UUID Validation
- ✅ Error Message Security (nie leakujemy informacji)

### Performance:

- ✅ Single DB query
- ✅ Proper indexing
- ✅ Minimal data transfer

### Maintainability:

- ✅ Service layer separation
- ✅ Reusable helper functions
- ✅ Clear error handling
- ✅ Type safety
