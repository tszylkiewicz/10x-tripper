# Plan implementacji widoku szczegółów planu wycieczki

## 1. Przegląd

Widok szczegółów planu wycieczki umożliwia użytkownikowi przeglądanie i edycję zapisanego planu podróży. Użytkownik może wyświetlić wszystkie szczegóły planu (cel podróży, daty, dni z aktywnościami, zakwaterowanie), przełączyć się w tryb edycji, dokonać zmian w planie oraz zapisać je lub usunąć cały plan. Każda edycja automatycznie zmienia status planu na "Edytowany" (jeśli był wcześniej "AI"). Widok jest kluczowy dla realizacji user story US-008.

## 2. Routing widoku

**Ścieżka:** `/trip-plans/[id]`

**Parametry URL:**

- `id` (wymagany, uuid) - identyfikator planu wycieczki

**Przykład:** `/trip-plans/123e4567-e89b-12d3-a456-426614174000`

## 3. Struktura komponentów

```
TripPlanDetailsPage (src/pages/trip-plans/[id].astro)
└── TripPlanDetailsView (React component - główny kontener)
    ├── LoadingState (podczas ładowania danych)
    ├── ErrorState (w przypadku błędu)
    └── TripPlanContent (po załadowaniu danych)
        ├── TripPlanHeader
        │   ├── Metadata (destination, dates, people_count, budget_type)
        │   └── ActionButtons (Edit/Save/Cancel/Delete)
        ├── TripPlanBody
        │   ├── PlanDaysList
        │   │   └── PlanDay (dla każdego dnia) - powtarzalny
        │   │       ├── DayHeader (day number, date)
        │   │       └── ActivitiesList
        │   │           └── ActivityCard (dla każdej aktywności) - powtarzalny
        │   │               ├── ActivityTime
        │   │               ├── ActivityTitle
        │   │               ├── ActivityDescription
        │   │               ├── ActivityLocation
        │   │               ├── ActivityCost (optional)
        │   │               ├── ActivityDuration (optional)
        │   │               └── ActivityActions (Edit/Delete w trybie edycji)
        │   └── AccommodationSection (opcjonalna)
        │       ├── AccommodationInfo (name, address, dates)
        │       └── AccommodationDetails (cost, booking_url)
        └── DeleteConfirmDialog (modal)
```

## 4. Szczegóły komponentów

### 4.1. TripPlanDetailsView

**Opis:** Główny komponent zarządzający stanem całego widoku. Odpowiada za pobieranie danych z API, zarządzanie trybem edycji, zapisywanie zmian i obsługę usuwania planu.

**Główne elementy:**

- Kontener z warunkowym renderowaniem: LoadingState, ErrorState lub TripPlanContent
- Logika pobierania danych (useEffect + fetch)
- Logika zarządzania stanem edycji
- Obsługa zapisywania zmian (PATCH request)
- Obsługa usuwania planu

**Obsługiwane interakcje:**

- Przełączanie trybu edycji (włączenie/wyłączenie)
- Zapisywanie zmian
- Anulowanie edycji
- Usuwanie planu
- Odświeżanie danych po zapisie

**Obsługiwana walidacja:**

- Sprawdzenie, czy wszystkie wymagane pola są wypełnione przed zapisem
- Walidacja dat (end_date >= start_date)
- Walidacja liczby osób (>= 1)
- Walidacja struktury plan_details (niepuste dni, aktywności)

**Typy:**

- `TripPlanDto` - dane planu z API
- `UpdateTripPlanDto` - dane do wysłania w PATCH request
- `ApiSuccessResponse<TripPlanDto>` - odpowiedź sukcesu z API
- `ApiErrorResponse` - odpowiedź błędu z API
- `TripPlanViewState` (nowy) - stan widoku

**Propsy:** Brak (komponent główny, otrzymuje id z URL params)

### 4.2. TripPlanHeader

**Opis:** Komponent wyświetlający nagłówek planu z podstawowymi metadanymi i przyciskami akcji. W trybie edycji umożliwia edycję podstawowych pól (destination, dates, people_count, budget_type).

**Główne elementy:**

- Heading (h1) z destination
- Sekcja dat: start_date - end_date
- Metadane: people_count osób, budget_type
- Grupa przycisków akcji:
  - Tryb podglądu: Button "Edytuj", Button "Usuń"
  - Tryb edycji: Button "Zapisz", Button "Anuluj"
- W trybie edycji: Input fields dla destination, date inputs, number input, select dla budget_type

**Obsługiwane interakcje:**

- Kliknięcie "Edytuj" → wywołanie onEdit()
- Kliknięcie "Usuń" → wywołanie onDelete()
- Kliknięcie "Zapisz" → wywołanie onSave()
- Kliknięcie "Anuluj" → wywołanie onCancel()
- Zmiana wartości w polach formularza → wywołanie onFieldChange(field, value)

**Obsługiwana walidacja:**

- destination: wymagane, min 1 znak
- start_date: wymagane, format YYYY-MM-DD
- end_date: wymagane, format YYYY-MM-DD, musi być >= start_date
- people_count: wymagane, liczba całkowita >= 1
- budget_type: wymagane, niepuste

**Typy:**

- `TripPlanMetadata` (nowy) - podzbiór TripPlanDto z polami: destination, start_date, end_date, people_count, budget_type
- `ValidationErrors` (nowy) - mapa błędów walidacji

**Propsy:**

```typescript
interface TripPlanHeaderProps {
  destination: string;
  startDate: string;
  endDate: string;
  peopleCount: number;
  budgetType: string;
  isEditMode: boolean;
  validationErrors?: ValidationErrors;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
  onFieldChange: (field: keyof TripPlanMetadata, value: string | number) => void;
}
```

### 4.3. PlanDay

**Opis:** Komponent reprezentujący jeden dzień w planie wycieczki. Wyświetla nagłówek dnia (numer dnia, data) oraz listę aktywności. W trybie edycji umożliwia dodawanie nowych aktywności i usuwanie całego dnia.

**Główne elementy:**

- Sekcja dnia (section/card)
- Nagłówek: "Dzień {day} - {date}" (h2 lub h3)
- W trybie edycji: Button "Dodaj aktywność", Button "Usuń dzień"
- Lista aktywności (ActivitiesList)
- W trybie edycji: Formularz dodawania aktywności (warunkowy)

**Obsługiwane interakcje:**

- Kliknięcie "Dodaj aktywność" → pokazanie formularza nowej aktywności
- Kliknięcie "Usuń dzień" → wywołanie onDeleteDay(dayIndex)
- Zapisanie nowej aktywności → wywołanie onAddActivity(dayIndex, activity)

