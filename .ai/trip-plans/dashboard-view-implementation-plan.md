# Plan implementacji widoku Dashboard (lista planów)

## 1. Przegląd

Dashboard to główny widok aplikacji Tripper, dostępny pod ścieżką `/`. Jego celem jest prezentacja wszystkich zaakceptowanych i zapisanych planów wycieczek użytkownika oraz umożliwienie podstawowych operacji: przeglądania szczegółów, usuwania planów i tworzenia nowych. Widok wyświetla karty planów posortowane według daty rozpoczęcia (od najbliższej), pokazuje status każdego planu (AI/Edytowany) i zapewnia szybki dostęp do tworzenia nowego planu.

## 2. Routing widoku

- **Ścieżka**: `/`
- **Plik**: `src/pages/index.astro`
- **Wymagania**: użytkownik musi być zalogowany (middleware Astro weryfikuje sesję)
- **Przekierowania**:
  - Brak sesji → `/login`
  - Kliknięcie karty planu → `/plans/:id`
  - Kliknięcie "Utwórz plan" → `/plans/new`

## 3. Struktura komponentów

```
index.astro (DashboardPage)
└── DashboardContent (React Client Component)
    ├── Navbar (React)
    ├── main
    │   ├── PlansList (React)
    │   │   ├── LoadingSpinner (React) [conditional: isLoading]
    │   │   ├── ErrorState (React) [conditional: error]
    │   │   ├── EmptyState (React) [conditional: plans.length === 0]
    │   │   └── PlanCard[] (React) [conditional: plans.length > 0]
    │   │       └── Badge (Shadcn/ui) - status planu
    │   └── CreatePlanButton (React)
    └── DeleteConfirmDialog (React) [conditional: selectedPlan]
    └── Toaster (Shadcn/ui)
```

## 4. Szczegóły komponentów

### 4.1. DashboardPage (index.astro)

**Opis**: Główna strona Astro odpowiedzialna za server-side rendering, weryfikację autentykacji i layout.

**Główne elementy**:

- Sprawdzenie sesji użytkownika przez middleware
- Layout strony (head, meta tags)
- Osadzenie komponentu React `DashboardContent` z dyrektywą `client:load`

**Obsługiwane zdarzenia**: brak (strona Astro)

**Warunki walidacji**:

- Weryfikacja sesji użytkownika - jeśli brak, przekierowanie do `/login`

**Typy**: `SupabaseClient` z locals

**Propsy**: brak

---

### 4.2. DashboardContent (React)

**Opis**: Główny kontener React zarządzający całym widokiem Dashboard, stanem aplikacji i logiką biznesową.

**Główne elementy**:

- `<Navbar />` - nawigacja
- `<main>` - kontener głównej treści
  - `<PlansList />` - lista planów
  - `<CreatePlanButton />` - przycisk tworzenia planu
- `<DeleteConfirmDialog />` - dialog potwierdzenia usunięcia
- `<Toaster />` - system powiadomień

**Obsługiwane zdarzenia**:

- `onPlanClick(planId)` - przekierowanie do szczegółów planu
- `onDeleteClick(planId)` - otwarcie dialogu potwierdzenia
- `onDeleteConfirm()` - wywołanie API DELETE
- `onDeleteCancel()` - zamknięcie dialogu
- `onCreatePlanClick()` - przekierowanie do formularza tworzenia

**Warunki walidacji**: brak (delegowane do komponentów dzieci)

**Typy**:

- `TripPlanViewModel[]` - lista planów
- Stan dialogu usuwania

**Propsy**: brak (root component)

---

### 4.3. Navbar (React)

**Opis**: Komponent nawigacyjny wyświetlany na górze strony, zawierający logo aplikacji i menu użytkownika.

**Główne elementy**:

- Logo/nazwa aplikacji "Tripper"
- Menu użytkownika (dropdown):
  - Link do profilu użytkownika
  - Link do preferencji
  - Przycisk wylogowania

**Obsługiwane zdarzenia**:

- `onLogout()` - wylogowanie użytkownika

**Warunki walidacji**: brak

**Typy**: opcjonalnie `User` z Supabase (dla wyświetlenia email/imienia)

**Propsy**:

```typescript
interface NavbarProps {
  user?: {
    email: string;
    id: string;
  };
}
```

---

### 4.4. PlansList (React)

**Opis**: Główny komponent zarządzający listą planów. Pobiera dane z API, zarządza stanem ładowania/błędów i wyświetla odpowiedni widok w zależności od stanu.

**Główne elementy**:

- `<div>` kontener z grid layout (responsive)
- Warunkowo renderowane komponenty:
  - `<LoadingSpinner />` gdy `isLoading === true`
  - `<ErrorState />` gdy `error !== null`
  - `<EmptyState />` gdy `plans.length === 0 && !isLoading`
  - `<PlanCard />[]` gdy `plans.length > 0`

**Obsługiwane zdarzenia**:

- `onPlanClick(planId: string)` - kliknięcie karty (przekazane do rodzica)
- `onDeleteClick(planId: string)` - kliknięcie usunięcia (przekazane do rodzica)

**Warunki walidacji**:

- Sprawdzenie `isLoading` przed renderowaniem listy
- Sprawdzenie `error` przed renderowaniem listy
- Sprawdzenie `plans.length > 0` przed renderowaniem kart

**Typy**:

- `PlansListState` - stan wewnętrzny (z custom hook)
- `TripPlanViewModel[]` - lista planów

**Propsy**:

```typescript
interface PlansListProps {
  onPlanClick: (planId: string) => void;
  onDeleteClick: (planId: string) => void;
}
```

