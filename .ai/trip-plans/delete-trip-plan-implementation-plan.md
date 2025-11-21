# API Endpoint Implementation Plan: DELETE /api/trip-plans/:id

## 1. Przegląd punktu końcowego

Endpoint służy do **soft delete** (miękkie usuwanie) zapisanego planu podróży użytkownika. Operacja ustawia timestamp `deleted_at` oraz `deleted_by` w rekordzie bazy danych, nie usuwając fizycznie danych. Dzięki temu możliwe jest późniejsze odzyskanie usuniętych planów lub analiza danych historycznych.

**Kluczowe cechy:**

- Operacja idempotentna (wielokrotne wywołanie nie zmienia wyniku)
- Soft delete zachowuje dane w bazie danych
- Trigger bazodanowy automatycznie ustawia `deleted_by` na podstawie `auth.uid()`
- RLS (Row Level Security) zapewnia, że użytkownik może usunąć tylko własne plany

---

## 2. Szczegóły żądania

### Metoda HTTP

`DELETE`

### Struktura URL

```
DELETE /api/trip-plans/:id
```

### Parametry

#### URL Parameters (wymagane)

- **`id`** (string, UUID) - Unikalny identyfikator planu podróży do usunięcia

#### Headers (wymagane)

- `Authorization: Bearer <token>` - Token sesji Supabase (TODO: obecnie nie zaimplementowane, hardcodowany userId)
- `Content-Type: application/json` (opcjonalnie)

#### Request Body

Brak - endpoint DELETE nie przyjmuje body.

#### Kontekst sesji

- **`user_id`** (string, UUID) - ID użytkownika wyciągane z sesji Supabase przez `auth.uid()`

### Przykład wywołania

```bash
curl -X DELETE \
  https://api.example.com/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <supabase_token>"
```

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

- **`ApiErrorResponse`** (src/types.ts:338-344) - Standardowa struktura odpowiedzi błędu

### Command Models

#### Do dodania w src/types.ts (po linii 307):

```typescript
/**
 * Command for deleting a trip plan (soft delete)
 * Used in backend to validate and process trip plan deletion
 *
 * Validation rules:
 * - id: Required, valid UUID format
 * - user_id: Required, extracted from authenticated session
 */
export interface DeleteTripPlanCommand {
  id: string;
  user_id: string;
}
```

**Uzasadnienie:** Potrzebujemy dedykowanego command model dla operacji usuwania trip plan, analogicznie do `DeletePreferenceCommand`.

---

## 4. Szczegóły odpowiedzi

### Sukces (204 No Content)

```http
HTTP/1.1 204 No Content
```

**Ciało odpowiedzi:** Brak (zgodnie ze standardem 204)

### Błędy

#### 400 Bad Request - Nieprawidłowy UUID

```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "The provided ID is not a valid UUID format",
    "details": {
      "field": "id",
      "value": "<provided-value>"
    }
  }
}
```

#### 401 Unauthorized - Brak autentykacji

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found - Plan nie istnieje lub nie należy do użytkownika

```json
{
  "error": {
    "code": "TRIP_PLAN_NOT_FOUND",
    "message": "Trip plan not found"
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

### Architektura warstwowa

```
┌─────────────────────────────────────┐
│  Client (Frontend / API Consumer)   │
└──────────────┬──────────────────────┘
               │ DELETE /api/trip-plans/:id
               ▼
┌─────────────────────────────────────┐
│   Route Handler                      │
│   (src/pages/api/trip-plans/[id].ts)│
│   - Walidacja UUID                   │
│   - Ekstrakcja user_id z sesji       │
│   - Tworzenie DeleteTripPlanCommand  │
└──────────────┬──────────────────────┘
               │ command
               ▼
┌─────────────────────────────────────┐
│   TripPlansService                   │
│   (src/lib/services/tripPlans.service.ts) │
│   - Wykonanie soft delete            │
│   - Weryfikacja rezultatu            │
└──────────────┬──────────────────────┘
               │ UPDATE query
               ▼
