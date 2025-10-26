# API Endpoint Implementation Plan: POST /api/preferences

## 1. Przegląd punktu końcowego

Endpoint POST /api/preferences służy do tworzenia nowych szablonów preferencji użytkownika. Pozwala użytkownikom zapisywać często używane konfiguracje (np. liczba osób, typ budżetu) pod własną nazwą, co przyspiesza proces planowania kolejnych wycieczek. Endpoint wymaga autentykacji i zapewnia unikalność nazw szablonów w obrębie jednego użytkownika.

**Kluczowe cechy:**
- Autentykowany endpoint (wymaga tokenu JWT)
- Walidacja unikalności nazwy per użytkownik
- Zwraca pełny zasób wraz z ID
- Obsługuje opcjonalne pola dla elastyczności

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/preferences`
- **Content-Type:** `application/json`
- **Nagłówki:**
  - `Authorization: Bearer <jwt_token>` (wymagany)
  - `Content-Type: application/json` (wymagany)

### Parametry Request Body:

**Wymagane:**
- `name` (string): Nazwa szablonu preferencji
  - Max 256 znaków
  - Musi być unikalna dla danego użytkownika
  - Nie może być pusta

**Opcjonalne:**
- `people_count` (integer | null): Domyślna liczba osób
  - Musi być liczbą całkowitą >= 1 (jeśli podana)
  - Może być null lub pominięta
- `budget_type` (string | null): Typ budżetu
  - Rekomendowane wartości: "low", "medium", "high"
  - Może być dowolnym stringiem lub null

### Przykład Request Body:

```json
{
  "name": "Wycieczki rodzinne",
  "people_count": 4,
  "budget_type": "medium"
}
```

## 3. Wykorzystywane typy

### Request DTOs:
```typescript
// src/types.ts:81-85
CreateUserPreferenceDto {
  name: string;
  people_count?: number | null;
  budget_type?: string | null;
}
```

### Response DTOs:
```typescript
// src/types.ts:74
UserPreferenceDto = Pick<Tables<"user_preferences">,
  "id" | "name" | "people_count" | "budget_type">

UserPreferenceDto {
  id: string;
  name: string;
  people_count: number | null;
  budget_type: string | null;
}
```

### Command Models:
```typescript
// src/types.ts:273-278
CreatePreferenceCommand {
  name: string;
  people_count?: number | null;
  budget_type?: string | null;
  user_id: string;  // Pobrane z sesji, NIE z request body
}
```

### Response Wrappers:
```typescript
// src/types.ts:317-331
ApiSuccessResponse<UserPreferenceDto> {
  data: UserPreferenceDto
}

ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
}
```

## 4. Szczegóły odpowiedzi

### Success Response (201 Created):

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Wycieczki rodzinne",
    "people_count": 4,
    "budget_type": "medium"
  }
}
```

### Error Responses:

**401 Unauthorized:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

**400 Bad Request - Brakująca nazwa:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "name": "Name is required"
    }
  }
}
```

**400 Bad Request - Duplikat nazwy:**
```json
{
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "A preference with this name already exists",
    "details": {
      "name": "Wycieczki rodzinne"
    }
  }
}
```

**400 Bad Request - Nieprawidłowa liczba osób:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "people_count": "Must be a positive integer (>= 1)"
    }
  }
}
```

**500 Internal Server Error:**
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
1. Client → API Endpoint
   ├─ Authorization header (JWT token)
   └─ Request body (CreateUserPreferenceDto)

2. API Endpoint (Astro API Route)
   ├─ Weryfikacja autentykacji (Supabase Auth)
   ├─ Walidacja request body względem CreateUserPreferenceDto
   ├─ Ekstrakcja user_id z tokenu JWT
   └─ Utworzenie CreatePreferenceCommand