---

### 4.5. PlanCard (React)

**Opis**: Komponent karty pojedynczego planu wyświetlający kluczowe informacje i umożliwiający podstawowe akcje.

**Główne elementy**:

- `<Card>` (Shadcn/ui) - główny kontener
  - `<CardHeader>`
    - Destination (h3)
    - Badge ze statusem (AI/Edytowany)
  - `<CardContent>`
    - Daty (start_date - end_date)
    - Liczba osób (people_count)
    - Typ budżetu (budget_type)
    - Podsumowanie: liczba dni, liczba aktywności
  - `<CardFooter>`
    - Przycisk "Zobacz szczegóły"
    - Przycisk "Usuń" (ikona)

**Obsługiwane zdarzenia**:

- `onClick()` - kliknięcie karty lub przycisku "Zobacz szczegóły"
- `onDeleteClick(e)` - kliknięcie przycisku usuwania (e.stopPropagation())

**Warunki walidacji**: brak (tylko prezentacja danych)

**Typy**:

- `TripPlanViewModel` - dane planu

**Propsy**:

```typescript
interface PlanCardProps {
  plan: TripPlanViewModel;
  onClick: () => void;
  onDelete: () => void;
}
```

---

### 4.6. CreatePlanButton (React)

**Opis**: Wyróżniony przycisk do tworzenia nowego planu, wyświetlany jako floating action button (mobile) lub prominent button (desktop).

**Główne elementy**:

- `<Button>` (Shadcn/ui) z ikoną "+"
- Tekst "Utwórz plan"
- Responsywne pozycjonowanie (fixed na mobile, static na desktop)

**Obsługiwane zdarzenia**:

- `onClick()` - przekierowanie do `/plans/new`

**Warunki walidacji**: brak

**Typy**: brak

**Propsy**:

```typescript
interface CreatePlanButtonProps {
  onClick: () => void;
}
```

---

### 4.7. EmptyState (React)

**Opis**: Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych planów, zachęcający do utworzenia pierwszego.

**Główne elementy**:

- Ikona (np. mapa lub kompas)
- Nagłówek "Brak planów wycieczek"
- Opis "Zacznij planować swoją następną przygodę!"
- Przycisk "Utwórz pierwszy plan"

**Obsługiwane zdarzenia**:

- `onCreatePlan()` - kliknięcie przycisku

**Warunki walidacji**: brak

**Typy**: brak

**Propsy**:

```typescript
interface EmptyStateProps {
  onCreatePlan: () => void;
}
```

---

### 4.8. ErrorState (React)

**Opis**: Komponent wyświetlany przy błędzie pobierania danych z API.

**Główne elementy**:

- Ikona błędu
- Nagłówek "Nie udało się pobrać planów"
- Komunikat błędu
- Przycisk "Spróbuj ponownie"

**Obsługiwane zdarzenia**:

- `onRetry()` - ponowne wywołanie API

**Warunki walidacji**: brak

**Typy**: brak

**Propsy**:

```typescript
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}
```

---

### 4.9. LoadingSpinner (React)

**Opis**: Komponent wyświetlający animowany wskaźnik ładowania podczas pobierania danych.

**Główne elementy**:

- Spinner (animacja CSS lub Shadcn/ui Spinner)
- Opcjonalnie: tekst "Ładowanie planów..."

**Obsługiwane zdarzenia**: brak

**Warunki walidacji**: brak

**Typy**: brak

**Propsy**: brak lub opcjonalny `message: string`

---

### 4.10. DeleteConfirmDialog (React)

**Opis**: Modal potwierdzenia usunięcia planu z ważnymi informacjami o planie.

**Główne elementy**:

- `<AlertDialog>` (Shadcn/ui)
  - `<AlertDialogHeader>`
    - Tytuł "Usuń plan wycieczki"
    - Opis z nazwą destynacji i datami
  - `<AlertDialogFooter>`
    - Przycisk "Anuluj"
    - Przycisk "Usuń" (destructive, disabled gdy isDeleting)

**Obsługiwane zdarzenia**:

- `onConfirm()` - potwierdzenie usunięcia
- `onCancel()` - anulowanie

**Warunki walidacji**:

- Wyłączenie przycisku "Usuń" podczas operacji usuwania (`isDeleting === true`)

**Typy**:

- `TripPlanViewModel` (częściowo - destination, start_date, end_date)

