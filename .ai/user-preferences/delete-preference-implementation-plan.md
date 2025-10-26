# API Endpoint Implementation Plan: DELETE /api/preferences/:id

## 1. Przegląd punktu końcowego

### Cel
Usunięcie szablonu preferencji użytkownika z bazy danych. Endpoint ten pozwala użytkownikowi na trwałe usunięcie swojego zapisanego szablonu preferencji podróży.

### Funkcjonalność
- Użytkownik może usunąć tylko własne preferencje (weryfikacja własności zasobu)
- Hard delete z bazy danych (tabela user_preferences nie posiada pola deleted_at)
- Zwraca 204 No Content przy sukcesie
- Nie ujawnia informacji o istnieniu zasobów należących do innych użytkowników (security best practice)

## 2. Szczegóły żądania

### Metoda HTTP
`DELETE`

### Struktura URL
```
DELETE /api/preferences/:id
```

### Parametry

#### Wymagane
- **id** (URL parameter)
  - Typ: `uuid`
  - Lokalizacja: URL path parameter
  - Opis: Identyfikator UUID preferencji do usunięcia
  - Walidacja: Musi być poprawnym formatem UUID v4

#### Uwierzytelnienie
- **Authorization header** (automatycznie obsługiwany przez Supabase)
  - Token JWT z Supabase Auth
  - Wydobyty user_id z sesji autentykacji

#### Opcjonalne
Brak

### Request Body
Brak - metoda DELETE nie wymaga body

### Przykład żądania
```http
DELETE /api/preferences/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

## 3. Wykorzystywane typy

### Istniejące typy (src/types.ts)
Żadne z istniejących DTO nie są potrzebne, ponieważ:
- Nie ma request body (DELETE)
- Nie ma response body (204 No Content)

### Nowe typy do dodania

#### Command Model
Należy dodać nowy Command Model do src/types.ts:

```typescript
/**
 * Command for deleting a user preference
 * Used in backend to validate and process preference deletion
 *
 * Validation rules:
 * - id: Required, valid UUID format
 * - user_id: Required, extracted from authenticated session
 */
export interface DeletePreferenceCommand {
  id: string;
  user_id: string;
}
```

### Wykorzystanie w przepływie
1. **DeletePreferenceCommand** - walidacja i wykonanie operacji w service layer

## 4. Szczegóły odpowiedzi

### Sukces (204 No Content)
```http
HTTP/1.1 204 No Content
```

**Brak body** - sukces sygnalizowany tylko kodem statusu

### Błędy

#### 400 Bad Request - Nieprawidłowy format UUID
```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "Invalid preference ID format"
  }
}
```

#### 401 Unauthorized - Brak lub nieprawidłowa autentykacja
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### 404 Not Found - Preferencja nie istnieje lub nie należy do użytkownika
```json
{
  "error": {
    "code": "PREFERENCE_NOT_FOUND",
    "message": "Preference not found"
  }
}
```

**Uwaga bezpieczeństwa**: Ten sam komunikat dla obu przypadków:
- Preferencja nie istnieje w bazie
- Preferencja istnieje, ale należy do innego użytkownika

#### 500 Internal Server Error - Błąd serwera
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

### Architektura warstwowa
```
API Route (Astro endpoint)
    ↓
Validation Layer
    ↓
Service Layer (Business Logic)
    ↓
Database Layer (Supabase Client)
    ↓
PostgreSQL Database
```

### Szczegółowy przepływ

#### 1. API Route Layer (src/pages/api/preferences/[id].ts)
```typescript
// Astro endpoint file
export async function DELETE({ params, locals, request }) {
  // 1. Walidacja UUID
  // 2. Pobierz user_id z Supabase auth
  // 3. Przekaż do service
  // 4. Zwróć odpowiedź
}
```

#### 2. Service Layer (src/services/preferences.service.ts)
```typescript
async function deleteUserPreference(command: DeletePreferenceCommand): Promise<void> {
  // 1. Wykonaj DELETE WHERE id = X AND user_id = Y
  // 2. Sprawdź liczbę usuniętych wierszy
  // 3. Rzuć wyjątek jeśli 0 wierszy usuniętych
}
```

#### 3. Database Query
```sql
DELETE FROM user_preferences
WHERE id = $1 AND user_id = $2
RETURNING id;
```

**Kluczowe aspekty**:
- WHERE zawiera zarówno id jak i user_id dla bezpieczeństwa
- RETURNING id pozwala zweryfikować czy wiersz został usunięty
- Jeśli query zwraca 0 wierszy → 404 Not Found

### Interakcje z zewnętrznymi systemami

#### Supabase Auth
- Weryfikacja tokenu JWT
- Wydobycie user_id z sesji
- Obsługa wygasłych/nieprawidłowych tokenów

#### Supabase Database (PostgreSQL)
- Połączenie przez Supabase Client z typami
- Walidacja foreign key (user_id → auth.users)
- Transaction handling (jeśli potrzebne)

## 6. Względy bezpieczeństwa

### Uwierzytelnianie (Authentication)

#### Weryfikacja tokenu JWT
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser(
  request.headers.get('Authorization')?.replace('Bearer ', '')
);

if (authError || !user) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}
```