3. PreferencesService
   ├─ Walidacja command (business logic)
   │  ├─ name: required, max 256 chars
   │  ├─ people_count: optional, >= 1 if provided
   │  └─ budget_type: optional, string
   ├─ Wywołanie Supabase Client
   │  └─ INSERT INTO user_preferences
   │     ├─ Automatyczne generowanie id (uuid)
   │     ├─ Automatyczne ustawienie created_at
   │     └─ Automatyczne ustawienie updated_at
   └─ Obsługa błędów
      ├─ UNIQUE constraint violation → 400 DUPLICATE_NAME
      └─ Database errors → 500 INTERNAL_SERVER_ERROR

4. API Endpoint
   ├─ Mapowanie wyniku na UserPreferenceDto
   ├─ Opakowanie w ApiSuccessResponse
   └─ Zwrócenie 201 Created

5. Client ← API Response
   └─ ApiSuccessResponse<UserPreferenceDto> | ApiErrorResponse
```

### Interakcje z bazą danych:

```sql
-- Operacja INSERT wykonywan przez Supabase Client
INSERT INTO user_preferences (
  user_id,
  name,
  people_count,
  budget_type
) VALUES (
  $1, -- user_id z sesji
  $2, -- name z request body
  $3, -- people_count z request body (lub NULL)
  $4  -- budget_type z request body (lub NULL)
) RETURNING *;

-- Constraint sprawdzany przez PostgreSQL:
-- UNIQUE (user_id, name)
```

## 6. Względy bezpieczeństwa

### 1. Autentykacja
- **Wymagany JWT token** z Supabase Auth w nagłówku Authorization
- Token musi być zweryfikowany przed przetwarzaniem żądania
- Nieprawidłowy/wygasły token → 401 Unauthorized
- Brak tokenu → 401 Unauthorized

```typescript
// Przykładowa weryfikacja w Astro API Route
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
if (!token) {
  return new Response(JSON.stringify({
    error: { code: 'UNAUTHORIZED', message: 'Missing authentication token' }
  }), { status: 401 });
}

const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return new Response(JSON.stringify({
    error: { code: 'UNAUTHORIZED', message: 'Invalid authentication token' }
  }), { status: 401 });
}
```

### 2. Autoryzacja
- Użytkownik może tworzyć preferencje **tylko dla siebie**
- `user_id` MUSI być pobrany z zweryfikowanej sesji, **NIGDY** z request body
- Row Level Security (RLS) w Supabase jako dodatkowa warstwa ochrony

```sql
-- RLS Policy dla user_preferences
CREATE POLICY "Users can insert their own preferences"
ON user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 3. Walidacja danych wejściowych
- **Name sanitization**: Walidacja długości, brak niebezpiecznych znaków
- **Type checking**: Sprawdzenie typów wszystkich pól (string, integer, null)
- **Range validation**: people_count >= 1 (jeśli podany)
- **SQL Injection prevention**: Supabase Client automatycznie używa prepared statements

### 4. CORS
- Skonfigurować dozwolone origins dla frontend aplikacji
- Ograniczyć dozwolone metody do POST
- Wymagać credentials dla żądań cross-origin

### 5. Input Size Limits
- Limitować rozmiar request body (np. max 1KB)
- Zapobieganie atakom DoS przez duże payloady

## 6. Obsługa błędów

### Kategorie błędów:

| Kod statusu | Kod błędu | Scenariusz | Obsługa |
|------------|-----------|------------|---------|
| **401** | UNAUTHORIZED | Brak tokenu | Zwróć komunikat o braku autoryzacji |
| **401** | UNAUTHORIZED | Nieprawidłowy token | Zwróć komunikat o nieprawidłowym tokenie |
| **400** | VALIDATION_ERROR | Brak pola `name` | Zwróć szczegóły walidacji |
| **400** | VALIDATION_ERROR | `name` przekracza 256 znaków | Zwróć szczegóły walidacji |
| **400** | VALIDATION_ERROR | `name` jest pustym stringiem | Zwróć szczegóły walidacji |
| **400** | DUPLICATE_NAME | UNIQUE constraint violation | Zwróć komunikat o duplikacie z nazwą |
| **400** | VALIDATION_ERROR | `people_count` < 1 | Zwróć szczegóły walidacji |
| **400** | VALIDATION_ERROR | `people_count` nie jest integer | Zwróć szczegóły walidacji |
| **400** | VALIDATION_ERROR | Nieprawidłowy JSON | Zwróć komunikat o błędzie parsowania |
| **500** | DATABASE_ERROR | Błąd połączenia z bazą | Loguj szczegóły, zwróć ogólny komunikat |
| **500** | INTERNAL_SERVER_ERROR | Nieoczekiwany błąd | Loguj szczegóły, zwróć ogólny komunikat |

### Przykładowa implementacja obsługi błędów:

```typescript
try {
  // Walidacja request body
  const body = await request.json();

  if (!body.name || typeof body.name !== 'string') {
    return new Response(JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { name: 'Name is required and must be a string' }
      }
    }), { status: 400 });
  }

  if (body.name.length > 256) {
    return new Response(JSON.stringify({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { name: 'Name must not exceed 256 characters' }
      }
    }), { status: 400 });
  }

  if (body.people_count !== undefined && body.people_count !== null) {
    if (!Number.isInteger(body.people_count) || body.people_count < 1) {
      return new Response(JSON.stringify({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: { people_count: 'Must be a positive integer (>= 1)' }
        }
      }), { status: 400 });
    }
  }

  // Wywołanie service
  const preference = await userPreferencesService.createPreference({
    user_id: user.id,
    name: body.name,
    people_count: body.people_count,
    budget_type: body.budget_type
  });

  return new Response(JSON.stringify({ data: preference }), { status: 201 });

} catch (error) {
  // Obsługa UNIQUE constraint violation
  if (error.code === '23505') { // PostgreSQL unique violation code
    return new Response(JSON.stringify({
      error: {
        code: 'DUPLICATE_NAME',
        message: 'A preference with this name already exists',
        details: { name: body.name }
      }
    }), { status: 400 });
  }

  // Logowanie nieoczekiwanych błędów
  console.error('Unexpected error in POST /api/preferences:', error);

  return new Response(JSON.stringify({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    }
  }), { status: 500 });
}
```

### Logowanie błędów:
- Strukturalne logowanie z kontekstem (user_id, request_id, timestamp)
- Błędy 4xx: info level (user errors)
- Błędy 5xx: error level (server errors)
- Nie logować wrażliwych danych (pełne tokeny, hasła)

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **Weryfikacja tokenu JWT**
   - Każde żądanie wymaga weryfikacji tokenu
   - Rozwiązanie: Cache zweryfikowanych tokenów z krótkim TTL (np. 1 minuta)

2. **Sprawdzanie UNIQUE constraint**
   - Baza danych musi sprawdzić unikalność (user_id, name)
   - Rozwiązanie: Indeks już istnieje (UNIQUE constraint tworzy indeks automatycznie)

3. **Latencja bazy danych**
   - Każde żądanie wykonuje INSERT + SELECT (RETURNING)
   - Rozwiązanie: Connection pooling w Supabase (domyślnie włączony)

### Strategie optymalizacji:

1. **Connection Pooling**
   - Supabase automatycznie zarządza pulą połączeń
   - Upewnić się, że aplikacja używa singleton instance Supabase Client

2. **Indeksowanie**
   - UNIQUE constraint (user_id, name) automatycznie tworzy indeks
   - Rozważyć dodatkowy indeks na user_id dla innych query (jeśli potrzebne)

3. **Walidacja po stronie klienta**
   - Walidować dane przed wysłaniem (zmniejsza liczbę błędnych żądań)
   - Nie zastępuje walidacji po stronie serwera (zawsze walidować!)