**Obsługiwana walidacja:**

- Dzień musi mieć co najmniej jedną aktywność (ostrzeżenie przy próbie usunięcia ostatniej)
- Nowa aktywność musi spełniać wymagania ActivityDto

**Typy:**

- `DayDto` - struktura dnia z API
- `ActivityFormData` (nowy) - dane formularza nowej aktywności

**Propsy:**

```typescript
interface PlanDayProps {
  day: DayDto;
  dayIndex: number;
  isEditMode: boolean;
  onUpdateActivity: (dayIndex: number, activityIndex: number, activity: ActivityDto) => void;
  onDeleteActivity: (dayIndex: number, activityIndex: number) => void;
  onAddActivity: (dayIndex: number, activity: ActivityDto) => void;
  onDeleteDay: (dayIndex: number) => void;
}
```

### 4.4. ActivityCard

**Opis:** Komponent wyświetlający szczegóły pojedynczej aktywności. W trybie podglądu wyświetla wszystkie informacje o aktywności, w trybie edycji zamienia się w formularz umożliwiający edycję wszystkich pól.

**Główne elementy:**

- Card/Container aktywności
- Sekcja czasu (time) - wyróżniona wizualnie
- Tytuł aktywności (title) - h4 lub strong
- Opis (description) - paragraph
- Lokalizacja (location) - paragraph z ikoną lokalizacji
- Czas trwania (duration) - opcjonalny, small text
- Koszt (estimated_cost) - opcjonalny, wyróżniony
- Kategoria (category) - opcjonalny, badge/tag
- W trybie edycji: formularz z input/textarea dla każdego pola
- W trybie edycji: przyciski "Zapisz zmiany" i "Usuń aktywność"

**Obsługiwane interakcje:**

- W trybie edycji: zmiana wartości pól → aktualizacja lokalnego stanu
- Kliknięcie "Zapisz zmiany" → wywołanie onUpdate(updatedActivity)
- Kliknięcie "Usuń aktywność" → wywołanie onDelete()

**Obsługiwana walidacja:**

- time: wymagane, format HH:MM
- title: wymagane, min 1 znak, max 200 znaków
- description: wymagane, min 1 znak
- location: wymagane, min 1 znak
- estimated_cost: opcjonalne, liczba >= 0
- duration: opcjonalne, string
- category: opcjonalne, string

**Typy:**

- `ActivityDto` - struktura aktywności z API
- `ActivityFormData` (nowy) - lokalna kopia ActivityDto do edycji

**Propsy:**

```typescript
interface ActivityCardProps {
  activity: ActivityDto;
  isEditMode: boolean;
  validationErrors?: ValidationErrors;
  onUpdate: (activity: ActivityDto) => void;
  onDelete: () => void;
}
```

### 4.5. AccommodationSection

**Opis:** Komponent wyświetlający informacje o zakwaterowaniu (jeśli zostało dodane do planu). W trybie edycji umożliwia modyfikację wszystkich pól zakwaterowania lub usunięcie sekcji zakwaterowania.

**Główne elementy:**

- Sekcja/Card zakwaterowania (jeśli accommodation istnieje)
- Nagłówek "Zakwaterowanie" (h3)
- Nazwa hotelu/zakwaterowania (name) - strong/h4
- Adres (address) - paragraph z ikoną
- Daty: Check-in (check_in), Check-out (check_out)
- Szacunkowy koszt (estimated_cost) - opcjonalny
- Link do rezerwacji (booking_url) - opcjonalny, jako link
- W trybie edycji: formularz z input dla każdego pola
- W trybie edycji: przyciski "Zapisz" i "Usuń zakwaterowanie"
- Jeśli brak accommodation i tryb edycji: Button "Dodaj zakwaterowanie"

**Obsługiwane interakcje:**

- Kliknięcie "Dodaj zakwaterowanie" → pokazanie formularza
- W trybie edycji: zmiana pól → aktualizacja lokalnego stanu
- Kliknięcie "Zapisz" → wywołanie onUpdate(accommodation)
- Kliknięcie "Usuń zakwaterowanie" → wywołanie onRemove()

**Obsługiwana walidacja:**

- name: wymagane, min 1 znak
- address: wymagane, min 1 znak
- check_in: wymagane, format YYYY-MM-DD
- check_out: wymagane, format YYYY-MM-DD, >= check_in
- estimated_cost: opcjonalne, liczba >= 0
- booking_url: opcjonalne, prawidłowy URL

**Typy:**

- `AccommodationDto` - struktura zakwaterowania z API
- `AccommodationFormData` (nowy) - lokalna kopia do edycji

**Propsy:**

```typescript
interface AccommodationSectionProps {
  accommodation?: AccommodationDto | null;
  isEditMode: boolean;
  validationErrors?: ValidationErrors;
  onUpdate: (accommodation: AccommodationDto) => void;
  onRemove: () => void;
  onAdd: (accommodation: AccommodationDto) => void;
}
```

### 4.6. DeleteConfirmDialog

**Opis:** Modal z potwierdzeniem usunięcia planu wycieczki. Wyświetla ostrzeżenie o nieodwracalności operacji i wymaga potwierdzenia od użytkownika.

**Główne elementy:**

- Dialog/Modal overlay
- Nagłówek: "Usunąć plan wycieczki?" (h2)
- Treść: Komunikat ostrzegawczy z nazwą planu (destination)
- Przyciski akcji:
  - Button "Anuluj" (secondary)
  - Button "Usuń" (destructive/danger)

**Obsługiwane interakcje:**

- Kliknięcie "Anuluj" → wywołanie onCancel()
- Kliknięcie "Usuń" → wywołanie onConfirm()
- Kliknięcie poza dialog lub ESC → wywołanie onCancel()

**Obsługiwana walidacja:** Brak (potwierdzenie akcji)

**Typy:**

- Brak dedykowanych typów

**Propsy:**

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  planName: string; // destination dla identyfikacji
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 4.7. LoadingState

**Opis:** Komponent wyświetlający stan ładowania podczas pobierania danych planu z API.

**Główne elementy:**

- Kontener centrowany
- Spinner/loading indicator
- Tekst "Ładowanie planu..."

**Obsługiwane interakcje:** Brak

**Obsługiwana walidacja:** Brak

**Typy:** Brak

**Propsy:** Brak

### 4.8. ErrorState

**Opis:** Komponent wyświetlający komunikat błędu, gdy nie udało się pobrać danych planu.

**Główne elementy:**