**Sprawdzane przypadki**:
- Brak nagłówka Authorization
- Nieprawidłowy format tokenu
- Token wygasły
- Token unieważniony
- Użytkownik nie istnieje

### Autoryzacja (Authorization)

#### Weryfikacja własności zasobu
**Kluczowe**: WHERE clause musi zawierać zarówno id jak i user_id

```sql
DELETE FROM user_preferences
WHERE id = $1 AND user_id = $2
```

**Dlaczego to bezpieczne?**
- Nawet jeśli użytkownik zna UUID cudzej preferencji, nie może jej usunąć
- Baza danych wymusi sprawdzenie własności na poziomie query
- Nie ma potrzeby osobnego SELECT do sprawdzenia własności

#### Zapobieganie enumeracji użytkowników
**Problem**: Atakujący może sprawdzać czy dany UUID istnieje w bazie

**Rozwiązanie**: Ten sam komunikat błędu dla obu przypadków:
- `404 PREFERENCE_NOT_FOUND` - gdy nie istnieje
- `404 PREFERENCE_NOT_FOUND` - gdy należy do innego użytkownika

**Nie rób tego**:
```typescript
// ZŁE - ujawnia informację o istnieniu zasobu
if (!preference) return 404 "Not found"
if (preference.user_id !== user.id) return 403 "Forbidden"
```

**Zrób to**:
```typescript
// DOBRE - ukrywa informację o istnieniu
const result = await delete WHERE id = X AND user_id = Y
if (result.rowCount === 0) return 404 "Not found"
```

### Walidacja danych wejściowych

#### Walidacja UUID
```typescript
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
```

**Dlaczego to ważne?**
- Zapobiega SQL injection (choć Supabase używa prepared statements)
- Wykrywa oczywiste błędy wcześnie
- Lepsze komunikaty błędów dla użytkownika

### Zapobieganie atakom

#### SQL Injection
**Ochrona**: Supabase Client używa parametryzowanych zapytań
```typescript
// Supabase automatycznie sanityzuje parametry
.delete()
.eq('id', id)
.eq('user_id', user_id)
```

#### CSRF (Cross-Site Request Forgery)
**Ochrona**: JWT w Authorization header (nie w cookie)
- Wymaga JavaScript do dodania nagłówka
- Nie jest automatycznie wysyłany przez przeglądarkę

#### Rate Limiting
**Rekomendacja**: Implementacja na poziomie API Gateway lub middleware
- Limit żądań per user per minute
- Ochrona przed brute force na UUID-y

## 7. Obsługa błędów

### Kategorie błędów

#### 1. Błędy walidacji (400)

##### Nieprawidłowy format UUID
**Kiedy**: UUID nie pasuje do regex pattern
```typescript
if (!isValidUUID(id)) {
  return new Response(JSON.stringify({
    error: {
      code: 'INVALID_UUID',
      message: 'Invalid preference ID format'
    }
  }), { status: 400 });
}
```

#### 2. Błędy autentykacji (401)

##### Brak tokenu
**Kiedy**: Brak nagłówka Authorization
```typescript
if (!authHeader) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  }), { status: 401 });
}
```

##### Nieprawidłowy/wygasły token
**Kiedy**: Supabase auth.getUser() zwraca błąd
```typescript
if (authError || !user) {
  return new Response(JSON.stringify({
    error: {
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    }
  }), { status: 401 });
}
```

#### 3. Błędy autoryzacji/nie znaleziono (404)

##### Preferencja nie istnieje lub nie należy do użytkownika
**Kiedy**: DELETE query zwraca 0 usuniętych wierszy
```typescript
const { data, error } = await supabase
  .from('user_preferences')
  .delete()
  .eq('id', id)
  .eq('user_id', user.id)
  .select();

if (!data || data.length === 0) {
  return new Response(JSON.stringify({
    error: {
      code: 'PREFERENCE_NOT_FOUND',
      message: 'Preference not found'
    }
  }), { status: 404 });
}
```