**Propsy**:

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  plan: {
    id: string;
    destination: string;
    start_date: string;
    end_date: string;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
```

## 5. Typy

### 5.1. TripPlanViewModel

Rozszerzony typ TripPlanDto zawierający dodatkowe pola potrzebne w widoku Dashboard.

```typescript
/**
 * ViewModel dla pojedynczego planu wycieczki w widoku Dashboard
 * Rozszerza TripPlanDto o pola source, created_at, updated_at
 */
interface TripPlanViewModel extends TripPlanDto {
  /**
   * Źródło planu - czy został wygenerowany przez AI czy edytowany
   * 'ai' - plan wygenerowany przez AI i zaakceptowany bez edycji
   * 'ai-edited' - plan edytowany przez użytkownika
   */
  source: "ai" | "ai-edited";

  /**
   * Data utworzenia planu (ISO 8601)
   */
  created_at: string;

  /**
   * Data ostatniej aktualizacji planu (ISO 8601)
   */
  updated_at: string;
}
```

**Pola dziedziczone z TripPlanDto**:

- `id: string` - UUID planu
- `destination: string` - cel podróży
- `start_date: string` - data rozpoczęcia (YYYY-MM-DD)
- `end_date: string` - data zakończenia (YYYY-MM-DD)
- `people_count: number` - liczba osób
- `budget_type: string` - typ budżetu
- `plan_details: PlanDetailsDto` - szczegóły planu

### 5.2. PlansListState

Stan zarządzany przez custom hook `useTripPlans`.

```typescript
/**
 * Stan listy planów
 */
interface PlansListState {
  /**
   * Lista planów użytkownika
   */
  plans: TripPlanViewModel[];

  /**
   * Czy trwa ładowanie danych z API
   */
  isLoading: boolean;

  /**
   * Komunikat błędu (null jeśli brak błędu)
   */
  error: string | null;
}
```

### 5.3. DeletePlanState

Stan operacji usuwania planu.

```typescript
/**
 * Stan operacji usuwania planu
 */
interface DeletePlanState {
  /**
   * Plan wybrany do usunięcia (null jeśli dialog zamknięty)
   */
  selectedPlan: TripPlanViewModel | null;

  /**
   * Czy trwa operacja usuwania
   */
  isDeleting: boolean;
}
```

### 5.4. ApiResponse Types

Wykorzystywane typy z `src/types.ts`:

```typescript
// Sukces - GET /api/trip-plans
type GetTripPlansResponse = ApiSuccessResponse<TripPlanDto[]>;

// Błąd
type ApiError = ApiErrorResponse;
```

**UWAGA**: API obecnie nie zwraca pól `source`, `created_at`, `updated_at` w TripPlanDto. Wymagana jest aktualizacja:

1. `src/types.ts` - rozszerzenie TripPlanDto
2. `src/pages/api/trip-plans/index.ts` - aktualizacja selecta w query

## 6. Zarządzanie stanem

### 6.1. Custom Hook: useTripPlans

Główny hook zarządzający stanem listy planów i operacjami na nich.

```typescript
/**
 * Custom hook do zarządzania listą planów wycieczek
 *
 * @returns {Object} Stan i metody do zarządzania planami
 */
function useTripPlans() {
  const [plans, setPlans] = useState<TripPlanViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pobiera listę planów z API
   */
  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/trip-plans");

      if (response.status === 401) {
        // Redirect do logowania
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Nie udało się pobrać planów");
      }

      const data: ApiSuccessResponse<TripPlanViewModel[]> = await response.json();
      setPlans(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Usuwa plan (soft delete)
   * @param planId - ID planu do usunięcia
   */
  const deletePlan = async (planId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/trip-plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Nie udało się usunąć planu");
      }

      // Optimistic update - usuń plan z lokalnego state
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));

      return true;
    } catch (err) {
      console.error("Error deleting plan:", err);
      return false;
    }
  };

  /**
   * Odświeża listę planów
   */
  const refetch = () => {
    fetchPlans();
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    isLoading,
    error,
    deletePlan,
    refetch,
  };
}
```

### 6.2. Stan lokalny w DashboardContent

```typescript
// Stan dialogu usuwania
const [deletePlanState, setDeletePlanState] = useState<DeletePlanState>({
  selectedPlan: null,
  isDeleting: false,
});

// Stan z custom hook
const { plans, isLoading, error, deletePlan, refetch } = useTripPlans();
```

### 6.3. Toast Notifications

Używamy Shadcn/ui `useToast()` hook do wyświetlania powiadomień:

```typescript
const { toast } = useToast();

// Sukces usunięcia
toast({
  title: "Plan usunięty",
  description: "Plan wycieczki został pomyślnie usunięty.",
  variant: "default",
});

// Błąd usunięcia
toast({
  title: "Błąd",
  description: "Nie udało się usunąć planu. Spróbuj ponownie.",
  variant: "destructive",
});
```

## 7. Integracja API

### 7.1. GET /api/trip-plans

**Endpoint**: `GET /api/trip-plans`

**Kiedy wywołać**:

- Przy montowaniu komponentu `PlansList` (useEffect)
- Po usunięciu planu (optional refetch)
- Po powrocie z widoku tworzenia/edycji planu (refetch)

**Headers**:

```typescript
{
  'Content-Type': 'application/json',
  // Cookie z sesją Supabase jest automatycznie wysyłane
}
```

**Request Body**: brak (GET)

**Response - Sukces (200)**:

```typescript
{
  data: TripPlanViewModel[] // po aktualizacji TripPlanDto
}
```

**Response - Błąd (401)**:

```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required"
  }
}
```

**Response - Błąd (500)**:

```typescript
{
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred. Please try again later.",
    details: { timestamp: string }
  }
}
```

**Obsługa w komponencie**:

```typescript
const response = await fetch("/api/trip-plans");

if (response.status === 401) {
  window.location.href = "/login";
  return;
}

if (!response.ok) {
  throw new Error("Nie udało się pobrać planów");
}

const { data } = await response.json();
setPlans(data);
```

### 7.2. DELETE /api/trip-plans/:id

**UWAGA**: Ten endpoint nie istnieje jeszcze w kodzie. Wymaga implementacji.

**Endpoint**: `DELETE /api/trip-plans/:id`

**Kiedy wywołać**: Po potwierdzeniu usunięcia w DeleteConfirmDialog

**Headers**:

```typescript
{
  'Content-Type': 'application/json',
}
```

**Request Body**: brak (DELETE)

**Response - Sukces (200)**:

```typescript
{
  data: null;
}
```

**Response - Błąd (401)**:

```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "Authentication required"
  }
}
```

**Response - Błąd (404)**:

```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "Trip plan not found"
  }
}
```

**Response - Błąd (403)**:

```typescript
{
  error: {
    code: "FORBIDDEN",
    message: "You don't have permission to delete this plan"
  }
}
```

**Obsługa w komponencie**:

```typescript
const response = await fetch(`/api/trip-plans/${planId}`, {
  method: "DELETE",
});