4. **Response caching**
   - NIE cachować odpowiedzi POST (nie jest idempotentny)
   - Cachować GET requests dla listy preferencji (jeśli będzie taki endpoint)

5. **Monitoring wydajności**
   - Śledzić czas odpowiedzi endpoint
   - Monitorować liczbę błędów 400 vs 500
   - Alerty przy długich czasach odpowiedzi (> 500ms)

### Metryki do monitorowania:

| Metryka | Cel | Akcja przy przekroczeniu |
|---------|-----|--------------------------|
| Średni czas odpowiedzi | < 200ms | Analiza slow queries |
| P95 czas odpowiedzi | < 500ms | Optymalizacja lub scaling |
| Błędy 5xx | < 0.1% | Natychmiastowa analiza |
| Błędy 4xx (DUPLICATE_NAME) | < 5% | Poprawa UX (sprawdzanie dostępności nazwy) |

## 9. Etapy wdrożenia

### Krok 1: Utworzenie PreferencesService
```typescript
// src/services/userpPreferences.service.ts
import { createClient } from '@supabase/supabase-js';
import type { CreatePreferenceCommand, UserPreferenceDto } from '../types';

export class PreferencesService {
  constructor(private supabase: SupabaseClient) {}

  async createPreference(command: CreatePreferenceCommand): Promise<UserPreferenceDto> {
    // Walidacja command
    this.validateCreateCommand(command);

    // INSERT do bazy
    const { data, error } = await this.supabase
      .from('user_preferences')
      .insert({
        user_id: command.user_id,
        name: command.name,
        people_count: command.people_count,
        budget_type: command.budget_type
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as UserPreferenceDto;
  }

  private validateCreateCommand(command: CreatePreferenceCommand): void {
    if (!command.name || command.name.length === 0) {
      throw new ValidationError('Name is required');
    }

    if (command.name.length > 256) {
      throw new ValidationError('Name must not exceed 256 characters');
    }

    if (command.people_count !== undefined && command.people_count !== null) {
      if (!Number.isInteger(command.people_count) || command.people_count < 1) {
        throw new ValidationError('People count must be a positive integer');
      }
    }
  }
}
```

### Krok 2: Utworzenie custom error classes
```typescript
// src/errors/validation.error.ts
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// src/errors/duplicate.error.ts
export class DuplicateError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message);
    this.name = 'DuplicateError';
  }
}
```

### Krok 3: Utworzenie Astro API Route
```typescript
// src/pages/api/user/preferences.ts
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { PreferencesService } from '../../services/preferences.service';
import { ValidationError } from '../../errors/validation.error';
import type { CreateUserPreferenceDto, ApiSuccessResponse, ApiErrorResponse } from '../../types';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Weryfikacja autentykacji
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing authentication token'
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      import.meta.env.SUPABASE_URL,
      import.meta.env.SUPABASE_ANON_KEY
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token'
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Parsowanie i walidacja request body
    let body: CreateUserPreferenceDto;

    try {
      body = await request.json();
    } catch (e) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid JSON in request body'
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Utworzenie command z user_id z sesji
    const command = {
      user_id: user.id,
      name: body.name,
      people_count: body.people_count,
      budget_type: body.budget_type
    };

    // 4. Wywołanie service
    const preferencesService = new PreferencesService(supabase);
    const preference = await preferencesService.createPreference(command);

    // 5. Zwrócenie sukcesu
    const successResponse: ApiSuccessResponse<typeof preference> = {
      data: preference
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Obsługa ValidationError
    if (error instanceof ValidationError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error.field ? { [error.field]: error.message } : undefined
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obsługa UNIQUE constraint violation
    if (error.code === '23505') {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: 'DUPLICATE_NAME',
          message: 'A preference with this name already exists'
        }
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Logowanie nieoczekiwanych błędów
    console.error('Unexpected error in POST /api/preferences:', {
      error,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    // Zwrócenie ogólnego błędu
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred'
      }
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
```