#### 4. Błędy serwera (500)

##### Błąd połączenia z bazą danych
**Kiedy**: Supabase niedostępny lub błąd sieci
```typescript
try {
  await deleteUserPreference(command);
} catch (error) {
  console.error('Database error:', error);
  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}
```

##### Nieoczekiwane błędy
**Kiedy**: Jakikolwiek inny runtime error
```typescript
catch (error) {
  // Log do monitoring system (np. Sentry)
  console.error('Unexpected error:', error);

  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}
```

### Strategia logowania błędów

#### Do logowania (console.error)
- 500 - błędy serwera z pełnym stack trace
- Błędy połączenia z bazą danych
- Nieoczekiwane wyjątki

#### Bez logowania
- 400 - błędy walidacji (oczekiwane)
- 401 - brak autentykacji (normalne)
- 404 - zasób nie znaleziony (normalne)

**Dlaczego?**
- Nie zaśmiecamy logów normalną operacją API
- Skupiamy się na rzeczywistych problemach
- Łatwiejsze debugowanie

### Error Response Format
**Spójny format dla wszystkich błędów**:
```typescript
interface ApiErrorResponse {
  error: {
    code: string;        // Machine-readable error code
    message: string;     // Human-readable message
    details?: Record<string, unknown>; // Optional additional info
  }
}
```

## 8. Rozważania dotyczące wydajności

### Optymalizacje query

#### Single query operation
```sql
DELETE FROM user_preferences
WHERE id = $1 AND user_id = $2
RETURNING id;
```

**Zalety**:
- Jedna operacja bazy danych
- Atomiczność operacji
- Nie potrzeba osobnego SELECT do sprawdzenia własności

**Unikaj tego**:
```sql
-- ZŁE - dwa query
SELECT * FROM user_preferences WHERE id = $1;  -- Query 1
DELETE FROM user_preferences WHERE id = $1;    -- Query 2
```

#### Indeksy bazodanowe
**Wymagane indeksy** (powinny już istnieć):
- Primary key index na `id` (automatyczny)
- Foreign key index na `user_id` (automatyczny)

**Weryfikacja**:
```sql
-- Sprawdź plan wykonania
EXPLAIN ANALYZE
DELETE FROM user_preferences
WHERE id = 'uuid-here' AND user_id = 'uuid-here';
```

Oczekiwany plan: Index Scan, nie Seq Scan

### Caching

#### Nie cache'ować
DELETE operations nie powinny być cache'owane

#### Invalidacja cache
Jeśli w przyszłości dodany zostanie cache dla GET /api/preferences:
```typescript
// Po udanym DELETE
await cacheInvalidate(`preferences:user:${user_id}`);
await cacheInvalidate(`preferences:${id}`);
```

### Connection pooling

#### Supabase Client
Supabase automatycznie zarządza connection pooling
```typescript
// Używaj tego samego klienta w całej aplikacji
export const supabaseClient = createClient<Database>(url, key);
```

**Nie twórz nowych połączeń** dla każdego requesta:
```typescript
// ZŁE - nowe połączenie dla każdego requesta
const client = createClient(url, key);
```

### Monitoring wydajności

#### Metryki do śledzenia
1. **Response time**
   - p50, p95, p99 latency
   - Target: < 100ms dla p95

2. **Error rate**
   - % żądań z 5xx errors
   - Target: < 0.1%

3. **Database query time**
   - Czas wykonania DELETE query
   - Target: < 50ms

#### Potencjalne wąskie gardła

1. **Database connection**
   - Problem: Limit połączeń do Supabase
   - Rozwiązanie: Connection pooling (built-in)

2. **Authentication verification**
   - Problem: Weryfikacja JWT może być wolna
   - Rozwiązanie: Cache public keys do weryfikacji JWT

3. **Network latency**
   - Problem: Opóźnienie między app → Supabase
   - Rozwiązanie: Deploy w tym samym regionie

## 9. Etapy wdrożenia

### Krok 1: Dodanie typu DeletePreferenceCommand

**Plik**: `src/types.ts`

**Akcja**: Dodaj nowy Command Model na końcu sekcji COMMAND MODELS (linia ~294)

```typescript
/**
 * Command for deleting a user preference
 * Used in backend to validate and process preference deletion
 *
 * Validation rules:
 * - id: Required, valid UUID format
 * - user_id: Required, extracted from authenticated session
 */
export interface DeletePreferenceCommand {
  id: string;
  user_id: string;
}
```

