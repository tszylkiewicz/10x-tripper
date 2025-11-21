# API Endpoint Implementation Plan: GET /api/trip-plans/:id

## 1. Przegląd punktu końcowego

Endpoint służy do pobrania szczegółów pojedynczego zapisanego planu podróży należącego do zalogowanego użytkownika. Zwraca pełną strukturę planu wraz z zagnieżdżonymi szczegółami (dni, aktywności, zakwaterowanie).

**Cel biznesowy**: Umożliwienie użytkownikom przeglądania szczegółów swoich zapisanych planów podróży.

**Typ operacji**: Read (GET)

## 2. Szczegóły żądania

### Metoda HTTP

`GET`

### Struktura URL

```
GET /api/trip-plans/:id
```

### Parametry URL

**Wymagane:**

- `id` (string, uuid) - Unikalny identyfikator planu podróży

**Format przykładowego żądania:**

```
GET /api/trip-plans/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <supabase_token>
```

### Headers

- `Authorization: Bearer <token>` (wymagany) - Token Supabase JWT

### Request Body

Brak (GET request)

### Query Parameters

Brak

## 3. Wykorzystywane typy

### Response DTOs

```typescript
// src/types.ts:111-116
TripPlanDto = Pick<
  Tables<"trip_plans">,
  "id" | "destination" | "start_date" | "end_date" | "people_count" | "budget_type"
> & {
  plan_details: PlanDetailsDto;
}

// src/types.ts:54-60
PlanDetailsDto {
  days: DayDto[];
  accommodation?: AccommodationDto;
  notes?: string;
  total_estimated_cost?: number;
  accepted_at?: string;
}

// src/types.ts:330-332
ApiSuccessResponse<T> {
  data: T;
}

// src/types.ts:338-344
ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### Dodatkowe typy pomocnicze

```typescript
// src/types.ts:32-36
DayDto {
  day: number;
  date: string;
  activities: ActivityDto[];
}

// src/types.ts:19-27
ActivityDto {
  time: string;
  title: string;
  description: string;
  location: string;
  estimated_cost?: number;
  duration?: string;
  category?: string;
}

// src/types.ts:41-48
AccommodationDto {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  estimated_cost?: number;
  booking_url?: string;
}
```

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "data": {
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
              "time": "09:00",
              "title": "Eiffel Tower Visit",
              "description": "Morning visit to iconic landmark",
              "location": "Champ de Mars, Paris",
              "estimated_cost": 25,
              "duration": "2 hours",
              "category": "sightseeing"
            }
          ]
        }
      ],
      "accommodation": {
        "name": "Hotel Paris Centre",
        "address": "123 Rue de Rivoli, 75001 Paris",
        "check_in": "2025-06-15",
        "check_out": "2025-06-22",
        "estimated_cost": 800,
        "booking_url": "https://example.com/booking"
      },
      "notes": "Remember to book museum tickets in advance",
      "total_estimated_cost": 1500
    }
  }
}
```

### Błąd autoryzacji (401 Unauthorized)

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

### Błąd walidacji (400 Bad Request)

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid trip plan ID format",
    "details": {
      "parameter": "id",
      "expected": "uuid"
    }
  }
}
```

### Zasób nie znaleziony (404 Not Found)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Trip plan not found"
  }
}
```

### Błąd serwera (500 Internal Server Error)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Przepływ danych

### Diagram przepływu

```
1. Request → API Endpoint Handler
              ↓
2. Weryfikacja autoryzacji (Supabase Auth)
              ↓
3. Walidacja parametru ID (UUID format)
              ↓
4. TripPlanService.getTripPlanById(id, userId)
              ↓
5. Supabase Client Query:
   - SELECT z trip_plans WHERE id = ? AND deleted_at IS NULL
   - RLS automatycznie filtruje user_id
              ↓
6. Sprawdzenie czy wynik istnieje
              ↓
7. Mapowanie Tables<"trip_plans"> → TripPlanDto
              ↓
8. Zwrócenie ApiSuccessResponse<TripPlanDto>
```