┌─────────────────────────────────────┐
│   Supabase Client                    │
│   - RLS Policy (tp_owner)            │
│   - Trigger (trip_plans_soft_delete) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   PostgreSQL Database                │
│   - Tabela: trip_plans               │
│   - UPDATE deleted_at = NOW()        │
│   - Trigger ustawia deleted_by       │
└─────────────────────────────────────┘
```

### Szczegółowy przepływ

1. **Request Processing (Route Handler)**
   - Odbiera DELETE request z parametrem `:id`
   - Waliduje format UUID używając `isValidUUID(id)`
   - Pobiera `user_id` z sesji Supabase: `locals.supabase.auth.getUser()`
   - Tworzy `DeleteTripPlanCommand`

2. **Business Logic (Service Layer)**
   - `TripPlansService.deleteTripPlan(command)` wykonuje UPDATE:
     ```typescript
     .update({ deleted_at: new Date().toISOString() })
     .eq('id', command.id)
     .eq('user_id', command.user_id)
     .select('id')
     ```
   - Sprawdza czy jakikolwiek wiersz został zaktualizowany
   - Zwraca `true` jeśli sukces, `false` jeśli nie znaleziono

3. **Database Layer (Supabase)**
   - **RLS Policy `tp_owner`**: Automatycznie filtruje query WHERE user_id = auth.uid()
   - **UPDATE**: Ustawia `deleted_at = NOW()`
   - **Trigger `trip_plans_soft_delete()`**: Automatycznie ustawia `deleted_by = auth.uid()`

4. **Response**
   - Sukces: 204 No Content
   - Not Found: 404 + JSON error
   - Błędy: odpowiednie kody statusu + JSON error

---

## 6. Względy bezpieczeństwa

### Autentykacja

- **Wymagane:** Token sesji Supabase w headerze Authorization
- **TODO:** Obecnie `user_id` jest hardcodowany jako placeholder
- **Implementacja:** Użyć `locals.supabase.auth.getUser()` do wyciągnięcia użytkownika z sesji
- **Obsługa błędu:** Jeśli brak sesji → 401 Unauthorized

```typescript
const {
  data: { user },
  error,
} = await locals.supabase.auth.getUser();