**Weryfikacja**: TypeScript compilation bez błędów

---

### Krok 2: Utworzenie service layer dla preferencji

**Plik**: `src/services/preferences.service.ts` (nowy plik)

**Struktura**:
```typescript
import type { DeletePreferenceCommand } from "../types";
import { supabaseClient } from "../db/supabase.client";

/**
 * Service error class for preference operations
 */
export class PreferenceNotFoundError extends Error {
  constructor(message = "Preference not found") {
    super(message);
    this.name = "PreferenceNotFoundError";
  }
}

/**
 * Delete a user preference
 * @throws {PreferenceNotFoundError} When preference doesn't exist or doesn't belong to user
 */
export async function deleteUserPreference(
  command: DeletePreferenceCommand
): Promise<void> {
  const { data, error } = await supabaseClient
    .from("user_preferences")
    .delete()
    .eq("id", command.id)
    .eq("user_id", command.user_id)
    .select("id");

  if (error) {
    console.error("Database error during preference deletion:", error);
    throw new Error("Failed to delete preference");
  }

  // Check if any row was deleted
  if (!data || data.length === 0) {
    throw new PreferenceNotFoundError();
  }
}
```

**Weryfikacja**:
- Import types działa poprawnie
- Supabase client jest dostępny
- TypeScript compilation bez błędów

---

### Krok 3: Utworzenie helper functions dla walidacji

**Plik**: `src/lib/validation.ts` (nowy plik)

```typescript
/**
 * UUID v4 validation regex
 */
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates if string is a valid UUID v4
 */
export function isValidUUID(id: string): boolean {
  return UUID_V4_REGEX.test(id);
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
) {
  return new Response(
    JSON.stringify({
      error: {
        code,
        message,
        ...(details && { details }),
      },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
```

**Weryfikacja**:
- Funkcje są pure i testowalne
- TypeScript compilation bez błędów

---

### Krok 4: Utworzenie API endpoint

**Plik**: `src/pages/api/preferences/[id].ts` (nowy plik)

**Struktura katalogów**:
```
src/
  pages/
    api/
      preferences/
        [id].ts  ← Astro dynamic route
```

**Implementacja**:
```typescript
import type { APIRoute } from "astro";
import { deleteUserPreference, PreferenceNotFoundError } from "../../../services/preferences.service";
import { isValidUUID, createErrorResponse } from "../../../lib/validation";
import type { DeletePreferenceCommand } from "../../../types";

export const DELETE: APIRoute = async ({ params, locals, request }) => {
  try {
    // Step 1: Validate UUID format
    const preferenceId = params.id;

    if (!preferenceId || !isValidUUID(preferenceId)) {
      return createErrorResponse(
        "INVALID_UUID",
        "Invalid preference ID format",
        400
      );
    }

    // Step 2: Get authenticated user
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return createErrorResponse(
        "UNAUTHORIZED",
        "Authentication required",
        401
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await locals.supabase.auth.getUser(token);

    if (authError || !user) {
      return createErrorResponse(
        "UNAUTHORIZED",
        "Authentication required",
        401
      );
    }

    // Step 3: Create command and execute deletion
    const command: DeletePreferenceCommand = {
      id: preferenceId,
      user_id: user.id,
    };

    await deleteUserPreference(command);

    // Step 4: Return success (204 No Content)
    return new Response(null, { status: 204 });

  } catch (error) {
    // Handle known errors
    if (error instanceof PreferenceNotFoundError) {
      return createErrorResponse(
        "PREFERENCE_NOT_FOUND",
        "Preference not found",
        404
      );
    }

    // Handle unexpected errors
    console.error("Unexpected error in DELETE /api/preferences/:id:", error);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      500
    );
  }
};
```

**Weryfikacja**:
- Plik jest w poprawnej lokalizacji dla Astro routing
- Wszystkie importy działają
- TypeScript compilation bez błędów

---

### Krok 5: Testowanie manualne

**Narzędzia**: cURL, Postman, lub Insomnia

#### Test 1: Sukces (204)
```bash
curl -X DELETE \
  http://localhost:4321/api/preferences/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Oczekiwany wynik: 204 No Content, brak body
```

#### Test 2: Nieprawidłowy UUID (400)
```bash
curl -X DELETE \
  http://localhost:4321/api/preferences/invalid-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Oczekiwany wynik:
# Status: 400
# Body: {"error":{"code":"INVALID_UUID","message":"Invalid preference ID format"}}
```