### Szczegółowy przepływ w serwisie

**TripPlanService.getTripPlanById(id: string, userId: string)**

```typescript
1. Walidacja UUID:
   - Sprawdź czy id jest prawidłowym UUID
   - Rzuć błąd jeśli format nieprawidłowy

2. Zapytanie do bazy:
   const { data, error } = await supabase
     .from('trip_plans')
     .select('*')
     .eq('id', id)
     .is('deleted_at', null)
     .single()

3. Obsługa wyniku:
   - Jeśli error && error.code === 'PGRST116' → null (not found)
   - Jeśli error → rzuć błąd
   - Jeśli !data → null

4. Mapowanie do DTO:
   - Wybierz tylko pola z TripPlanDto
   - Parsuj plan_details jako PlanDetailsDto
   - Zwróć zmapowany obiekt
```

### Interakcja z bazą danych

**Tabela**: `trip_plans`

**Query**:

```sql
SELECT id, destination, start_date, end_date, people_count,
       budget_type, plan_details, source, created_at, updated_at
FROM trip_plans
WHERE id = $1
  AND user_id = $2  -- automatycznie dodane przez RLS
  AND deleted_at IS NULL
LIMIT 1
```

**RLS Policy** (automatycznie stosowana):

```sql
CREATE POLICY tp_owner ON trip_plans
  USING (user_id = auth.uid());
```

## 6. Względy bezpieczeństwa

### Autoryzacja

- **Mechanizm**: Supabase JWT token w header `Authorization: Bearer <token>`
- **Weryfikacja**: Middleware Astro sprawdza sesję Supabase
- **Poziom**: Wymagane uwierzytelnienie dla całego endpointu
- **Kod błędu**: 401 Unauthorized przy braku/nieprawidłowym tokenie

### Row-Level Security (RLS)

- **Policy**: `tp_owner` - użytkownik widzi tylko swoje plany
- **Automatyzacja**: RLS jest włączony na tabeli trip_plans
- **Korzyści**:
  - Ochrona na poziomie bazy danych
  - Nie można obejść przez błędy w kodzie aplikacji
  - Automatyczne filtrowanie przez user_id

### Walidacja danych wejściowych

#### Parametr ID

```typescript
// Walidacja UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
```

**Powód**: Zapobiega SQL injection i nieprawidłowym zapytaniom

#### Soft-delete filter

```typescript
.is('deleted_at', null)
```

**Powód**: Plany soft-deleted nie powinny być dostępne dla użytkowników

### Ochrona przed atakami

1. **SQL Injection**:
   - Walidacja UUID przed zapytaniem
   - Supabase client używa parametryzowanych zapytań

2. **Authorization Bypass**:
   - RLS zapewnia ochronę na poziomie bazy
   - Dwupoziomowa weryfikacja (sesja + RLS)

3. **Information Disclosure**:
   - Zwracaj 404 zarówno dla nieistniejących jak i niedostępnych zasobów
   - Nie ujawniaj różnicy między "nie istnieje" a "brak dostępu"
   - Nie zwracaj wrażliwych pól (user_id, deleted_at, deleted_by)

4. **IDOR (Insecure Direct Object Reference)**:
   - RLS automatycznie filtruje przez user_id
   - Niemożliwe pobranie planów innych użytkowników

## 7. Obsługa błędów

### Katalog błędów

#### 1. Błędy autoryzacji (401)

**Scenariusz**: Brak tokenu lub nieprawidłowy token