if (!response.ok) {
  toast({
    title: "Błąd",
    description: "Nie udało się usunąć planu.",
    variant: "destructive",
  });
  return false;
}

toast({
  title: "Sukces",
  description: "Plan został usunięty.",
});

return true;
```

## 8. Interakcje użytkownika

### 8.1. Załadowanie strony Dashboard

**Akcja**: Użytkownik wchodzi na `/`

**Przepływ**:

1. Astro middleware sprawdza sesję użytkownika
2. Jeśli brak sesji → redirect do `/login`
3. Jeśli sesja OK → renderowanie strony
4. Komponent `DashboardContent` montuje się
5. Hook `useTripPlans` wywołuje `fetchPlans()`
6. Stan `isLoading` ustawiony na `true`
7. Wyświetlenie `<LoadingSpinner />`
8. Po otrzymaniu odpowiedzi z API:
   - Sukces → ustawienie `plans`, `isLoading = false`
   - Błąd → ustawienie `error`, `isLoading = false`

**Wynik**:

- Sukces z planami → wyświetlenie listy kart planów
- Sukces bez planów → wyświetlenie `<EmptyState />`
- Błąd → wyświetlenie `<ErrorState />`

### 8.2. Kliknięcie karty planu

**Akcja**: Użytkownik klika na kartę planu lub przycisk "Zobacz szczegóły"

**Przepływ**:

1. Event handler `onClick` w `<PlanCard />`
2. Wywołanie `props.onClick()`
3. Wywołanie `onPlanClick(plan.id)` w `DashboardContent`
4. Nawigacja do `/plans/${planId}` (React Router lub Astro navigate)

**Wynik**: Przekierowanie do widoku szczegółów planu

### 8.3. Kliknięcie przycisku usuwania

**Akcja**: Użytkownik klika ikonę/przycisk usuwania w karcie planu

**Przepływ**:

1. Event handler `onDelete` w `<PlanCard />`
2. `e.stopPropagation()` - zapobiega uruchomieniu `onClick` karty
3. Wywołanie `props.onDelete()`
4. Wywołanie `onDeleteClick(plan.id)` w `DashboardContent`
5. Znalezienie planu po ID: `const plan = plans.find(p => p.id === planId)`
6. Ustawienie stanu:
   ```typescript
   setDeletePlanState({
     selectedPlan: plan,
     isDeleting: false,
   });
   ```
7. Otwarcie `<DeleteConfirmDialog />`

**Wynik**: Wyświetlenie dialogu potwierdzenia z informacjami o planie

### 8.4. Potwierdzenie usunięcia planu

**Akcja**: Użytkownik klika "Usuń" w dialogu potwierdzenia

**Przepływ**:

1. Event handler `onConfirm` w `<DeleteConfirmDialog />`
2. Ustawienie `isDeleting = true` (wyłączenie przycisku)
3. Wywołanie `await deletePlan(selectedPlan.id)`
4. API call: `DELETE /api/trip-plans/:id`
5. Obsługa odpowiedzi:
   - Sukces:
     - Usunięcie planu z lokalnego state (optimistic update)
     - Wyświetlenie toast sukcesu
     - Zamknięcie dialogu
   - Błąd:
     - Wyświetlenie toast błędu
     - Zamknięcie dialogu (plan pozostaje na liście)
6. Ustawienie `isDeleting = false`
7. Reset stanu: `setDeletePlanState({ selectedPlan: null, isDeleting: false })`

**Wynik**: Plan znika z listy (lub pozostaje przy błędzie), wyświetlenie powiadomienia

### 8.5. Anulowanie usunięcia

**Akcja**: Użytkownik klika "Anuluj" w dialogu lub kliknięcie poza dialogiem

**Przepływ**:

1. Event handler `onCancel` w `<DeleteConfirmDialog />`
2. Reset stanu: `setDeletePlanState({ selectedPlan: null, isDeleting: false })`
3. Zamknięcie dialogu

**Wynik**: Dialog zamyka się bez zmian w liście planów

### 8.6. Kliknięcie "Utwórz plan"

**Akcja**: Użytkownik klika przycisk "Utwórz plan"

**Przepływ**:

1. Event handler `onClick` w `<CreatePlanButton />`
2. Nawigacja do `/plans/new`

**Wynik**: Przekierowanie do formularza tworzenia nowego planu

### 8.7. Ponowienie próby po błędzie

**Akcja**: Użytkownik klika "Spróbuj ponownie" w `<ErrorState />`

**Przepływ**:

1. Event handler `onRetry` w `<ErrorState />`
2. Wywołanie `refetch()` z hook `useTripPlans`
3. Ponowne wywołanie `fetchPlans()`
4. Wyświetlenie `<LoadingSpinner />`
5. Obsługa odpowiedzi API (jak przy pierwszym załadowaniu)

**Wynik**: Ponowne pobranie listy planów lub kolejny błąd

## 9. Warunki i walidacja

### 9.1. Autentykacja (DashboardPage - Astro)

**Warunek**: Użytkownik musi być zalogowany

**Weryfikacja**:

```typescript
const {
  data: { user },
} = await locals.supabase.auth.getUser();