#### Test 3: Brak autentykacji (401)
```bash
curl -X DELETE \
  http://localhost:4321/api/preferences/550e8400-e29b-41d4-a716-446655440000

# Oczekiwany wynik:
# Status: 401
# Body: {"error":{"code":"UNAUTHORIZED","message":"Authentication required"}}
```

#### Test 4: Nie znaleziono/brak uprawnień (404)
```bash
curl -X DELETE \
  http://localhost:4321/api/preferences/550e8400-e29b-41d4-a716-999999999999 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Oczekiwany wynik:
# Status: 404
# Body: {"error":{"code":"PREFERENCE_NOT_FOUND","message":"Preference not found"}}
```

---

### Krok 6: Testy automatyczne (opcjonalne, ale zalecane)

**Plik**: `src/services/__tests__/preferences.service.test.ts`

**Framework**: Vitest (zgodny z Astro)

```typescript
import { describe, it, expect, vi } from "vitest";
import { deleteUserPreference, PreferenceNotFoundError } from "../preferences.service";

describe("deleteUserPreference", () => {
  it("should delete preference successfully", async () => {
    // Mock Supabase client
    // Test happy path
  });

  it("should throw PreferenceNotFoundError when not found", async () => {
    // Mock Supabase to return empty array
    // Verify error is thrown
  });

  it("should throw PreferenceNotFoundError when user doesn't own preference", async () => {
    // Mock Supabase to return empty array
    // Verify error is thrown
  });
});
```

**Weryfikacja**: Wszystkie testy przechodzą

---

### Krok 7: Dokumentacja API

**Plik**: `.ai/api-documentation.md` lub odpowiedni plik dokumentacji

**Dodaj sekcję**:
```markdown
### DELETE /api/preferences/:id

Delete a user preference template.

**Authentication**: Required

**Parameters**:
- `id` (path, required): UUID of the preference to delete

**Response**:
- `204 No Content`: Successfully deleted
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Preference not found or unauthorized

**Example**:
\`\`\`bash
curl -X DELETE https://api.example.com/api/preferences/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
```

---

### Krok 8: Code review checklist

Przed mergem do main branch, sprawdź:

- [ ] TypeScript compilation bez błędów i warningów
- [ ] Wszystkie typy są poprawnie zdefiniowane
- [ ] Service layer jest oddzielony od API route
- [ ] Walidacja UUID jest wykonywana
- [ ] Autentykacja jest wymagana
- [ ] Autoryzacja sprawdza własność zasobu
- [ ] Błędy zwracają odpowiednie kody statusu
- [ ] 404 jest używany zarówno dla not found jak i unauthorized (security)
- [ ] Błędy 500 są logowane z pełnym kontekstem
- [ ] Nie ma console.log (tylko console.error dla błędów)
- [ ] Response headers zawierają Content-Type
- [ ] DELETE zwraca 204 No Content bez body
- [ ] Kod jest spójny ze stylem projektu
- [ ] Dokumentacja API jest zaktualizowana
- [ ] Testy manualne przeszły pomyślnie

---

### Krok 9: Deployment

#### Przed deployment:
1. Weryfikuj, że Supabase connection string jest w zmiennych środowiskowych produkcyjnych
2. Sprawdź, czy tabela user_preferences istnieje w produkcyjnej bazie
3. Zweryfikuj indeksy bazodanowe dla wydajności

#### Po deployment:
1. Test smoke na produkcji (z testowym użytkownikiem)
2. Monitoruj logi pod kątem błędów
3. Sprawdź metryki wydajności (response time, error rate)

---

### Krok 10: Monitoring i maintenance

#### Metryki do śledzenia:
- Liczba żądań DELETE /api/preferences/:id per dzień
- Wskaźnik błędów (% z 4xx i 5xx)
- Średni czas odpowiedzi
- p95 i p99 latency

#### Alerty do ustawienia:
- Error rate > 1% przez 5 minut
- p95 latency > 500ms przez 5 minut
- Brak żądań przez 24h (może oznaczać problem z routingiem)

---

## Podsumowanie

Ten endpoint jest stosunkowo prosty, ale wymaga szczególnej uwagi na:
1. **Bezpieczeństwo**: Weryfikacja własności zasobu w WHERE clause
2. **Prywatność**: Ten sam błąd 404 dla not found i unauthorized
3. **Wydajność**: Single query operation z RETURNING clause
4. **Prawidłowe kody statusu**: 204 dla sukcesu, nie 200

Implementacja powinna zająć około 2-3 godzin z testami i dokumentacją.