if (error || !user) {
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

### Autoryzacja (Row-Level Security)

- **Mechanizm:** Supabase RLS Policy `tp_owner`
- **Definicja:** `USING (user_id = auth.uid())`
- **Efekt:** Użytkownik może modyfikować tylko własne trip plans
- **Zabezpieczenie przed IDOR:** Nawet jeśli użytkownik poda cudzył UUID, RLS policy zablokuje operację

### Walidacja danych wejściowych

1. **Walidacja UUID:**
   - Użycie funkcji `isValidUUID(id)` (już istnieje w projekcie)
   - Zapobiega SQL injection i nieprawidłowym zapytaniom
   - Zwraca 400 Bad Request jeśli format nieprawidłowy

2. **Walidacja własności:**
   - Obsługiwana przez RLS + explicit check `eq('user_id', command.user_id)`
   - Zwraca 404 Not Found jeśli plan nie należy do użytkownika (nie ujawniamy czy plan istnieje)

### Zapobieganie atakom

| Atak                                        | Mitigacja                                       |
| ------------------------------------------- | ----------------------------------------------- |
| **SQL Injection**                           | Supabase SDK używa prepared statements          |
| **IDOR (Insecure Direct Object Reference)** | RLS Policy + explicit user_id check             |
| **Mass Assignment**                         | Nie dotyczy - DELETE nie przyjmuje body         |
| **CSRF**                                    | Token sesji w Authorization header (nie cookie) |
| **Brute Force**                             | TODO: Rate limiting (nie w MVP)                 |

### Logowanie bezpieczeństwa

- **Logować:** Nieprawidłowe UUID, błędy bazy danych
- **NIE logować:** User ID, UUID planów, szczegóły sesji
- **Format:** Strukturalne logi JSON z timestampem

```typescript
console.error("Unexpected error in DELETE /api/trip-plans/:id:", {
  error: error instanceof Error ? { message: error.message, name: error.name } : error,
  timestamp: new Date().toISOString(),
});
```

---

## 7. Obsługa błędów

### Kategorie błędów

#### 1. Błędy walidacji (400 Bad Request)

**Scenariusz:** Nieprawidłowy format UUID

```typescript
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
```

#### 2. Błędy autoryzacji (401 Unauthorized)

**Scenariusz:** Brak lub nieprawidłowa sesja

```typescript
const {
  data: { user },
  error,
} = await locals.supabase.auth.getUser();

if (error || !user) {
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
```

#### 3. Błędy not found (404 Not Found)

**Scenariusz:** Trip plan nie istnieje lub nie należy do użytkownika

```typescript
const deleted = await tripPlansService.deleteTripPlan(command);

if (!deleted) {
  const errorResponse: ApiErrorResponse = {
    error: {
      code: "TRIP_PLAN_NOT_FOUND",
      message: "Trip plan not found",
    },
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Uwaga bezpieczeństwa:** Nie rozróżniamy czy plan nie istnieje czy nie należy do użytkownika, aby nie ujawniać informacji o istnieniu zasobów.

#### 4. Błędy serwera (500 Internal Server Error)

**Scenariusze:**

- Błąd połączenia z bazą danych
- Nieoczekiwane wyjątki
- Błędy Supabase SDK

```typescript
catch (error) {
  console.error("Unexpected error in DELETE /api/trip-plans/:id:", {
    error: error instanceof Error
      ? { message: error.message, name: error.name }
      : error,
    timestamp: new Date().toISOString(),
  });

  const errorResponse: ApiErrorResponse = {
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred while processing your request"
    }
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" }
  });
}
```

### Strategia obsługi błędów

1. **Try-Catch na najwyższym poziomie** (route handler)
2. **Specyficzne błędy obsługiwane wcześnie** (walidacja UUID, autentykacja)
3. **Service layer zwraca boolean** (nie rzuca wyjątków dla not found)
4. **Generyczne błędy w catch** (500 dla nieoczekiwanych sytuacji)
5. **Nie ujawniamy szczegółów implementacji** użytkownikowi końcowemu

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań

#### 1. Indeksy bazodanowe

Istniejące indeksy w `trip_plans`:

- **(user_id)** - Przyspiesza filtrowanie po właścicielu (używane przez RLS i query)
- **Primary Key (id)** - Automatyczny indeks na UUID

Zapytanie DELETE będzie efektywne dzięki tym indeksom:

```sql
UPDATE trip_plans
SET deleted_at = NOW()
WHERE id = $1 AND user_id = $2
```

Użyje indeksów: PK na `id` + indeks na `user_id`.

#### 2. Minimalizacja liczby zapytań

- **Jedno zapytanie UPDATE** z `.select('id')` dla weryfikacji rezultatu
- **Brak dodatkowych SELECT** dla sprawdzenia istnienia (bezpośrednia UPDATE + check affected rows)

#### 3. Soft Delete vs Hard Delete

**Zalety Soft Delete (obecna implementacja):**

- Szybsze niż DELETE (brak kaskadowych usunięć, reorganizacji indeksów)
- Możliwość odzyskania danych
- Zachowanie integralności relacji (generation_id)

**Wady:**

- Tabela rośnie w czasie (mitygacja: archiwizacja starych rekordów)
- Dodatkowa kolumna w indeksach

### Potencjalne wąskie gardła

#### 1. Latencja Supabase

- **Typowa latencja:** 50-200ms (zależy od regionu)
- **Mitigacja:** Hostowanie blisko użytkowników, użycie CDN dla statycznych zasobów
- **Monitoring:** Logowanie duration requestów

#### 2. RLS Performance

- **Overhead:** ~5-10% dla prostych policies
- **Mitigacja:** Indeks na `user_id` minimalizuje overhead
- **Alternatywa:** Application-level checks (więcej kodu, mniej bezpieczne)

#### 3. Trigger Execution

- **Trigger `trip_plans_soft_delete()`** dodaje minimalny overhead (<1ms)
- **Alternatywa:** Ustawiać `deleted_by` w aplikacji (więcej kodu, możliwość błędów)

### Strategie skalowania

1. **Connection Pooling**
   - Supabase ma wbudowany pooling (PgBouncer)
   - Dla wysokiego ruchu: zwiększyć pool size

2. **Caching**
   - DELETE operacje nie są cacheable
   - Cache invalidation: Usunąć z cache po DELETE (jeśli GET jest cachowany)

3. **Rate Limiting**
   - TODO: Dodać rate limiting (np. 10 DELETE/minutę na użytkownika)
   - Zapobiega abuse i DOS

4. **Archiwizacja**
   - Okresowe przenoszenie rekordów z `deleted_at > 90 dni` do tabeli archiwum
   - Zmniejsza rozmiar głównej tabeli, poprawia performance

### Metryki do monitorowania

- Request duration (target: <200ms p95)
- Error rate (target: <1%)
- Database query time
- RLS policy execution time

---

## 9. Etapy wdrożenia

### Krok 1: Dodanie typu DeleteTripPlanCommand

**Plik:** `src/types.ts`

```typescript
/**
 * Command for deleting a trip plan (soft delete)
 * Used in backend to validate and process trip plan deletion
 *
 * Validation rules:
 * - id: Required, valid UUID format
 * - user_id: Required, extracted from authenticated session
 */