### Krok 4: Testy jednostkowe dla PreferencesService
```typescript
// src/services/__tests__/userPreferences.service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { PreferencesService } from '../preferences.service';
import { ValidationError } from '../../errors/validation.error';

describe('PreferencesService', () => {
  describe('createPreference', () => {
    it('should throw ValidationError when name is empty', async () => {
      const mockSupabase = createMockSupabase();
      const service = new PreferencesService(mockSupabase);

      await expect(
        service.createPreference({
          user_id: 'user-123',
          name: '',
          people_count: null,
          budget_type: null
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when name exceeds 256 characters', async () => {
      const mockSupabase = createMockSupabase();
      const service = new PreferencesService(mockSupabase);

      await expect(
        service.createPreference({
          user_id: 'user-123',
          name: 'a'.repeat(257),
          people_count: null,
          budget_type: null
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError when people_count is negative', async () => {
      const mockSupabase = createMockSupabase();
      const service = new PreferencesService(mockSupabase);

      await expect(
        service.createPreference({
          user_id: 'user-123',
          name: 'Test',
          people_count: -1,
          budget_type: null
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should create preference successfully', async () => {
      const mockSupabase = createMockSupabase({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'pref-123',
            user_id: 'user-123',
            name: 'Test Preference',
            people_count: 2,
            budget_type: 'medium',
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z'
          },
          error: null
        })
      });

      const service = new PreferencesService(mockSupabase);

      const result = await service.createPreference({
        user_id: 'user-123',
        name: 'Test Preference',
        people_count: 2,
        budget_type: 'medium'
      });

      expect(result).toEqual({
        id: 'pref-123',
        user_id: 'user-123',
        name: 'Test Preference',
        people_count: 2,
        budget_type: 'medium',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z'
      });
    });
  });
});
```

### Krok 7: Testy integracyjne dla API endpoint
```typescript
// src/pages/api/__tests__/preferences.test.ts
import { describe, it, expect } from 'vitest';

describe('POST /api/preferences', () => {
  it('should return 401 when no auth token provided', async () => {
    const response = await fetch('http://localhost:4321/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 when name is missing', async () => {
    const token = await getTestToken();

    const response = await fetch('http://localhost:4321/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ people_count: 2 })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 when duplicate name', async () => {
    const token = await getTestToken();

    // Utwórz pierwszą preferencję
    await fetch('http://localhost:4321/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: 'Duplicate Test' })
    });

    // Próba utworzenia duplikatu
    const response = await fetch('http://localhost:4321/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name: 'Duplicate Test' })
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.code).toBe('DUPLICATE_NAME');
  });

  it('should create preference successfully', async () => {
    const token = await getTestToken();

    const response = await fetch('http://localhost:4321/api/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Integration Test',
        people_count: 3,
        budget_type: 'high'
      })
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data).toMatchObject({
      name: 'Integration Test',
      people_count: 3,
      budget_type: 'high'
    });
    expect(data.data.id).toBeDefined();
    expect(data.data.created_at).toBeDefined();
    expect(data.data.updated_at).toBeDefined();
  });
});
```
---

## Notatki implementacyjne

### ⚠️ Uwagi:
2. **Error codes**: PostgreSQL error code `23505` oznacza UNIQUE constraint violation
3. **Timezone**: Wszystkie timestampy w UTC (format ISO 8601)
4. **Null vs undefined**: W TypeScript używamy `| null` dla opcjonalnych wartości w bazie

### 🔧 Narzędzia pomocnicze:
- Supabase Dashboard do testowania SQL i RLS policies
- Postman/Insomnia do testowania API
- Vitest do testów jednostkowych i integracyjnych
- Sentry do monitorowania błędów w produkcji

### 📚 Referencje:
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Astro API Routes](https://docs.astro.build/en/core-concepts/endpoints/)
- [PostgreSQL Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html)