- Kontener centrowany
- Ikona błędu
- Komunikat błędu (zależny od typu błędu)
- Button "Spróbuj ponownie" lub Button "Wróć do listy planów"

**Obsługiwane interakcje:**

- Kliknięcie "Spróbuj ponownie" → wywołanie onRetry()
- Kliknięcie "Wróć do listy planów" → nawigacja do /trip-plans

**Obsługiwana walidacja:** Brak

**Typy:**

- `ErrorType` (nowy) - typ błędu: "not-found" | "unauthorized" | "server-error" | "network-error"

**Propsy:**

```typescript
interface ErrorStateProps {
  errorType: ErrorType;
  errorMessage?: string;
  onRetry?: () => void;
}
```

## 5. Typy

### 5.1. Typy istniejące (z src/types.ts)

Wykorzystywane bezpośrednio:

```typescript
// Główny typ planu
type TripPlanDto = {
  id: string;
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
  plan_details: PlanDetailsDto;
};

// Struktura szczegółów planu
interface PlanDetailsDto {
  days: DayDto[];
  accommodation?: AccommodationDto;
  notes?: string;
  total_estimated_cost?: number;
  accepted_at?: string;
}

// Dzień w planie
interface DayDto {
  day: number;
  date: string;
  activities: ActivityDto[];
}

// Aktywność w dniu
interface ActivityDto {
  time: string;
  title: string;
  description: string;
  location: string;
  estimated_cost?: number;
  duration?: string;
  category?: string;
}

// Zakwaterowanie
interface AccommodationDto {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  estimated_cost?: number;
  booking_url?: string;
}

// DTO do aktualizacji planu (wszystkie pola opcjonalne)
interface UpdateTripPlanDto {
  destination?: string;
  start_date?: string;
  end_date?: string;
  people_count?: number;
  budget_type?: string;
  plan_details?: PlanDetailsDto;
}

// Odpowiedzi API
interface ApiSuccessResponse<T> {
  data: T;
}

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 5.2. Typy nowe (ViewModels i pomocnicze)

```typescript
// Stan głównego widoku
interface TripPlanViewState {
  originalPlan: TripPlanDto | null;
  editedPlan: TripPlanDto | null;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  isEditMode: boolean;
  showDeleteDialog: boolean;
  error: ViewError | null;
}

// Błąd widoku
interface ViewError {
  type: ErrorType;
  message: string;
  details?: Record<string, unknown>;
}

// Typ błędu
type ErrorType = "not-found" | "unauthorized" | "server-error" | "network-error" | "validation-error";

// Błędy walidacji (pole -> komunikat)
type ValidationErrors = Record<string, string>;

// Metadane planu (dla TripPlanHeader)
interface TripPlanMetadata {
  destination: string;
  start_date: string;
  end_date: string;
  people_count: number;
  budget_type: string;
}

// Dane formularza aktywności (do edycji/dodawania)
interface ActivityFormData extends ActivityDto {
  isNew?: boolean; // czy to nowa aktywność
  isEditing?: boolean; // czy jest w trakcie edycji
}

// Dane formularza zakwaterowania
interface AccommodationFormData extends AccommodationDto {
  isEditing?: boolean;
}

// Akcje edycji planu (dla reducera lub stanu)
type PlanEditAction =
  | { type: "UPDATE_METADATA"; payload: Partial<TripPlanMetadata> }
  | { type: "UPDATE_ACTIVITY"; payload: { dayIndex: number; activityIndex: number; activity: ActivityDto } }
  | { type: "DELETE_ACTIVITY"; payload: { dayIndex: number; activityIndex: number } }
  | { type: "ADD_ACTIVITY"; payload: { dayIndex: number; activity: ActivityDto } }
  | { type: "DELETE_DAY"; payload: { dayIndex: number } }
  | { type: "ADD_DAY"; payload: DayDto }
  | { type: "UPDATE_ACCOMMODATION"; payload: AccommodationDto }
  | { type: "REMOVE_ACCOMMODATION" }
  | { type: "ADD_ACCOMMODATION"; payload: AccommodationDto };
```

## 6. Zarządzanie stanem

### 6.1. Stan główny (w TripPlanDetailsView)

Stan główny będzie zarządzany za pomocą `useState` lub `useReducer` (preferowany ze względu na złożoność):

```typescript
const [state, dispatch] = useReducer(tripPlanReducer, initialState);