if (!user) {
  return Astro.redirect("/login");
}
```

**Wpływ**: Niezalogowany użytkownik nie ma dostępu do Dashboard

### 9.2. Stan ładowania (PlansList)

**Warunek**: `isLoading === true`

**Weryfikacja**:

```typescript
if (isLoading) {
  return <LoadingSpinner />;
}
```

**Wpływ**: Wyświetlenie spinnera zamiast listy planów

### 9.3. Stan błędu (PlansList)

**Warunek**: `error !== null`

**Weryfikacja**:

```typescript
if (error) {
  return <ErrorState error={error} onRetry={refetch} />;
}
```

**Wpływ**: Wyświetlenie komunikatu błędu i przycisku retry

### 9.4. Pusta lista planów (PlansList)

**Warunek**: `plans.length === 0 && !isLoading && !error`

**Weryfikacja**:

```typescript
if (plans.length === 0) {
  return <EmptyState onCreatePlan={() => navigate('/plans/new')} />;
}
```

**Wpływ**: Wyświetlenie EmptyState zamiast pustej listy

### 9.5. Walidacja dat w karcie planu (PlanCard)

**Warunek**: Daty muszą być w formacie YYYY-MM-DD i poprawnie parsowalne

**Weryfikacja**:

```typescript
const formatDateRange = (start: string, end: string): string => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return `${start} - ${end}`; // Fallback
    }

    return `${startDate.toLocaleDateString("pl-PL")} - ${endDate.toLocaleDateString("pl-PL")}`;
  } catch {
    return `${start} - ${end}`;
  }
};
```

**Wpływ**: Prawidłowe formatowanie dat lub fallback do raw string

### 9.6. Wyłączenie przycisku podczas usuwania (DeleteConfirmDialog)

**Warunek**: `isDeleting === true`

**Weryfikacja**:

```typescript
<Button
  variant="destructive"
  disabled={isDeleting}
  onClick={onConfirm}
>
  {isDeleting ? 'Usuwanie...' : 'Usuń'}
</Button>
```

**Wpływ**: Przycisk nieaktywny podczas operacji usuwania, zapobiega wielokrotnemu kliknięciu

### 9.7. Autoryzacja usunięcia planu (API)

**Warunek**: Tylko właściciel planu może go usunąć

**Weryfikacja** (na poziomie API):

```typescript
// W endpoint DELETE /api/trip-plans/:id
const {
  data: { user },
} = await locals.supabase.auth.getUser();
const { data: plan } = await supabase.from("trip_plans").select("user_id").eq("id", planId).single();