```typescript
if (!session) {
  return new Response(
    JSON.stringify({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token",
      },
    }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 2. Błędy walidacji (400)

**Scenariusz A**: Nieprawidłowy format UUID

```typescript
if (!isValidUUID(id)) {
  return new Response(
    JSON.stringify({
      error: {
        code: "INVALID_PARAMETER",
        message: "Invalid trip plan ID format",
        details: {
          parameter: "id",
          expected: "uuid",
        },
      },
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

#### 3. Błędy zasobów (404)

**Scenariusz**: Plan nie istnieje lub nie należy do użytkownika

```typescript
if (!tripPlan) {
  return new Response(
    JSON.stringify({
      error: {
        code: "NOT_FOUND",
        message: "Trip plan not found",
      },
    }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}
```

**Uwaga**: Ten sam komunikat dla:

- Plan nie istnieje w bazie
- Plan należy do innego użytkownika (zablokowany przez RLS)
- Plan jest soft-deleted

#### 4. Błędy serwera (500)

**Scenariusz**: Błędy bazy danych lub nieoczekiwane wyjątki

```typescript
try {
  // ... logika endpointu
} catch (error) {
  console.error("Error fetching trip plan:", error);

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

### Strategia logowania błędów

#### Co logować:

- 500 errors - pełny stack trace
- 404 errors - tylko metryki (nie logować szczegółów)
- 401/400 errors - podstawowe info (potencjalne ataki)

#### Gdzie logować:

- Console (development)
- Monitoring service (production) - np. Sentry, DataDog

#### Co NIE logować:

- Tokeny autoryzacji
- Pełne UUID użytkowników w logach publicznie dostępnych
- Szczegóły błędów bazy danych w odpowiedzi do klienta

## 8. Rozważania dotyczące wydajności

### Indeksy bazodanowe

**Wymagane indeksy** (zgodnie z dokumentacją DB):

```sql
-- Podstawowy indeks na user_id
CREATE INDEX idx_trip_plans_user_id ON trip_plans(user_id);

-- Indeks na generation_id (dla analytics)
CREATE INDEX idx_trip_plans_generation_id ON trip_plans(generation_id);
```

**Potencjalne dodatkowe indeksy** (jeśli wydajność wymaga):

```sql
-- Composite index dla typowych zapytań
CREATE INDEX idx_trip_plans_user_deleted
ON trip_plans(user_id, deleted_at)
WHERE deleted_at IS NULL;
```

### Optymalizacja zapytań

#### Query pojedynczego rekordu

```typescript
// Użyj .single() zamiast .maybeSingle() dla lepszej wydajności
.single()  // Rzuca błąd jeśli >1 wynik, szybsze
```

#### Selective field loading

```typescript
// Wybierz tylko potrzebne pola
.select('id, destination, start_date, end_date, people_count, budget_type, plan_details')

// Zamiast
.select('*')
```

### Caching strategy

**Obecnie**: Brak cachingu (świeże dane za każdym razem)

**Przyszłe ulepszenia** (jeśli potrzebne):

1. **Cache na poziomie Supabase**: Automatic query caching
2. **CDN caching**: Dla statycznych elementów UI
3. **Client-side caching**: React Query lub podobne (cache na 5 min)

**Uwaga**: Plany podróży mogą być edytowane, więc cache musi być krótkoterminowy

### Wąskie gardła

#### Potencjalne problemy:

1. **JSONB parsing**: `plan_details` może być duże
2. **RLS overhead**: Dodatkowy WHERE clause w każdym query
3. **Network latency**: Supabase hosted w chmurze

#### Rozwiązania:

1. **JSONB**: Nie parsuj w aplikacji, zwróć raw
2. **RLS**: Nieistotny dla pojedynczego rekordu
3. **Network**: Użyj najbliższego regionu Supabase

### Monitoring

**Metryki do śledzenia**:

- Średni czas odpowiedzi (target: <200ms)
- Liczba 404 errors (duża liczba może wskazywać na problem)
- Liczba 500 errors (powinno być ~0)
- Database query time

## 9. Etapy wdrożenia

### Faza 1: Przygotowanie struktury

#### Krok 1.1: Utworzenie serwisu TripPlanService

**Plik**: `src/services/tripPlanService.ts`

**Zadania**:

- [ ] Utworzyć klasę/moduł `TripPlanService`
- [ ] Zaimportować Supabase client
- [ ] Zaimportować typy: `TripPlanDto`, `PlanDetailsDto`, `Tables`
- [ ] Dodać helper function do walidacji UUID

**Przykładowa struktura**:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TripPlanDto } from "../types";

export class TripPlanService {
  constructor(private supabase: SupabaseClient) {}

  async getTripPlanById(id: string, userId: string): Promise<TripPlanDto | null> {
    // Implementacja w kolejnych krokach
  }

  private isValidUUID(id: string): boolean {
    // Implementacja walidacji
  }

  private mapToDto(data: any): TripPlanDto {
    // Mapowanie danych
  }
}
```

#### Krok 1.2: Implementacja walidacji UUID

**Plik**: `src/services/tripPlanService.ts`

**Zadania**:

- [ ] Dodać regex pattern dla UUID v4
- [ ] Utworzyć helper function `isValidUUID()`
- [ ] Dodać unit testy dla walidacji

**Kod**:

```typescript
private isValidUUID(id: string): boolean {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return UUID_REGEX.test(id);
}
```

### Faza 2: Implementacja logiki serwisu

#### Krok 2.1: Implementacja getTripPlanById

**Plik**: `src/services/tripPlanService.ts`

**Zadania**:

- [ ] Walidacja formatu UUID
- [ ] Zapytanie do bazy danych z filtrami
- [ ] Obsługa przypadku not found
- [ ] Obsługa błędów bazy danych
- [ ] Mapowanie do DTO

**Kod**:

```typescript
async getTripPlanById(id: string, userId: string): Promise<TripPlanDto | null> {
  // 1. Walidacja UUID
  if (!this.isValidUUID(id)) {
    throw new Error('Invalid UUID format');
  }

  // 2. Query do bazy
  const { data, error } = await this.supabase
    .from('trip_plans')
    .select('id, destination, start_date, end_date, people_count, budget_type, plan_details, source, created_at, updated_at')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  // 3. Obsługa błędów
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw error;
  }

  // 4. Sprawdzenie danych
  if (!data) {
    return null;
  }

  // 5. Mapowanie do DTO
  return this.mapToDto(data);
}
```

#### Krok 2.2: Implementacja mapowania do DTO

**Plik**: `src/services/tripPlanService.ts`

**Zadania**:

- [ ] Mapować pola z Tables<'trip_plans'> na TripPlanDto
- [ ] Upewnić się, że plan_details jest właściwie typowany
- [ ] Wykluczyć wrażliwe pola (user_id, deleted_at, deleted_by)

**Kod**:

```typescript
private mapToDto(data: any): TripPlanDto {
  return {
    id: data.id,
    destination: data.destination,
    start_date: data.start_date,
    end_date: data.end_date,
    people_count: data.people_count,
    budget_type: data.budget_type,
    plan_details: data.plan_details as PlanDetailsDto
  };
}
```

### Faza 3: Implementacja API endpoint

#### Krok 3.1: Utworzenie pliku endpoint

**Plik**: `src/pages/api/trip-plans/[id].ts`

**Zadania**:

- [ ] Utworzyć plik z dynamic routing [id]
- [ ] Zaimportować niezbędne typy i serwisy
- [ ] Utworzyć strukturę GET handler

**Przykładowa struktura**:

```typescript
import type { APIRoute } from "astro";
import { TripPlanService } from "../../../services/tripPlanService";
import type { ApiSuccessResponse, ApiErrorResponse, TripPlanDto } from "../../../types";

export const GET: APIRoute = async ({ params, locals }) => {
  // Implementacja w kolejnych krokach
};
```

#### Krok 3.2: Implementacja weryfikacji autoryzacji

**Plik**: `src/pages/api/trip-plans/[id].ts`

**Zadania**:

- [ ] Pobrać sesję Supabase z locals
- [ ] Sprawdzić czy użytkownik jest zalogowany
- [ ] Zwrócić 401 jeśli brak autoryzacji

**Kod**:

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Weryfikacja sesji
  const session = locals.session; // lub locals.supabase.auth.getSession()

  if (!session?.user) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Dalsze kroki...
};
```

#### Krok 3.3: Implementacja walidacji parametrów

**Plik**: `src/pages/api/trip-plans/[id].ts`

**Zadania**:

- [ ] Pobrać parametr id z params
- [ ] Zwalidować czy id istnieje
- [ ] Zwrócić 400 dla nieprawidłowego formatu

**Kod**:

```typescript
// 2. Pobranie i walidacja ID
const { id } = params;

if (!id) {
  const errorResponse: ApiErrorResponse = {
    error: {
      code: "INVALID_PARAMETER",
      message: "Trip plan ID is required",
      details: {
        parameter: "id",
      },
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Krok 3.4: Implementacja wywołania serwisu

**Plik**: `src/pages/api/trip-plans/[id].ts`

**Zadania**:

- [ ] Utworzyć instancję TripPlanService
- [ ] Wywołać getTripPlanById()
- [ ] Obsłużyć błąd walidacji UUID (400)
- [ ] Obsłużyć brak wyniku (404)
- [ ] Obsłużyć błędy serwera (500)

**Kod**:

```typescript
try {
  // 3. Wywołanie serwisu
  const tripPlanService = new TripPlanService(locals.supabase);
  const tripPlan = await tripPlanService.getTripPlanById(id, session.user.id);

  // 4. Sprawdzenie czy znaleziono
  if (!tripPlan) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "NOT_FOUND",
        message: "Trip plan not found",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 5. Zwrócenie sukcesu
  const successResponse: ApiSuccessResponse<TripPlanDto> = {
    data: tripPlan,
  };

  return new Response(JSON.stringify(successResponse), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Error fetching trip plan:", error);

  // 6. Obsługa błędu walidacji UUID
  if (error instanceof Error && error.message === "Invalid UUID format") {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INVALID_PARAMETER",
        message: "Invalid trip plan ID format",
        details: {
          parameter: "id",
          expected: "uuid",
        },
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 7. Obsługa innych błędów
  const errorResponse: ApiErrorResponse = {
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Faza 4: Testy

#### Krok 4.1: Testy jednostkowe serwisu

**Plik**: `src/services/__tests__/tripPlanService.test.ts`

**Zadania**:

- [ ] Test walidacji UUID - prawidłowe formaty
- [ ] Test walidacji UUID - nieprawidłowe formaty
- [ ] Test getTripPlanById - sukces
- [ ] Test getTripPlanById - not found
- [ ] Test getTripPlanById - błąd bazy danych
- [ ] Test mapowania do DTO

**Przykładowe testy**:

```typescript
describe("TripPlanService", () => {
  describe("isValidUUID", () => {
    it("should accept valid UUID v4", () => {
      const service = new TripPlanService(mockSupabase);
      expect(service["isValidUUID"]("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const service = new TripPlanService(mockSupabase);
      expect(service["isValidUUID"]("invalid-uuid")).toBe(false);
    });
  });

  describe("getTripPlanById", () => {
    it("should return trip plan when found", async () => {
      // Mock successful response
      // Test implementation
    });

    it("should return null when not found", async () => {
      // Mock PGRST116 error
      // Test implementation
    });

    it("should throw error on database failure", async () => {
      // Mock database error
      // Test implementation
    });
  });
});
```

#### Krok 4.2: Testy integracyjne API

**Plik**: `src/pages/api/trip-plans/__tests__/[id].test.ts`

**Zadania**:

- [ ] Test 200 - pomyślne pobranie planu
- [ ] Test 401 - brak autoryzacji
- [ ] Test 400 - nieprawidłowy UUID
- [ ] Test 404 - plan nie znaleziony
- [ ] Test 404 - plan innego użytkownika (RLS)
- [ ] Test 404 - plan soft-deleted
- [ ] Test 500 - błąd serwera

#### Krok 4.3: Testy manualne

**Zadania**:

- [ ] Test z Postman/Insomnia
- [ ] Sprawdzenie response time
- [ ] Weryfikacja RLS (próba dostępu do cudzego planu)
- [ ] Test z różnymi formatami UUID

### Faza 5: Dokumentacja i wdrożenie

#### Krok 5.1: Dokumentacja kodu

**Zadania**:

- [ ] Dodać JSDoc comments do funkcji serwisu
- [ ] Dodać komentarze do złożonej logiki
- [ ] Udokumentować typy błędów

#### Krok 5.2: Aktualizacja dokumentacji API

**Plik**: README lub API docs

**Zadania**:

- [ ] Dodać przykłady użycia
- [ ] Udokumentować wszystkie kody błędów
- [ ] Dodać przykłady curl/fetch

#### Krok 5.3: Code review checklist

**Zadania**:

- [ ] Sprawdzić zgodność z typami TypeScript
- [ ] Zweryfikować obsługę błędów
- [ ] Sprawdzić bezpieczeństwo (RLS, walidacja)
- [ ] Zweryfikować wydajność zapytań
- [ ] Sprawdzić formatowanie i linting

#### Krok 5.4: Deployment

**Zadania**:

- [ ] Merge do develop branch
- [ ] Testy na środowisku staging
- [ ] Monitoring errors po wdrożeniu
- [ ] Merge do main/production

### Faza 6: Monitoring i maintenance

#### Krok 6.1: Setup monitoringu

**Zadania**:

- [ ] Skonfigurować alerty dla 500 errors
- [ ] Monitorować response time
- [ ] Śledzić usage metrics

#### Krok 6.2: Optimizacja (jeśli potrzebna)

**Zadania**:

- [ ] Analiza slow queries
- [ ] Rozważenie cachingu
- [ ] Optymalizacja indeksów

## 10. Checklist przed wdrożeniem

### Bezpieczeństwo

- [ ] RLS włączony i przetestowany
- [ ] Walidacja UUID zaimplementowana
- [ ] Autoryzacja wymuszana
- [ ] Wrażliwe dane wykluczony z response
- [ ] Soft-deleted plany filtrowane

### Funkcjonalność

- [ ] Wszystkie kody statusu zaimplementowane
- [ ] Obsługa błędów kompletna
- [ ] Mapowanie DTO poprawne
- [ ] Edge cases pokryte testami

### Wydajność

- [ ] Indeksy bazodanowe utworzone
- [ ] Query optymalizowane (selective fields)
- [ ] Response time < 200ms

### Jakość kodu

- [ ] TypeScript bez błędów
- [ ] Linting passed
- [ ] Testy jednostkowe passed
- [ ] Testy integracyjne passed
- [ ] Code review completed

### Dokumentacja

- [ ] JSDoc comments dodane
- [ ] API documentation zaktualizowana
- [ ] Przykłady użycia dodane

---

## Podsumowanie

Ten plan implementacji zapewnia:

1. **Bezpieczeństwo**: RLS, walidacja, autoryzacja
2. **Niezawodność**: Kompleksowa obsługa błędów
3. **Wydajność**: Optymalizowane zapytania, indeksy
4. **Maintainability**: Czysty kod, testy, dokumentacja
5. **Skalowalność**: Struktura gotowa na przyszłe rozszerzenia

Endpoint jest stosunkowo prosty (GET single resource), ale wymaga starannej implementacji bezpieczeństwa i obsługi błędów. Kluczowe punkty to:

- RLS jako główna warstwa bezpieczeństwa
- Walidacja UUID przed zapytaniem
- Jednolite komunikaty błędów (404 dla różnych przypadków)
- Wykluczenie wrażliwych danych z response