export interface DeleteTripPlanCommand {
  id: string;
  user_id: string;
}
```

**Lokalizacja:** Dodać po `UpdatePlanCommand` (około linii 262), w sekcji `// COMMAND MODELS`.

---

### Krok 2: Utworzenie TripPlansService

**Plik:** `src/lib/services/tripPlans.service.ts` (nowy plik)

```typescript
/**
 * TripPlansService
 *
 * Service layer for managing trip plans.
 * Handles business logic, validation, and database interactions.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { DeleteTripPlanCommand } from "../../types";

export class TripPlansService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Soft deletes a trip plan by ID
   * Sets deleted_at timestamp, trigger automatically sets deleted_by
   *
   * @param command - Command containing trip plan ID and user ID
   * @returns true if deleted successfully, false if not found
   * @throws Error if database operation fails
   */
  async deleteTripPlan(command: DeleteTripPlanCommand): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("trip_plans")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", command.id)
      .eq("user_id", command.user_id)
      .select("id");

    if (error) {
      console.error("Database error in deleteTripPlan:", error);
      throw error;
    }

    // Check if any row was updated (soft deleted)
    if (!data || data.length === 0) {
      return false;
    }

    return true;
  }
}
```

**Wzorowanie:** Struktura analogiczna do `UserPreferencesService`.

---

### Krok 3: Utworzenie route handler DELETE

**Plik:** `src/pages/api/trip-plans/[id].ts` (nowy plik, może zawierać też GET, PATCH)