// initialState
const initialState: TripPlanViewState = {
  originalPlan: null,
  editedPlan: null,
  isLoading: true,
  isSaving: false,
  isDeleting: false,
  isEditMode: false,
  showDeleteDialog: false,
  error: null,
};
```

### 6.2. Custom Hook: useTripPlanDetails

Hook zarządzający pobieraniem i mutacjami danych planu:

```typescript
function useTripPlanDetails(planId: string) {
  const [state, dispatch] = useReducer(tripPlanReducer, initialState);

  // Pobranie danych planu
  useEffect(() => {
    fetchTripPlan(planId);
  }, [planId]);

  const fetchTripPlan = async (id: string) => {
    dispatch({ type: "FETCH_START" });
    try {
      const response = await fetch(`/api/trip-plans/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("NOT_FOUND");
        }
        if (response.status === 401) {
          throw new Error("UNAUTHORIZED");
        }
        throw new Error("SERVER_ERROR");
      }

      const data: ApiSuccessResponse<TripPlanDto> = await response.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data.data });
    } catch (error) {
      dispatch({ type: "FETCH_ERROR", payload: mapErrorToViewError(error) });
    }
  };

  const updateTripPlan = async (updates: UpdateTripPlanDto) => {
    dispatch({ type: "SAVE_START" });
    try {
      const response = await fetch(`/api/trip-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw errorData;
      }

      const data: ApiSuccessResponse<TripPlanDto> = await response.json();
      dispatch({ type: "SAVE_SUCCESS", payload: data.data });
    } catch (error) {
      dispatch({ type: "SAVE_ERROR", payload: mapErrorToViewError(error) });
    }
  };

  const deleteTripPlan = async () => {
    dispatch({ type: "DELETE_START" });
    try {
      const response = await fetch(`/api/trip-plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("DELETE_FAILED");
      }

      dispatch({ type: "DELETE_SUCCESS" });
      // Przekierowanie do listy planów
      window.location.href = "/trip-plans";
    } catch (error) {
      dispatch({ type: "DELETE_ERROR", payload: mapErrorToViewError(error) });
    }
  };

  return {
    state,
    dispatch,
    updateTripPlan,
    deleteTripPlan,
    refetch: () => fetchTripPlan(planId),
  };
}
```

### 6.3. Reducer: tripPlanReducer

```typescript
function tripPlanReducer(state: TripPlanViewState, action: TripPlanAction): TripPlanViewState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        originalPlan: action.payload,
        editedPlan: action.payload,
        error: null,
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };

    case "ENTER_EDIT_MODE":
      return {
        ...state,
        isEditMode: true,
        editedPlan: JSON.parse(JSON.stringify(state.originalPlan)), // deep copy
      };

    case "EXIT_EDIT_MODE":
      return {
        ...state,
        isEditMode: false,
        editedPlan: state.originalPlan,
      };

    case "UPDATE_EDITED_PLAN":
      return {
        ...state,
        editedPlan: action.payload,
      };

    case "SAVE_START":
      return { ...state, isSaving: true, error: null };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        isEditMode: false,
        originalPlan: action.payload,
        editedPlan: action.payload,
        error: null,
      };

    case "SAVE_ERROR":
      return { ...state, isSaving: false, error: action.payload };

    case "DELETE_START":
      return { ...state, isDeleting: true, error: null };

    case "DELETE_SUCCESS":
      return { ...state, isDeleting: false };

    case "DELETE_ERROR":
      return { ...state, isDeleting: false, error: action.payload };

    case "SHOW_DELETE_DIALOG":
      return { ...state, showDeleteDialog: true };

    case "HIDE_DELETE_DIALOG":
      return { ...state, showDeleteDialog: false };

    default:
      return state;
  }
}
```

### 6.4. Zarządzanie lokalnym stanem w komponentach potomnych

Komponenty takie jak ActivityCard i AccommodationSection będą zarządzać lokalnym stanem formularza podczas edycji, a następnie przekazywać zaktualizowane dane do rodzica przez callbacki (onUpdate, onDelete, etc.).

## 7. Integracja API

### 7.1. GET /api/trip-plans/:id

**Kiedy:** Przy montowaniu komponentu TripPlanDetailsView

**Request:**

- Metoda: GET
- URL: `/api/trip-plans/${id}`
- Headers: `Content-Type: application/json`
- Body: brak

**Response Success (200):**

```typescript
ApiSuccessResponse<TripPlanDto>
// Struktura:
{
  data: {
    id: string;
    destination: string;
    start_date: string;
    end_date: string;
    people_count: number;
    budget_type: string;
    plan_details: {
      days: DayDto[];
      accommodation?: AccommodationDto;
      notes?: string;
      total_estimated_cost?: number;
      accepted_at?: string;
    }
  }
}
```

**Response Error:**

- `401 Unauthorized`: Przekierowanie do /login
- `404 Not Found`: Wyświetlenie ErrorState z typem "not-found"
- `500 Server Error`: Wyświetlenie ErrorState z typem "server-error"

### 7.2. PATCH /api/trip-plans/:id

**Kiedy:** Przy zapisywaniu zmian w trybie edycji (kliknięcie "Zapisz")

**Request:**

- Metoda: PATCH
- URL: `/api/trip-plans/${id}`
- Headers: `Content-Type: application/json`
- Body: `UpdateTripPlanDto` (wszystkie pola opcjonalne)

```typescript
UpdateTripPlanDto
// Przykład:
{
  destination?: string;
  start_date?: string;
  end_date?: string;
  people_count?: number;
  budget_type?: string;
  plan_details?: PlanDetailsDto;
}
```

**Response Success (200):**

```typescript
ApiSuccessResponse<TripPlanDto>;
// Zwraca zaktualizowany plan (taka sama struktura jak GET)
```

**Response Error:**

- `400 Bad Request`: Wyświetlenie błędów walidacji z `error.details`
- `401 Unauthorized`: Przekierowanie do /login
- `404 Not Found`: Wyświetlenie ErrorState
- `500 Server Error`: Wyświetlenie ErrorState

**Uwaga:** Backend automatycznie zmienia `source` na "ai-edited" jeśli modyfikowany jest `plan_details`.

### 7.3. DELETE /api/trip-plans/:id

**Kiedy:** Po potwierdzeniu usunięcia w DeleteConfirmDialog

**Request:**

- Metoda: DELETE
- URL: `/api/trip-plans/${id}`
- Headers: `Content-Type: application/json`
- Body: brak

**Response Success (200 lub 204):**

```typescript
ApiSuccessResponse<{ id: string }>;
// lub brak body (204 No Content)
```

**Response Error:**

- `401 Unauthorized`: Przekierowanie do /login
- `404 Not Found`: Wyświetlenie komunikatu błędu
- `500 Server Error`: Wyświetlenie komunikatu błędu

**Uwaga:** Endpoint DELETE może nie istnieć - w takim przypadku należy go dodać w `src/pages/api/trip-plans/[id].ts`

## 8. Interakcje użytkownika

### 8.1. Wejście na stronę szczegółów planu

**Scenariusz:**

1. Użytkownik klika plan na liście (`/trip-plans`) lub wpisuje URL `/trip-plans/:id`
2. System wyświetla LoadingState
3. System wykonuje GET request do `/api/trip-plans/:id`
4. **Sukces:** Wyświetla TripPlanContent z danymi planu w trybie podglądu
5. **Błąd 404:** Wyświetla ErrorState "Plan nie został znaleziony"
6. **Błąd 401:** Przekierowanie do /login
7. **Błąd sieciowy:** Wyświetla ErrorState z opcją "Spróbuj ponownie"

### 8.2. Przełączenie w tryb edycji

**Scenariusz:**

1. Użytkownik klika przycisk "Edytuj" w TripPlanHeader
2. System wywołuje `dispatch({ type: "ENTER_EDIT_MODE" })`
3. Tworzona jest głęboka kopia `originalPlan` → `editedPlan`
4. Przyciski "Edytuj" i "Usuń" zmieniają się na "Zapisz" i "Anuluj"
5. Wszystkie pola stają się edytowalne (inputy, textareas, selects)
6. Pojawiają się dodatkowe przyciski akcji (Dodaj aktywność, Usuń dzień, etc.)

### 8.3. Edycja podstawowych pól (metadata)

**Scenariusz:**

1. Użytkownik zmienia wartość w polu (np. destination, people_count)
2. System wywołuje `onFieldChange(field, value)`
3. Aktualizowany jest `editedPlan` w stanie
4. Wykonywana jest walidacja inline (jeśli zaimplementowana)
5. Jeśli błąd walidacji: wyświetla się komunikat pod polem
6. Zmiany są tymczasowe (tylko w stanie lokalnym)

### 8.4. Edycja aktywności

**Scenariusz:**

1. Użytkownik klika na ActivityCard lub pole w ActivityCard w trybie edycji
2. Pola aktywności zamieniają się w inputy/textareas
3. Użytkownik zmienia wartości (time, title, description, location, etc.)
4. Zmiany aktualizują lokalny stan ActivityCard
5. Po opuszczeniu pola lub kliknięciu "Zapisz zmiany aktywności":
   - Wykonywana jest walidacja
   - Jeśli OK: wywołanie `onUpdate(dayIndex, activityIndex, updatedActivity)`
   - Jeśli błąd: wyświetlenie komunikatów walidacji
6. `editedPlan.plan_details.days[dayIndex].activities[activityIndex]` zostaje zaktualizowany

### 8.5. Dodanie nowej aktywności

**Scenariusz:**

1. Użytkownik klika "Dodaj aktywność" w PlanDay
2. Pojawia się pusty formularz aktywności (ActivityCard w trybie "new")
3. Użytkownik wypełnia wymagane pola
4. Kliknięcie "Zapisz nową aktywność":
   - Walidacja wszystkich pól
   - Jeśli OK: wywołanie `onAddActivity(dayIndex, newActivity)`
   - Nowa aktywność dodawana do `editedPlan.plan_details.days[dayIndex].activities`
5. Formularz znika, nowa aktywność pojawia się na liście

### 8.6. Usunięcie aktywności

**Scenariusz:**

1. Użytkownik klika przycisk "Usuń" przy aktywności (w trybie edycji)
2. Pojawia się inline confirm lub natychmiastowe usunięcie (do decyzji UX)
3. Wywołanie `onDeleteActivity(dayIndex, activityIndex)`
4. Aktywność usuwana z `editedPlan.plan_details.days[dayIndex].activities`
5. **Warunek:** Jeśli to ostatnia aktywność w dniu, wyświetla się ostrzeżenie lub blokada

### 8.7. Edycja zakwaterowania

**Scenariusz:**

1. Użytkownik klika na AccommodationSection lub pola w trybie edycji
2. Pola zamieniają się w inputy
3. Użytkownik zmienia wartości (name, address, dates, cost, url)
4. Zmiany aktualizują lokalny stan
5. Kliknięcie "Zapisz zmiany":
   - Walidacja
   - Wywołanie `onUpdate(updatedAccommodation)`
   - Aktualizacja `editedPlan.plan_details.accommodation`

### 8.8. Zapisanie zmian

**Scenariusz:**

1. Użytkownik klika przycisk "Zapisz" w TripPlanHeader
2. System wykonuje pełną walidację `editedPlan`
3. **Jeśli błędy walidacji:**
   - Wyświetlenie wszystkich błędów w odpowiednich miejscach
   - Fokus na pierwszym błędnym polu
   - Przerwanie procesu
4. **Jeśli walidacja OK:**
   - System wywołuje `updateTripPlan(editedPlan)`
   - Wyświetlenie stanu ładowania (isSaving = true)
   - Wykonanie PATCH request do `/api/trip-plans/:id`
5. **Sukces:**
   - Aktualizacja `originalPlan` i `editedPlan` nowymi danymi z API
   - Przejście w tryb podglądu (`isEditMode = false`)
   - Wyświetlenie toast notification "Plan został zapisany"
6. **Błąd:**
   - Pozostanie w trybie edycji
   - Wyświetlenie komunikatów błędów z API
   - Możliwość poprawienia i ponowienia próby

### 8.9. Anulowanie edycji

**Scenariusz:**

1. Użytkownik klika przycisk "Anuluj" w TripPlanHeader
2. System wywołuje `dispatch({ type: "EXIT_EDIT_MODE" })`
3. `editedPlan` zostaje zastąpiony `originalPlan` (porzucenie zmian)
4. Przejście w tryb podglądu
5. Wszystkie niezapisane zmiany zostają utracone

### 8.10. Usunięcie planu

**Scenariusz:**

1. Użytkownik klika przycisk "Usuń" w TripPlanHeader (w trybie podglądu)
2. Pojawia się DeleteConfirmDialog z nazwą planu (destination)
3. **Jeśli "Anuluj":** Dialog zamyka się, brak akcji
4. **Jeśli "Usuń":**
   - System wywołuje `deleteTripPlan()`
   - Wyświetlenie stanu ładowania (isDeleting = true)
   - Wykonanie DELETE request do `/api/trip-plans/:id`
5. **Sukces:**
   - Przekierowanie do `/trip-plans` (lista planów)
   - Opcjonalnie: wyświetlenie toast notification "Plan został usunięty"
6. **Błąd:**
   - Zamknięcie dialogu
   - Wyświetlenie komunikatu błędu
   - Pozostanie na stronie szczegółów

## 9. Warunki i walidacja

### 9.1. Walidacja podstawowych pól (TripPlanHeader)

**Pole: destination**

- Warunek: wymagane, niepuste, min 1 znak
- Komponent: TripPlanHeader
- Komunikat błędu: "Cel podróży jest wymagany"
- Wpływ: blokada zapisania, wyświetlenie błędu pod polem

**Pole: start_date**

- Warunek: wymagane, format YYYY-MM-DD, data prawidłowa
- Komponent: TripPlanHeader
- Komunikat błędu: "Data rozpoczęcia jest wymagana" / "Nieprawidłowy format daty"
- Wpływ: blokada zapisania, wyświetlenie błędu pod polem

**Pole: end_date**

- Warunek: wymagane, format YYYY-MM-DD, >= start_date
- Komponent: TripPlanHeader
- Komunikat błędu: "Data zakończenia musi być >= data rozpoczęcia"
- Wpływ: blokada zapisania, wyświetlenie błędu pod polem

**Pole: people_count**

- Warunek: wymagane, liczba całkowita, >= 1
- Komponent: TripPlanHeader
- Komunikat błędu: "Liczba osób musi być >= 1"
- Wpływ: blokada zapisania, wyświetlenie błędu pod polem

**Pole: budget_type**

- Warunek: wymagane, niepuste
- Komponent: TripPlanHeader
- Komunikat błędu: "Typ budżetu jest wymagany"
- Wpływ: blokada zapisania, wyświetlenie błędu pod polem

### 9.2. Walidacja aktywności (ActivityCard)

**Pole: time**

- Warunek: wymagane, format HH:MM (24h)
- Komponent: ActivityCard
- Komunikat błędu: "Godzina jest wymagana (format HH:MM)"
- Wpływ: blokada zapisania aktywności

**Pole: title**

- Warunek: wymagane, min 1 znak, max 200 znaków
- Komponent: ActivityCard
- Komunikat błędu: "Tytuł jest wymagany" / "Tytuł może mieć max 200 znaków"
- Wpływ: blokada zapisania aktywności

**Pole: description**

- Warunek: wymagane, min 1 znak
- Komponent: ActivityCard
- Komunikat błędu: "Opis jest wymagany"
- Wpływ: blokada zapisania aktywności

**Pole: location**

- Warunek: wymagane, min 1 znak
- Komponent: ActivityCard
- Komunikat błędu: "Lokalizacja jest wymagana"
- Wpływ: blokada zapisania aktywności

**Pole: estimated_cost**

- Warunek: opcjonalne, jeśli podane: liczba >= 0
- Komponent: ActivityCard
- Komunikat błędu: "Koszt musi być >= 0"
- Wpływ: blokada zapisania aktywności (jeśli nieprawidłowy)

**Pole: duration**

- Warunek: opcjonalne, string
- Komponent: ActivityCard
- Komunikat błędu: brak
- Wpływ: brak

**Pole: category**

- Warunek: opcjonalne, string
- Komponent: ActivityCard
- Komunikat błędu: brak
- Wpływ: brak

### 9.3. Walidacja zakwaterowania (AccommodationSection)

**Pole: name**

- Warunek: wymagane, min 1 znak
- Komponent: AccommodationSection
- Komunikat błędu: "Nazwa zakwaterowania jest wymagana"
- Wpływ: blokada zapisania

**Pole: address**

- Warunek: wymagane, min 1 znak
- Komponent: AccommodationSection
- Komunikat błędu: "Adres jest wymagany"
- Wpływ: blokada zapisania

**Pole: check_in**

- Warunek: wymagane, format YYYY-MM-DD
- Komponent: AccommodationSection
- Komunikat błędu: "Data zameldowania jest wymagana"
- Wpływ: blokada zapisania

**Pole: check_out**

- Warunek: wymagane, format YYYY-MM-DD, >= check_in
- Komponent: AccommodationSection
- Komunikat błędu: "Data wymeldowania musi być >= data zameldowania"
- Wpływ: blokada zapisania

**Pole: estimated_cost**

- Warunek: opcjonalne, jeśli podane: liczba >= 0
- Komponent: AccommodationSection
- Komunikat błędu: "Koszt musi być >= 0"
- Wpływ: blokada zapisania (jeśli nieprawidłowy)

**Pole: booking_url**

- Warunek: opcjonalne, jeśli podane: prawidłowy URL
- Komponent: AccommodationSection
- Komunikat błędu: "Nieprawidłowy URL"
- Wpływ: blokada zapisania (jeśli nieprawidłowy)

### 9.4. Walidacja struktury plan_details

**Warunek: days**

- Tablica nie może być pusta (min 1 dzień)
- Komponent: TripPlanDetailsView (poziom całego planu)
- Komunikat błędu: "Plan musi zawierać co najmniej jeden dzień"
- Wpływ: blokada zapisania całego planu

**Warunek: activities w każdym dniu**

- Każdy dzień musi mieć co najmniej 1 aktywność
- Komponent: PlanDay
- Komunikat błędu: "Dzień musi zawierać co najmniej jedną aktywność"
- Wpływ: blokada usunięcia ostatniej aktywności, blokada zapisania

### 9.5. Walidacja przed zapisem (PATCH request)

Przed wysłaniem PATCH request system wykonuje pełną walidację:

1. Sprawdzenie wszystkich pól metadata (destination, dates, people_count, budget_type)
2. Sprawdzenie struktury plan_details:
   - Czy istnieje co najmniej 1 dzień
   - Czy każdy dzień ma co najmniej 1 aktywność
   - Czy wszystkie aktywności mają wymagane pola
3. Sprawdzenie accommodation (jeśli istnieje)
4. Jeśli jakikolwiek błąd: blokada zapisu, wyświetlenie wszystkich błędów
5. Jeśli OK: wysłanie request

### 9.6. Walidacja zwrócona z API (Backend validation)

Jeśli backend zwróci błąd 400 z kodem "VALIDATION_ERROR":

- Parsowanie `error.details` (mapa pól -> komunikaty)
- Wyświetlenie błędów przy odpowiednich polach
- Fokus na pierwszym błędnym polu
- Przykład: `{ "start_date": "Data rozpoczęcia nie może być w przeszłości" }`

## 10. Obsługa błędów

### 10.1. Błąd 404 - Plan nie znaleziony

**Scenariusz:** GET request zwraca 404

**Obsługa:**

- Wyświetlenie ErrorState z typem "not-found"
- Komunikat: "Plan wycieczki nie został znaleziony"
- Przycisk: "Wróć do listy planów" → nawigacja do `/trip-plans`

### 10.2. Błąd 401 - Brak autoryzacji

**Scenariusz:** Dowolny request zwraca 401

**Obsługa:**

- Natychmiastowe przekierowanie do `/login`
- Zachowanie redirect URL (query param): `/login?redirect=/trip-plans/:id`
- Po zalogowaniu: powrót do strony szczegółów planu

### 10.3. Błąd 400 - Błąd walidacji

**Scenariusz:** PATCH request zwraca 400 z kodem "VALIDATION_ERROR"

**Obsługa:**

- Parsowanie `error.details` (obiekt z błędami walidacji)
- Mapowanie błędów do odpowiednich pól w formularzu
- Wyświetlenie komunikatów błędów pod polami
- Fokus na pierwszym błędnym polu
- Pozostanie w trybie edycji
- Możliwość poprawienia i ponownego zapisu

**Przykład response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "start_date": "Data rozpoczęcia nie może być w przeszłości",
      "people_count": "Liczba osób musi być większa niż 0"
    }
  }
}
```

### 10.4. Błąd 500 - Błąd serwera

**Scenariusz:** Dowolny request zwraca 500

**Obsługa:**

- Wyświetlenie ErrorState z typem "server-error"
- Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przyciski: "Spróbuj ponownie" (refetch) lub "Wróć do listy planów"
- Logowanie błędu w konsoli (dla debugowania)

### 10.5. Błąd sieci (Network Error)

**Scenariusz:** Brak połączenia z internetem, timeout, etc.

**Obsługa:**

- Wyświetlenie ErrorState z typem "network-error"
- Komunikat: "Nie można połączyć z serwerem. Sprawdź połączenie internetowe."
- Przycisk: "Spróbuj ponownie" (refetch)
- Oczekiwanie na przywrócenie połączenia

### 10.6. Błąd usuwania planu

**Scenariusz:** DELETE request kończy się błędem

**Obsługa:**

- Zamknięcie DeleteConfirmDialog
- Wyświetlenie toast notification z komunikatem błędu
- Pozostanie na stronie szczegółów planu
- W zależności od błędu (401, 404, 500): odpowiednia obsługa jak wyżej

### 10.7. Błąd zapisywania (podczas edycji)

**Scenariusz:** PATCH request kończy się błędem

**Obsługa:**

- Pozostanie w trybie edycji
- Wyświetlenie komunikatu błędu (toast lub inline)
- Zachowanie wprowadzonych zmian w `editedPlan`
- Możliwość poprawienia i ponownego zapisu
- Jeśli błąd walidacji: wyświetlenie szczegółów przy polach

### 10.8. Błąd klienta (lokalna walidacja)

**Scenariusz:** Użytkownik próbuje zapisać plan z błędami walidacji (wykrytymi lokalnie)

**Obsługa:**

- Blokada wysłania request (brak wywołania API)
- Wyświetlenie wszystkich błędów walidacji
- Fokus na pierwszym błędnym polu
- Pozostanie w trybie edycji
- Możliwość poprawienia błędów

### 10.9. Race conditions i stale data

**Scenariusz:** Użytkownik edytuje plan, który został zmieniony przez inną sesję/urządzenie

**Obsługa (opcjonalna, post-MVP):**

- Sprawdzenie `updated_at` przed zapisem
- Jeśli dane są nieaktualne: komunikat ostrzegawczy
- Możliwość odświeżenia danych lub wymuszenia zapisu

### 10.10. Timeout generowania/zapisu

**Scenariusz:** Request trwa zbyt długo (> 30s)

**Obsługa:**

- Wyświetlenie komunikatu: "Operacja trwa dłużej niż zwykle..."
- Możliwość anulowania lub kontynuowania oczekiwania
- Po timeout: obsługa jak błąd sieci

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

- [ ] Utworzyć plik strony Astro: `src/pages/trip-plans/[id].astro`
- [ ] Utworzyć folder dla komponentów React widoku: `src/components/trip-plans/details/`
- [ ] Utworzyć główny komponent: `src/components/trip-plans/details/TripPlanDetailsView.tsx`

### Krok 2: Zdefiniowanie typów

- [ ] Dodać nowe typy do `src/types.ts` lub utworzyć nowy plik `src/types/trip-plan-view.types.ts`:
  - `TripPlanViewState`
  - `ViewError`
  - `ErrorType`
  - `ValidationErrors`
  - `TripPlanMetadata`
  - `ActivityFormData`
  - `AccommodationFormData`
  - `PlanEditAction`
  - `TripPlanAction` (dla reducer)

### Krok 3: Implementacja custom hooks

- [ ] Utworzyć plik `src/hooks/useTripPlanDetails.ts`
- [ ] Zaimplementować funkcje pomocnicze:
  - `fetchTripPlan(id: string)`
  - `updateTripPlan(id: string, updates: UpdateTripPlanDto)`
  - `deleteTripPlan(id: string)`
  - `mapErrorToViewError(error: unknown)`
- [ ] Zaimplementować reducer `tripPlanReducer`
- [ ] Zaimplementować hook `useTripPlanDetails(planId: string)`

### Krok 4: Implementacja komponentów pomocniczych (UI primitives)

- [ ] Utworzyć `LoadingState.tsx` - spinner + komunikat
- [ ] Utworzyć `ErrorState.tsx` - ikona + komunikat + przyciski akcji
- [ ] Utworzyć `DeleteConfirmDialog.tsx` (używając Shadcn Dialog)

### Krok 5: Implementacja TripPlanHeader

- [ ] Utworzyć plik `src/components/trip-plans/details/TripPlanHeader.tsx`
- [ ] Zaimplementować widok podglądu (static display)
- [ ] Zaimplementować widok edycji (input fields)
- [ ] Dodać przyciski akcji (Edit, Delete, Save, Cancel)
- [ ] Dodać walidację inline dla pól
- [ ] Dodać wyświetlanie błędów walidacji

### Krok 6: Implementacja ActivityCard

- [ ] Utworzyć plik `src/components/trip-plans/details/ActivityCard.tsx`
- [ ] Zaimplementować widok podglądu (card z wszystkimi danymi)
- [ ] Zaimplementować widok edycji (formularz)
- [ ] Dodać walidację pól aktywności
- [ ] Dodać obsługę błędów walidacji
- [ ] Dodać przyciski "Zapisz zmiany" i "Usuń" (w trybie edycji)

### Krok 7: Implementacja PlanDay

- [ ] Utworzyć plik `src/components/trip-plans/details/PlanDay.tsx`
- [ ] Zaimplementować nagłówek dnia
- [ ] Zaimplementować listę aktywności (mapowanie ActivityCard)
- [ ] Dodać przycisk "Dodaj aktywność" (w trybie edycji)
- [ ] Zaimplementować formularz nowej aktywności
- [ ] Dodać przycisk "Usuń dzień" (w trybie edycji) z warunkami
- [ ] Obsługa callbacków: onAddActivity, onUpdateActivity, onDeleteActivity, onDeleteDay

### Krok 8: Implementacja AccommodationSection

- [ ] Utworzyć plik `src/components/trip-plans/details/AccommodationSection.tsx`
- [ ] Zaimplementować widok podglądu (display info)
- [ ] Zaimplementować widok edycji (formularz)
- [ ] Dodać przycisk "Dodaj zakwaterowanie" (jeśli brak + tryb edycji)
- [ ] Dodać przycisk "Usuń zakwaterowanie" (w trybie edycji)
- [ ] Dodać walidację pól zakwaterowania
- [ ] Obsługa callbacków: onUpdate, onRemove, onAdd

### Krok 9: Integracja komponentów w TripPlanDetailsView

- [ ] Zaimplementować strukturę warunkowego renderowania:
  - Loading → LoadingState
  - Error → ErrorState
  - Success → TripPlanContent
- [ ] Dodać TripPlanHeader z propsami
- [ ] Dodać iterację dni (map przez PlanDay)
- [ ] Dodać AccommodationSection
- [ ] Dodać DeleteConfirmDialog
- [ ] Połączyć wszystkie callbacki z reducer dispatch

### Krok 10: Implementacja logiki zarządzania stanem

- [ ] Zintegrować `useTripPlanDetails` w TripPlanDetailsView
- [ ] Zaimplementować funkcję `handleEnterEditMode()`
- [ ] Zaimplementować funkcję `handleExitEditMode()`
- [ ] Zaimplementować funkcję `handleSave()` z pełną walidacją
- [ ] Zaimplementować funkcję `handleDelete()` (potwierdzenie + API call)
- [ ] Zaimplementować funkcje do edycji:
  - `handleMetadataChange(field, value)`
  - `handleUpdateActivity(dayIndex, activityIndex, activity)`
  - `handleDeleteActivity(dayIndex, activityIndex)`
  - `handleAddActivity(dayIndex, activity)`
  - `handleDeleteDay(dayIndex)`
  - `handleUpdateAccommodation(accommodation)`
  - `handleRemoveAccommodation()`
  - `handleAddAccommodation(accommodation)`

### Krok 11: Implementacja walidacji

- [ ] Utworzyć plik `src/lib/validators/tripPlanView.validator.ts`
- [ ] Zaimplementować funkcje walidacyjne:
  - `validateTripPlanMetadata(data: TripPlanMetadata): ValidationErrors`
  - `validateActivity(activity: ActivityDto): ValidationErrors`
  - `validateAccommodation(accommodation: AccommodationDto): ValidationErrors`
  - `validatePlanDetails(details: PlanDetailsDto): ValidationErrors`
  - `validateFullPlan(plan: TripPlanDto): ValidationErrors`
- [ ] Zintegrować walidację w logice zapisywania
- [ ] Zintegrować walidację inline w komponentach

### Krok 12: Implementacja endpoint DELETE (jeśli nie istnieje)

- [ ] Utworzyć lub zmodyfikować plik `src/pages/api/trip-plans/[id].ts`
- [ ] Dodać handler DELETE:
  - Pobieranie id z params
  - Weryfikacja uwierzytelnienia
  - Soft-delete planu (update deleted_at, deleted_by)
  - Zwrócenie sukcesu lub błędu
- [ ] Dodać walidację (sprawdzenie czy plan należy do użytkownika)
- [ ] Dodać obsługę błędów (401, 404, 500)

### Krok 13: Stylowanie komponentów

- [ ] Zastosować Tailwind CSS do wszystkich komponentów
- [ ] Użyć komponentów Shadcn/ui:
  - Button
  - Input
  - Textarea
  - Select
  - Dialog (dla DeleteConfirmDialog)
  - Card (dla ActivityCard, PlanDay)
  - Badge (dla kategorii, budżetu)
  - Alert (dla komunikatów błędów)
- [ ] Zapewnić spójność wizualną z resztą aplikacji
- [ ] Dodać responsywność (mobile-first < 400px)

### Krok 14: Testowanie responsywności

- [ ] Przetestować widok na ekranach < 400px
- [ ] Przetestować na tabletach (768px)
- [ ] Przetestować na desktopach (1024px+)
- [ ] Upewnić się, że wszystkie funkcje działają na mobile
- [ ] Poprawić layout gdzie potrzeba (media queries, flex, grid)

### Krok 15: Obsługa błędów i edge cases

- [ ] Przetestować wszystkie scenariusze błędów:
  - 404 - plan nie istnieje
  - 401 - brak autoryzacji
  - 400 - błędy walidacji
  - 500 - błąd serwera
  - Network error
- [ ] Przetestować edge cases:
  - Plan bez accommodation
  - Plan z jednym dniem
  - Dzień z jedną aktywnością
  - Bardzo długie teksty w polach
  - Puste opcjonalne pola
- [ ] Dodać toast notifications dla sukcesu/błędów (opcjonalnie)

### Krok 16: Integracja z Astro page

- [ ] W pliku `src/pages/trip-plans/[id].astro`:
  - Pobrać `id` z Astro.params
  - Przekazać `id` do komponentu React
  - Dodać layout (header, footer)
  - Zapewnić SSR/CSR zgodnie z konfiguracją Astro
- [ ] Przetestować routing (nawigacja z listy planów)

### Krok 17: Testy end-to-end

- [ ] Przetestować pełny flow:
  1. Wejście na stronę szczegółów
  2. Przejście w tryb edycji
  3. Edycja wszystkich typów pól
  4. Zapisanie zmian
  5. Weryfikacja że zmiany są widoczne
  6. Usunięcie planu
  7. Weryfikacja przekierowania
- [ ] Przetestować flow z błędami:
  1. Wprowadzenie nieprawidłowych danych
  2. Próba zapisu
  3. Wyświetlenie błędów walidacji
  4. Poprawienie
  5. Pomyślny zapis

### Krok 18: Optymalizacja i finalne poprawki

- [ ] Optymalizacja wydajności (React.memo, useMemo, useCallback gdzie potrzeba)
- [ ] Dodanie loading states dla długich operacji
- [ ] Dodanie animacji przejść (opcjonalnie)
- [ ] Przegląd dostępności (a11y):
  - aria-labels
  - focus management
  - keyboard navigation
- [ ] Code review i refactoring
- [ ] Dokumentacja komponentów (JSDoc comments)

### Krok 19: Dokumentacja

- [ ] Dodać README dla widoku (jeśli potrzebne)
- [ ] Udokumentować API komponentów (props, callbacks)
- [ ] Udokumentować flow danych (state management)
- [ ] Dodać przykłady użycia (stories/examples)

### Krok 20: Wdrożenie i monitoring

- [ ] Merge do głównej gałęzi
- [ ] Deploy na środowisko testowe
- [ ] Testy akceptacyjne
- [ ] Deploy na produkcję
- [ ] Monitoring błędów (Sentry, LogRocket, etc.)
- [ ] Zbieranie feedbacku od użytkowników

---

## Uwagi końcowe

1. **Autentykacja:** Upewnić się, że wszystkie requesty do API zawierają odpowiednie tokeny/cookies sesji.

2. **Endpoint DELETE:** Jeśli endpoint nie istnieje, należy go zaimplementować przed krokiem 12.

3. **Optymalizacja:** Rozważyć użycie `useReducer` zamiast wielu `useState` ze względu na złożoność stanu.

4. **Accessibility:** Zadbać o nawigację klawiaturą, focus management, aria-labels dla screen readers.

5. **Performance:** Dla dużych planów (wiele dni/aktywności) rozważyć wirtualizację list lub lazy loading.

6. **Analytics:** Rozważyć dodanie event tracking dla kluczowych akcji (edit, save, delete).

7. **Offline support:** W przyszłości można dodać obsługę offline (PWA, local storage).

8. **Versioning:** Post-MVP można dodać wersjonowanie planów (historia zmian).

9. **Collaboration:** Post-MVP można dodać współdzielenie planów między użytkownikami.

10. **Mobile app:** Jeśli w przyszłości powstanie aplikacja mobilna, ten widok może być ponownie wykorzystany (React Native).