if (plan.user_id !== user.id) {
  return new Response(
    JSON.stringify({
      error: {
        code: "FORBIDDEN",
        message: "You don't have permission to delete this plan",
      },
    }),
    { status: 403 }
  );
}
```

**Wpływ**: Ochrona przed usunięciem cudzych planów

## 10. Obsługa błędów

### 10.1. Błąd 401 - Brak autoryzacji

**Przyczyna**: Sesja wygasła lub użytkownik niezalogowany

**Wykrywanie**:

```typescript
if (response.status === 401) {
  // ...
}
```

**Obsługa**:

1. Redirect do `/login`
2. Opcjonalnie: zapisanie intended URL w localStorage do przekierowania po zalogowaniu

**Komunikat**: Automatyczne przekierowanie (brak komunikatu)

### 10.2. Błąd 500 - Błąd serwera

**Przyczyna**: Błąd po stronie serwera (database, API)

**Wykrywanie**:

```typescript
if (response.status === 500) {
  // ...
}
```

**Obsługa**:

1. Ustawienie `error = "Wystąpił błąd serwera. Spróbuj ponownie później."`
2. Wyświetlenie `<ErrorState />`
3. Przycisk "Spróbuj ponownie" → `refetch()`
4. Logowanie błędu w console

**Komunikat**: "Wystąpił błąd serwera. Spróbuj ponownie później."

### 10.3. Błąd sieci

**Przyczyna**: Brak połączenia z internetem, timeout

**Wykrywanie**:

```typescript
try {
  const response = await fetch("/api/trip-plans");
} catch (err) {
  // Network error
}
```

**Obsługa**:

1. Ustawienie `error = "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."`
2. Wyświetlenie `<ErrorState />`
3. Przycisk "Spróbuj ponownie"

**Komunikat**: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."

### 10.4. Błąd usuwania planu

**Przyczyna**: Błąd API podczas DELETE (403, 404, 500)

**Wykrywanie**:

```typescript
const success = await deletePlan(planId);
if (!success) {
  // ...
}
```

**Obsługa**:

1. Wyświetlenie toast błędu
2. Plan pozostaje na liście
3. Zamknięcie dialogu
4. Nie blokowanie UI

**Komunikat** (toast): "Nie udało się usunąć planu. Spróbuj ponownie."

### 10.5. Błąd parsowania odpowiedzi

**Przyczyna**: Nieprawidłowy format JSON z API

**Wykrywanie**:

```typescript
try {
  const data = await response.json();
} catch (err) {
  // JSON parse error
}
```

**Obsługa**:

1. Ustawienie `error = "Otrzymano nieprawidłowe dane z serwera."`
2. Wyświetlenie `<ErrorState />`
3. Logowanie pełnej odpowiedzi w console dla debugowania

**Komunikat**: "Otrzymano nieprawidłowe dane z serwera."

### 10.6. Pusta lista planów

**Przyczyna**: Użytkownik nie ma jeszcze planów (nie jest błędem)

**Wykrywanie**:

```typescript
if (plans.length === 0 && !isLoading && !error) {
  // ...
}
```

**Obsługa**:

1. Wyświetlenie `<EmptyState />`
2. Call to action: "Utwórz swój pierwszy plan"
3. Pozytywny, zachęcający komunikat

**Komunikat**: "Nie masz jeszcze żadnych planów wycieczek. Zacznij planować swoją następną przygodę!"

### 10.7. Błąd 404 przy usuwaniu

**Przyczyna**: Plan został już usunięty (np. w innej sesji/urządzeniu)

**Wykrywanie**:

```typescript
if (response.status === 404) {
  // ...
}
```

**Obsługa**:

1. Wyświetlenie toast informacyjnego (nie błędu)
2. Usunięcie planu z lokalnego state (optimistic update)
3. Zamknięcie dialogu

**Komunikat** (toast): "Ten plan został już usunięty."

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska i typów

1. **Aktualizacja TripPlanDto w `src/types.ts`**:

   ```typescript
   export type TripPlanDto = Pick<
     Tables<"trip_plans">,
     | "id"
     | "destination"
     | "start_date"
     | "end_date"
     | "people_count"
     | "budget_type"
     | "source"
     | "created_at"
     | "updated_at"
   > & {
     plan_details: PlanDetailsDto;
   };
   ```

2. **Dodanie nowych typów ViewModel w `src/types.ts`** lub w osobnym pliku `src/types/dashboard.types.ts`:

   ```typescript
   export type TripPlanViewModel = TripPlanDto;

   export interface PlansListState {
     plans: TripPlanViewModel[];
     isLoading: boolean;
     error: string | null;
   }

   export interface DeletePlanState {
     selectedPlan: TripPlanViewModel | null;
     isDeleting: boolean;
   }
   ```

3. **Aktualizacja API endpoint `src/pages/api/trip-plans/index.ts`**:
   - Zmiana select query w GET handler aby zwracał `source`, `created_at`, `updated_at`:
   ```typescript
   const { data: tripPlans, error: dbError } = await locals.supabase
     .from("trip_plans")
     .select(
       "id, destination, start_date, end_date, people_count, budget_type, plan_details, source, created_at, updated_at"
     )
     .eq("user_id", user.id)
     .is("deleted_at", null)
     .order("start_date", { ascending: true });
   ```

### Krok 2: Utworzenie struktury plików

1. Utworzyć folder `src/components/dashboard/`
2. Utworzyć pliki komponentów:

   ```
   src/components/dashboard/
   ├── DashboardContent.tsx
   ├── Navbar.tsx
   ├── PlansList.tsx
   ├── PlanCard.tsx
   ├── CreatePlanButton.tsx
   ├── EmptyState.tsx
   ├── ErrorState.tsx
   ├── LoadingSpinner.tsx
   └── DeleteConfirmDialog.tsx
   ```

3. Utworzyć folder dla hooków: `src/hooks/`
4. Utworzyć plik `src/hooks/useTripPlans.ts`

### Krok 3: Implementacja custom hook useTripPlans

1. Utworzyć `src/hooks/useTripPlans.ts`
2. Zaimplementować logikę:
   - Stan: `plans`, `isLoading`, `error`
   - Funkcja `fetchPlans()` - GET /api/trip-plans
   - Funkcja `deletePlan(id)` - DELETE /api/trip-plans/:id
   - Funkcja `refetch()` - ponowne wywołanie fetchPlans
   - useEffect do automatycznego pobierania przy montowaniu
3. Dodać obsługę błędów (try-catch, status codes)
4. Export hook

### Krok 4: Implementacja komponentów prezentacyjnych (bottom-up)

#### 4.1. LoadingSpinner

1. Prosty komponent z animacją CSS lub Shadcn Spinner
2. Wycentrowany na stronie
3. Opcjonalny tekst "Ładowanie planów..."

#### 4.2. EmptyState

1. Ikona (np. z lucide-react: MapIcon)
2. Nagłówek i opis
3. Przycisk "Utwórz pierwszy plan"
4. Props: `onCreatePlan`

#### 4.3. ErrorState

1. Ikona błędu (np. AlertCircle z lucide-react)
2. Wyświetlenie komunikatu błędu z props
3. Przycisk "Spróbuj ponownie"
4. Props: `error: string`, `onRetry: () => void`

#### 4.4. Badge dla statusu planu

1. Wykorzystać Shadcn/ui Badge
2. Warianty:
   - "AI" → variant="secondary", kolor niebieski
   - "Edytowany" → variant="outline", kolor szary
3. Helper function do mapowania source → label

#### 4.5. PlanCard

1. Użyć Shadcn/ui Card component
2. Layout:
   - CardHeader: destination + Badge (status)
   - CardContent: daty, liczba osób, budżet, podsumowanie (X dni, Y aktywności)
   - CardFooter: przycisk "Zobacz szczegóły" + ikona usuń
3. Props: `plan`, `onClick`, `onDelete`
4. Dodać hover effects (Tailwind: `hover:shadow-lg transition`)
5. Responsywność: stack vertical na mobile, horizontal na desktop (opcjonalnie)
6. Helper functions:
   - `formatDateRange(start, end)` → "15 cze 2025 - 22 cze 2025"
   - `calculateDays(start, end)` → liczba dni
   - `countActivities(plan_details)` → łączna liczba aktywności

#### 4.6. DeleteConfirmDialog

1. Użyć Shadcn/ui AlertDialog
2. Props: `isOpen`, `plan`, `onConfirm`, `onCancel`, `isDeleting`
3. Wyświetlić: destination, daty planu
4. Przyciski:
   - "Anuluj" (variant="outline")
   - "Usuń" (variant="destructive", disabled={isDeleting})
5. Conditional rendering: tylko gdy `plan !== null`

#### 4.7. CreatePlanButton

1. Użyć Shadcn/ui Button
2. Ikona "+" (lucide-react: PlusIcon)
3. Responsywne pozycjonowanie:
   - Mobile: fixed bottom-right, floating action button (rounded-full)
   - Desktop: static, prominent button w prawym górnym rogu (obok Navbar) lub nad listą
4. Props: `onClick`

#### 4.8. Navbar

1. Layout: flex justify-between, sticky top-0
2. Lewa strona: Logo "Tripper" (link do `/`)
3. Prawa strona: Dropdown menu użytkownika
   - Avatar lub inicjały
   - Menu: Profil, Preferencje, Wyloguj
4. Użyć Shadcn/ui DropdownMenu
5. Props: opcjonalnie `user` dla wyświetlenia email

### Krok 5: Implementacja komponentu PlansList

1. Utworzyć `src/components/dashboard/PlansList.tsx`
2. Użyć hook `useTripPlans()`:
   ```typescript
   const { plans, isLoading, error, refetch } = useTripPlans();
   ```
3. Conditional rendering:
   ```typescript
   if (isLoading) return <LoadingSpinner />;
   if (error) return <ErrorState error={error} onRetry={refetch} />;
   if (plans.length === 0) return <EmptyState onCreatePlan={onCreatePlan} />;
   ```
4. Renderowanie listy planów:
   ```typescript
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
     {plans.map(plan => (
       <PlanCard
         key={plan.id}
         plan={plan}
         onClick={() => onPlanClick(plan.id)}
         onDelete={() => onDeleteClick(plan.id)}
       />
     ))}
   </div>
   ```
5. Props: `onPlanClick`, `onDeleteClick` (przekazane z rodzica)

### Krok 6: Implementacja głównego komponentu DashboardContent

1. Utworzyć `src/components/dashboard/DashboardContent.tsx`
2. Zarządzanie stanem:
   ```typescript
   const [deletePlanState, setDeletePlanState] = useState<DeletePlanState>({
     selectedPlan: null,
     isDeleting: false,
   });
   const { toast } = useToast();
   const navigate = useNavigate(); // lub router.push w zależności od routingu
   ```
3. Handler functions:

   ```typescript
   const handlePlanClick = (planId: string) => {
     navigate(`/plans/${planId}`);
   };

   const handleDeleteClick = (planId: string) => {
     const plan = plans.find((p) => p.id === planId);
     if (plan) {
       setDeletePlanState({ selectedPlan: plan, isDeleting: false });
     }
   };

   const handleDeleteConfirm = async () => {
     if (!deletePlanState.selectedPlan) return;

     setDeletePlanState((prev) => ({ ...prev, isDeleting: true }));

     const success = await deletePlan(deletePlanState.selectedPlan.id);

     if (success) {
       toast({
         title: "Plan usunięty",
         description: "Plan wycieczki został pomyślnie usunięty.",
       });
     } else {
       toast({
         title: "Błąd",
         description: "Nie udało się usunąć planu. Spróbuj ponownie.",
         variant: "destructive",
       });
     }

     setDeletePlanState({ selectedPlan: null, isDeleting: false });
   };

   const handleDeleteCancel = () => {
     setDeletePlanState({ selectedPlan: null, isDeleting: false });
   };

   const handleCreatePlan = () => {
     navigate("/plans/new");
   };
   ```

4. Renderowanie struktury:
   ```typescript
   return (
     <>
       <Navbar />
       <main className="container mx-auto px-4 py-8">
         <PlansList
           onPlanClick={handlePlanClick}
           onDeleteClick={handleDeleteClick}
         />
         <CreatePlanButton onClick={handleCreatePlan} />
       </main>
       <DeleteConfirmDialog
         isOpen={deletePlanState.selectedPlan !== null}
         plan={deletePlanState.selectedPlan}
         onConfirm={handleDeleteConfirm}
         onCancel={handleDeleteCancel}
         isDeleting={deletePlanState.isDeleting}
       />
       <Toaster />
     </>
   );
   ```

### Krok 7: Utworzenie strony Astro index.astro

1. Utworzyć/zaktualizować `src/pages/index.astro`
2. Dodać server-side auth check:

   ```astro
   ---
   const {
     data: { user },
     error,
   } = await Astro.locals.supabase.auth.getUser();

   if (error || !user) {
     return Astro.redirect("/login");
   }
   ---
   ```

3. Layout i meta tags:
   ```astro
   <html lang="pl">
     <head>
       <meta charset="utf-8" />
       <meta name="viewport" content="width=device-width, initial-scale=1" />
       <title>Dashboard - Tripper</title>
     </head>
     <body>
       <DashboardContent client:load />
     </body>
   </html>
   ```
4. Import komponentu:
   ```astro
   ---
   import DashboardContent from "../components/dashboard/DashboardContent";
   ---
   ```

### Krok 8: Implementacja endpoint DELETE /api/trip-plans/[id].ts

1. Utworzyć plik `src/pages/api/trip-plans/[id].ts`
2. Zaimplementować DELETE handler:

   ```typescript
   export const DELETE: APIRoute = async ({ params, locals }) => {
     try {
       // 1. Auth check
       const {
         data: { user },
         error: authError,
       } = await locals.supabase.auth.getUser();
       if (authError || !user) {
         return new Response(
           JSON.stringify({
             error: { code: "UNAUTHORIZED", message: "Authentication required" },
           }),
           { status: 401 }
         );
       }

       const { id } = params;

       // 2. Soft delete
       const { error: deleteError } = await locals.supabase
         .from("trip_plans")
         .update({
           deleted_at: new Date().toISOString(),
           deleted_by: user.id,
         })
         .eq("id", id)
         .eq("user_id", user.id); // Ensure user owns the plan

       if (deleteError) {
         console.error("Delete error:", deleteError);
         return new Response(
           JSON.stringify({
             error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to delete plan" },
           }),
           { status: 500 }
         );
       }

       return new Response(JSON.stringify({ data: null }), { status: 200 });
     } catch (error) {
       console.error("Unexpected error:", error);
       return new Response(
         JSON.stringify({
           error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
         }),
         { status: 500 }
       );
     }
   };
   ```

### Krok 9: Styling i responsywność

1. **Tailwind classes dla mobile-first**:
   - Container: `container mx-auto px-4`
   - Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
   - Spacing: używać `space-y-4` dla vertical spacing

2. **PlanCard responsywność**:
   - Card padding: `p-4 md:p-6`
   - Font sizes: `text-base md:text-lg` dla destination
   - Buttons: stack vertical na mobile, horizontal na desktop

3. **CreatePlanButton**:

   ```typescript
   <Button
     className="fixed bottom-4 right-4 md:static md:mb-4 rounded-full md:rounded-md shadow-lg"
     size="lg"
     onClick={onClick}
   >
     <PlusIcon className="mr-0 md:mr-2" />
     <span className="hidden md:inline">Utwórz plan</span>
   </Button>
   ```

4. **Navbar**:
   - Sticky positioning: `sticky top-0 z-50 bg-background border-b`
   - Padding: `px-4 md:px-8 py-4`

5. **Test na różnych rozdzielczościach**:
   - 375px (mobile)
   - 768px (tablet)
   - 1024px (desktop)

### Krok 10: Testowanie i debugowanie

1. **Testy manualne**:
   - Załadowanie strony z planami
   - Załadowanie strony bez planów (empty state)
   - Kliknięcie karty planu → sprawdzić przekierowanie
   - Usunięcie planu → sprawdzić dialog, sukces, toast
   - Anulowanie usunięcia → sprawdzić zamknięcie dialogu
   - Błąd sieci → sprawdzić error state i retry
   - Wylogowanie → sprawdzić przekierowanie

2. **Test responsywności**:
   - DevTools responsive mode
   - Wszystkie breakpointy (mobile, tablet, desktop)
   - Orientacja landscape i portrait na mobile

3. **Test accessibility**:
   - Nawigacja klawiaturą (Tab, Enter)
   - Screen reader (opcjonalnie)
   - Focus states na wszystkich interaktywnych elementach
   - Aria labels dla ikon bez tekstu

4. **Debugowanie**:
   - Console logs w hook useTripPlans
   - Network tab w DevTools - sprawdzić requesty
   - React DevTools - sprawdzić stan komponentów

### Krok 11: Optymalizacje i polish

1. **Loading states**:
   - Skeleton loading dla kart planów (opcjonalnie)
   - Smooth transitions (Tailwind: `transition-all duration-300`)

2. **Error handling**:
   - Retry logic z exponential backoff (opcjonalnie)
   - Offline detection

3. **Performance**:
   - Memoizacja komponentów PlanCard: `React.memo()`
   - useMemo dla expensive calculations (formatowanie dat)
   - useCallback dla handler functions przekazywanych do dzieci

4. **UX improvements**:
   - Animacje przy usuwaniu karty (fade out)
   - Potwierdzenie przed opuszczeniem strony jeśli operacja w toku (opcjonalnie)
   - Toast notifications ze slideIn animation

5. **Accessibility**:
   - Alt texts dla ikon
   - Proper heading hierarchy (h1, h2, h3)
   - Focus management w dialogu usuwania

### Krok 12: Dokumentacja i code review

1. **Dodać komentarze JSDoc** dla:
   - Custom hook useTripPlans
   - Główne komponenty (props interfaces)
   - Helper functions

2. **README** (opcjonalnie):
   - Opis komponentów Dashboard
   - Diagram przepływu danych
   - Instrukcje dla developerów

3. **Code review checklist**:
   - ✅ TypeScript bez errorów
   - ✅ Wszystkie komponenty mają poprawne typy props
   - ✅ Error handling w miejscach API calls
   - ✅ Accessibility (keyboard navigation, aria labels)
   - ✅ Responsywność na wszystkich breakpointach
   - ✅ Loading i error states
   - ✅ No console errors w przeglądarce

4. **Git commit**:

   ```bash
   git add .
   git commit -m "feat: implement dashboard view with trip plans list

   - Add GET /api/trip-plans integration
   - Add DELETE /api/trip-plans/:id endpoint
   - Implement PlanCard, PlansList, and supporting components
   - Add useTripPlans custom hook for state management
   - Implement delete confirmation dialog
   - Add empty state and error handling
   - Mobile-first responsive design
   - Update TripPlanDto to include source, created_at, updated_at"
   ```

---

## Podsumowanie

Plan implementacji obejmuje wszystkie aspekty widoku Dashboard:

1. ✅ Routing i autentykacja
2. ✅ Struktura komponentów i hierarchia
3. ✅ Zarządzanie stanem (custom hook)
4. ✅ Integracja API (GET i DELETE)
5. ✅ Interakcje użytkownika
6. ✅ Walidacja i obsługa błędów
7. ✅ Responsywność mobile-first
8. ✅ Accessibility
9. ✅ Szczegółowe kroki implementacji

**Ważne uwagi**:

- Endpoint DELETE /api/trip-plans/:id wymaga implementacji
- TripPlanDto wymaga aktualizacji o pola: source, created_at, updated_at
- Należy przetestować na różnych rozdzielczościach (<400px, tablet, desktop)
- Infinite scroll planowany na przyszłość (>20 planów)