```typescript
/**
 * DELETE /api/trip-plans/:id
 * Soft deletes a trip plan by ID.
 *
 * Requires authentication.
 */

import type { APIRoute } from "astro";
import { TripPlansService } from "../../../lib/services/tripPlans.service";
import { isValidUUID } from "../../../lib/validators/uuid.validator";
import type { ApiErrorResponse, DeleteTripPlanCommand } from "../../../types";

export const prerender = false;

/**
 * DELETE handler - Soft delete a trip plan by ID
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // 2. Get user_id from authenticated session
    // TODO: Replace placeholder with actual auth when implemented
    const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

    // For production, use:
    // const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
    // if (authError || !user) {
    //   const errorResponse: ApiErrorResponse = {
    //     error: {
    //       code: "UNAUTHORIZED",
    //       message: "Authentication required"
    //     }
    //   };
    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 401,
    //     headers: { "Content-Type": "application/json" }
    //   });
    // }
    // const userId = user.id;

    // 3. Create command and execute soft deletion
    const command: DeleteTripPlanCommand = {
      id,
      user_id: userId,
    };

    const tripPlansService = new TripPlansService(locals.supabase);
    const deleted = await tripPlansService.deleteTripPlan(command);

    // 4. Handle not found case
    if (!deleted) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "TRIP_PLAN_NOT_FOUND",
          message: "Trip plan not found",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Return success response (204 No Content)
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // 6. Log unexpected errors (without exposing sensitive data)
    console.error("Unexpected error in DELETE /api/trip-plans/:id:", {
      error: error instanceof Error ? { message: error.message, name: error.name } : error,
      timestamp: new Date().toISOString(),
    });

    // 7. Return generic server error
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

---

### Krok 4: Testy manualne

**Scenariusze testowe:**

1. **Happy Path - Usunięcie własnego planu**

   ```bash
   curl -X DELETE http://localhost:4321/api/trip-plans/{valid-uuid}
   # Oczekiwane: 204 No Content
   ```

2. **Nieprawidłowy UUID**

   ```bash
   curl -X DELETE http://localhost:4321/api/trip-plans/invalid-id
   # Oczekiwane: 400 Bad Request + INVALID_UUID
   ```

3. **Plan nie istnieje**

   ```bash
   curl -X DELETE http://localhost:4321/api/trip-plans/{non-existent-uuid}
   # Oczekiwane: 404 Not Found + TRIP_PLAN_NOT_FOUND
   ```

4. **Podwójne usunięcie (idempotentność)**

   ```bash
   curl -X DELETE http://localhost:4321/api/trip-plans/{valid-uuid}
   curl -X DELETE http://localhost:4321/api/trip-plans/{valid-uuid}
   # Pierwsze: 204, Drugie: 404 (już usunięty)
   ```

5. **Weryfikacja soft delete w bazie danych**
   ```sql
   SELECT id, deleted_at, deleted_by
   FROM trip_plans
   WHERE id = '{deleted-uuid}';
   -- Oczekiwane: deleted_at IS NOT NULL, deleted_by = user_id
   ```

---

### Krok 5: (Opcjonalnie) Testy automatyczne

**Plik:** `tests/api/trip-plans-delete.test.ts` (jeśli projekt używa testów)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
// ... setup

describe("DELETE /api/trip-plans/:id", () => {
  it("should return 204 when deleting own trip plan", async () => {
    // Arrange: Create trip plan
    // Act: DELETE request
    // Assert: Status 204, deleted_at not null in DB
  });

  it("should return 400 for invalid UUID", async () => {
    // Act: DELETE with invalid UUID
    // Assert: Status 400, error code INVALID_UUID
  });

  it("should return 404 for non-existent trip plan", async () => {
    // Act: DELETE with random UUID
    // Assert: Status 404, error code TRIP_PLAN_NOT_FOUND
  });

  it("should return 404 when trying to delete another user's plan", async () => {
    // Arrange: Create plan for user A
    // Act: DELETE as user B
    // Assert: Status 404 (RLS blocks access)
  });

  it("should be idempotent - second delete returns 404", async () => {
    // Arrange: Create and delete plan
    // Act: DELETE again
    // Assert: Status 404
  });
});
```

---

### Krok 6: Dokumentacja API

**Plik:** `README.md` lub `docs/api/trip-plans.md`

Dodać dokumentację endpointa:

````markdown
### DELETE /api/trip-plans/:id

Soft deletes a trip plan (sets `deleted_at` and `deleted_by`).

**Authentication:** Required (Bearer token)

**Parameters:**

- `id` (path, UUID) - Trip plan ID

**Responses:**

- `204 No Content` - Successfully deleted
- `400 Bad Request` - Invalid UUID format
- `401 Unauthorized` - Missing or invalid authentication
- `404 Not Found` - Trip plan not found or doesn't belong to user
- `500 Internal Server Error` - Unexpected error

**Example:**

```bash
curl -X DELETE \
  https://api.example.com/api/trip-plans/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```
````

````

---

### Krok 7: Code Review Checklist

Przed mergem, zweryfikuj:

- [ ] `DeleteTripPlanCommand` dodany do `src/types.ts`
- [ ] `TripPlansService` utworzony z metodą `deleteTripPlan`
- [ ] Route handler `DELETE` w `src/pages/api/trip-plans/[id].ts`
- [ ] Walidacja UUID używa `isValidUUID()`
- [ ] Obsługa błędów 400, 401, 404, 500
- [ ] Logowanie błędów nie ujawnia wrażliwych danych
- [ ] Response 204 No Content dla sukcesu
- [ ] Soft delete używa UPDATE, nie DELETE
- [ ] RLS policy `tp_owner` jest aktywna
- [ ] Trigger `trip_plans_soft_delete` działa poprawnie
- [ ] Testy manualne przeszły pomyślnie
- [ ] TODO dla autentykacji jest oznaczony
- [ ] Dokumentacja API zaktualizowana

---

## 10. Potencjalne rozszerzenia (poza MVP)

1. **Przywracanie usuniętych planów**
   - Endpoint: `POST /api/trip-plans/:id/restore`
   - Ustawia `deleted_at = NULL` i `deleted_by = NULL`

2. **Hard delete po X dniach**
   - Cron job usuwający rekordy z `deleted_at < NOW() - INTERVAL '90 days'`
   - Archiwizacja przed usunięciem

3. **Bulk delete**
   - Endpoint: `DELETE /api/trip-plans`
   - Body: `{ "ids": ["uuid1", "uuid2"] }`

4. **Audit log**
   - Dedykowana tabela `trip_plans_audit` dla historii zmian
   - Trigger logujący wszystkie DELETE/UPDATE

5. **Rate limiting**
   - Middleware sprawdzający liczbę requestów na użytkownika
   - Limit: np. 10 DELETE/minutę

---

## 11. Załączniki

### A. SQL dla weryfikacji soft delete

```sql
-- Sprawdź czy plan został soft deleted
SELECT
  id,
  destination,
  deleted_at,
  deleted_by,
  user_id
FROM trip_plans
WHERE id = '<uuid>';

-- Sprawdź czy trigger ustawił deleted_by
SELECT
  deleted_at IS NOT NULL as is_deleted,
  deleted_by = user_id as deleted_by_set_correctly
FROM trip_plans
WHERE id = '<uuid>';

-- Pokaż wszystkie soft deleted plany użytkownika
SELECT id, destination, deleted_at
FROM trip_plans
WHERE user_id = '<user-uuid>'
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
````

### B. Postman Collection (przykład)

```json
{
  "info": {
    "name": "Tripper API - Trip Plans",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Delete Trip Plan",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{supabase_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/trip-plans/:id",
          "host": ["{{base_url}}"],
          "path": ["api", "trip-plans", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "{{trip_plan_id}}"
            }
          ]
        }
      },
      "response": []
    }
  ]
}
```

### C. Referencje

- **Specyfikacja API:** (link do dokumentacji)
- **Database Schema:** `docs/database-schema.md`
- **RLS Policies:** `supabase/migrations/XX_rls_policies.sql`
- **Soft Delete Trigger:** `supabase/migrations/XX_soft_delete_trigger.sql`
- **User Preferences Implementation:** `src/pages/api/user/preferences/[id].ts` (wzór)

---

**Koniec planu implementacji**
