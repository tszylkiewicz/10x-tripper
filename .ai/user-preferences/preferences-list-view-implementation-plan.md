# Plan implementacji widoku Lista Preferencji

## 1. Przegląd

Widok listy preferencji umożliwia użytkownikom zarządzanie szablonami preferencji, które przyspieszają proces tworzenia planów wycieczek. Widok wyświetla wszystkie zapisane szablony preferencji użytkownika i pozwala na wykonywanie pełnego zakresu operacji CRUD (tworzenie, odczytywanie, aktualizowanie, usuwanie). Każda preferencja zawiera nazwę, liczbę osób oraz typ budżetu, które następnie mogą być wykorzystane podczas generowania planów podróży przez AI.

## 2. Routing widoku

**Ścieżka:** `/preferences`

**Plik strony:** `src/pages/preferences.astro`

Strona powinna być chroniona przez mechanizm uwierzytelniania (do implementacji w przyszłości - na razie używany jest hardcoded userId).

## 3. Struktura komponentów

```
PreferencesPage (preferences.astro)
└── PreferencesView (PreferencesView.tsx) - React island
    ├── Header
    │   ├── Tytuł strony
    │   └── CreatePreferenceButton
    ├── PreferencesList (container)
    │   ├── PreferenceCard (wielokrotnie, dla każdej preferencji)
    │   │   ├── PreferenceInfo (nazwa, liczba osób, budżet)
    │   │   ├── EditButton
    │   │   └── DeleteButton
    │   └── EmptyState (gdy brak preferencji)
    ├── PreferenceFormDialog (modal)
    │   ├── DialogHeader (tytuł zależny od trybu)
    │   ├── PreferenceForm
    │   │   ├── NameInput (TextField)
    │   │   ├── PeopleCountInput (NumberField)
    │   │   ├── BudgetTypeSelect (Select)
    │   │   └── FormActions (Cancel, Submit)
    │   └── ErrorAlert (dla błędów formularza)
    ├── DeleteConfirmationDialog (modal)
    │   ├── DialogHeader
    │   ├── ConfirmationMessage
    │   └── DialogActions (Cancel, Confirm)
    ├── LoadingSpinner (podczas ładowania danych)
    └── ErrorAlert (dla błędów poziomu strony)
```

## 4. Szczegóły komponentów

### 4.1 PreferencesView (główny komponent React island)

**Opis:** Główny kontener widoku zarządzający stanem całej strony preferencji. Odpowiada za pobieranie danych, zarządzanie dialogami i koordynację operacji CRUD.

**Główne elementy:**

- Container div z responsywnym układem
- Header z tytułem i przyciskiem tworzenia
- Lista kart preferencji lub stan pusty
- Warunkowe renderowanie dialogów (formularz, potwierdzenie usunięcia)
- Warunkowe renderowanie wskaźników ładowania i błędów

**Obsługiwane zdarzenia:**

- `onMount` - pobieranie preferencji przy załadowaniu komponentu
- `onCreateClick` - otwarcie dialogu tworzenia
- `onEditClick(preference)` - otwarcie dialogu edycji z danymi preferencji
- `onDeleteClick(preference)` - otwarcie dialogu potwierdzenia usunięcia
- `onFormSubmit(data, mode)` - obsługa zapisu (create/update)
- `onDeleteConfirm` - wykonanie usunięcia
- `onDialogClose` - zamknięcie dialogów

**Warunki walidacji:**

- Brak (walidacja na poziomie formularza)

**Typy:**

- `PreferencesViewState` - stan komponentu
- `UserPreferenceDto[]` - lista preferencji
- `ApiSuccessResponse<UserPreferenceDto[]>` - odpowiedź API

**Propsy:**

```typescript
interface PreferencesViewProps {
  // Na razie brak propsów, w przyszłości może przyjmować userId z sesji
}
```

### 4.2 PreferenceCard

**Opis:** Karta wyświetlająca pojedynczą preferencję użytkownika. Prezentuje nazwę, liczbę osób i typ budżetu w czytelnej formie. Zawiera akcje edycji i usuwania.

**Główne elementy:**

- Card container (shadcn/ui Card)
- CardHeader z nazwą preferencji
- CardContent z informacjami:
  - Liczba osób (ikona + wartość lub "Nie określono")
  - Typ budżetu (badge z odpowiednim kolorem)
- CardFooter z przyciskami akcji:
  - Edit button (ikona ołówka)
  - Delete button (ikona kosza)

**Obsługiwane zdarzenia:**

- `onEdit(preference)` - kliknięcie przycisku edycji
- `onDelete(preference)` - kliknięcie przycisku usuwania

**Warunki walidacji:**

- Brak (karta tylko wyświetla dane)

**Typy:**

- `UserPreferenceDto` - dane preferencji do wyświetlenia

**Propsy:**

```typescript
interface PreferenceCardProps {
  preference: UserPreferenceDto;
  onEdit: (preference: UserPreferenceDto) => void;
  onDelete: (preference: UserPreferenceDto) => void;
}
```

### 4.3 CreatePreferenceButton

**Opis:** Przycisk uruchamiający proces tworzenia nowej preferencji. Wyróżnia się wizualnie jako główne CTA (Call To Action) na stronie.

**Główne elementy:**

- Button (shadcn/ui Button, variant="default")
- Ikona plusa
- Tekst "Nowa preferencja"

**Obsługiwane zdarzenia:**

- `onClick` - otwarcie dialogu tworzenia preferencji

**Warunki walidacji:**

- Brak

**Typy:**

- Brak specyficznych typów

**Propsy:**

```typescript
interface CreatePreferenceButtonProps {
  onClick: () => void;
}
```

### 4.4 PreferenceFormDialog

**Opis:** Modalny dialog zawierający formularz do tworzenia lub edycji preferencji. Automatycznie dostosowuje tytuł i logikę w zależności od trybu (create/edit).

**Główne elementy:**

- Dialog (shadcn/ui Dialog)
- DialogContent
- DialogHeader z tytułem dynamicznym ("Nowa preferencja" / "Edytuj preferencję")
- Form (HTML form)
- FormField dla nazwy (TextField, wymagane)
- FormField dla liczby osób (NumberField, opcjonalne)
- FormField dla typu budżetu (Select, opcjonalne, wartości: low/medium/high)
- DialogFooter z przyciskami:
  - Cancel (variant="outline")
  - Submit (variant="default", pokazuje spinner podczas wysyłania)
- ErrorAlert (wyświetlany gdy wystąpią błędy)

**Obsługiwane zdarzenia:**

- `onSubmit` - walidacja i wysłanie formularza
- `onCancel` - anulowanie i zamknięcie dialogu
- `onChange` - aktualizacja wartości pól formularza

**Warunki walidacji:**

1. **Nazwa (name):**
   - Wymagane: pole nie może być puste
   - Maksymalna długość: 256 znaków
   - Unikalność: sprawdzana po stronie backendu, frontend obsługuje błąd duplikatu
   - Walidacja na: blur, submit
   - Komunikaty błędów:
     - Puste: "Nazwa jest wymagana"
     - Za długie: "Nazwa nie może przekraczać 256 znaków"
     - Duplikat (z API): "Preferencja o tej nazwie już istnieje"

2. **Liczba osób (people_count):**
   - Opcjonalne: może być puste (null)
   - Typ: liczba całkowita
   - Wartość minimalna: 1
   - Walidacja na: blur, submit
   - Komunikaty błędów:
     - Nie jest liczbą: "Liczba osób musi być liczbą całkowitą"
     - Mniejsze od 1: "Liczba osób musi być większa lub równa 1"

3. **Typ budżetu (budget_type):**
   - Opcjonalne: może być puste (null)
   - Typ: string, sugerowane wartości: "low", "medium", "high"
   - Walidacja na: submit
   - Komunikaty błędów: brak specyficznych (pole select)

**Typy:**

- `PreferenceFormViewModel` - stan formularza
- `PreferenceFormErrors` - błędy walidacji
- `CreateUserPreferenceDto` - dane do utworzenia (mode: create)
- `UpdateUserPreferenceDto` - dane do aktualizacji (mode: edit)
- `DialogMode` - tryb dialogu

**Propsy:**

```typescript
interface PreferenceFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: UserPreferenceDto;
  onSubmit: (data: CreateUserPreferenceDto | UpdateUserPreferenceDto) => Promise<void>;
  onCancel: () => void;
}
```

### 4.5 DeleteConfirmationDialog

**Opis:** Modalny dialog potwierdzający zamiar usunięcia preferencji. Wyświetla nazwę preferencji do usunięcia i wymaga potwierdzenia akcji.

**Główne elementy:**

- AlertDialog (shadcn/ui AlertDialog)
- AlertDialogContent
- AlertDialogHeader
  - AlertDialogTitle ("Czy na pewno chcesz usunąć?")
  - AlertDialogDescription (wyświetla nazwę preferencji)
- AlertDialogFooter
  - Cancel button (variant="outline")
  - Confirm button (variant="destructive", pokazuje spinner podczas usuwania)

**Obsługiwane zdarzenia:**

- `onConfirm` - potwierdzenie i wykonanie usunięcia
- `onCancel` - anulowanie usunięcia

**Warunki walidacji:**

- Brak (tylko potwierdzenie akcji)

**Typy:**

- `UserPreferenceDto` - preferencja do usunięcia (tylko do wyświetlenia nazwy)

**Propsy:**

```typescript
interface DeleteConfirmationDialogProps {
  open: boolean;
  preference: UserPreferenceDto | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}
```

### 4.6 EmptyState

**Opis:** Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych preferencji. Zachęca do utworzenia pierwszej preferencji.

**Główne elementy:**

- Container div (centrowany, z ikoną)
- Ikona ilustrująca pusty stan
- Tytuł: "Brak preferencji"
- Opis: "Utwórz swoją pierwszą preferencję, aby szybciej planować przyszłe wyjazdy"
- Button "Utwórz pierwszą preferencję" (CTA)

**Obsługiwane zdarzenia:**

- `onClick` - otwarcie dialogu tworzenia preferencji

**Warunki walidacji:**

- Brak

**Typy:**

- Brak specyficznych typów

**Propsy:**

```typescript
interface EmptyStateProps {
  onCreateClick: () => void;
}
```

### 4.7 LoadingSpinner

**Opis:** Wskaźnik ładowania wyświetlany podczas pobierania danych z API. Centrowany na ekranie z komunikatem.

**Główne elementy:**

- Container div (centrowany)
- Spinner (animacja ładowania)
- Tekst opcjonalny: "Ładowanie preferencji..."

**Obsługiwane zdarzenia:**

- Brak

**Warunki walidacji:**

- Brak

**Typy:**

- Brak specyficznych typów

**Propsy:**

```typescript
interface LoadingSpinnerProps {
  message?: string;
}
```

### 4.8 ErrorAlert

**Opis:** Komponent wyświetlający komunikaty błędów z możliwością zamknięcia lub ponowienia próby.

**Główne elementy:**

- Alert (shadcn/ui Alert, variant="destructive")
- AlertTitle ("Wystąpił błąd")
- AlertDescription (komunikat błędu)
- Optional: przycisk "Spróbuj ponownie"
- Close button (X)

**Obsługiwane zdarzenia:**

- `onDismiss` - zamknięcie alertu
- `onRetry` - ponowna próba operacji (opcjonalne)

**Warunki walidacji:**

- Brak

**Typy:**

- `string` - komunikat błędu

**Propsy:**

```typescript
interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}
```

## 5. Typy

### 5.1 Typy z src/types.ts (istniejące)

```typescript
// Podstawowe DTO dla preferencji użytkownika
export type UserPreferenceDto = {
  id: string; // UUID preferencji
  name: string; // Nazwa szablonu preferencji
  people_count: number | null; // Liczba osób
  budget_type: string | null; // Typ budżetu
};

// DTO dla tworzenia nowej preferencji
export interface CreateUserPreferenceDto {
  name: string; // Wymagane, max 256 znaków
  people_count?: number | null; // Opcjonalne, >= 1
  budget_type?: string | null; // Opcjonalne, sugerowane: "low"|"medium"|"high"
}

// DTO dla aktualizacji preferencji
export interface UpdateUserPreferenceDto {
  name?: string; // Opcjonalne, max 256 znaków
  people_count?: number | null; // Opcjonalne, >= 1
  budget_type?: string | null; // Opcjonalne
}

// Wrapper odpowiedzi sukcesu
export interface ApiSuccessResponse<T> {
  data: T;
}

// Struktura odpowiedzi błędu
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 5.2 Nowe typy ViewModels (do utworzenia)

```typescript
/**
 * Stan formularza preferencji
 * Używany w PreferenceFormDialog do zarządzania wartościami pól
 *
 * Pola:
 * - name: string - nazwa preferencji wpisana przez użytkownika
 * - people_count: string - liczba osób jako string (dla inputu), konwertowana na number przy submit
 * - budget_type: string - wybrany typ budżetu
 */
export interface PreferenceFormViewModel {
  name: string;
  people_count: string; // String bo input type="number" zwraca string
  budget_type: string;
}

/**
 * Błędy walidacji formularza
 * Każde pole odpowiada polu w PreferenceFormViewModel
 *
 * Pola:
 * - name?: string - błąd walidacji nazwy (np. "Nazwa jest wymagana")
 * - people_count?: string - błąd walidacji liczby osób (np. "Wartość musi być >= 1")
 * - budget_type?: string - błąd walidacji typu budżetu
 */
export interface PreferenceFormErrors {
  name?: string;
  people_count?: string;
  budget_type?: string;
}

/**
 * Tryb dialogu formularza
 * Określa czy dialog służy do tworzenia nowej preferencji czy edycji istniejącej
 * null oznacza zamknięty dialog
 */
export type PreferenceDialogMode = "create" | "edit" | null;

/**
 * Pełny stan widoku preferencji
 * Centralne miejsce zarządzania stanem całego widoku
 *
 * Pola:
 * - preferences: UserPreferenceDto[] - lista wszystkich preferencji użytkownika
 * - isLoading: boolean - czy trwa ładowanie danych (GET)
 * - isSubmitting: boolean - czy trwa wysyłanie formularza (POST/PUT)
 * - isDeleting: boolean - czy trwa usuwanie (DELETE)
 * - error: string | null - komunikat błędu poziomu strony
 * - dialogMode: PreferenceDialogMode - aktualny tryb dialogu formularza
 * - selectedPreference: UserPreferenceDto | null - preferencja obecnie edytowana
 * - showDeleteDialog: boolean - czy wyświetlany jest dialog potwierdzenia usunięcia
 * - preferenceToDelete: UserPreferenceDto | null - preferencja przeznaczona do usunięcia
 */
export interface PreferencesViewState {
  preferences: UserPreferenceDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  error: string | null;
  dialogMode: PreferenceDialogMode;
  selectedPreference: UserPreferenceDto | null;
  showDeleteDialog: boolean;
  preferenceToDelete: UserPreferenceDto | null;
}

/**
 * Opcje typu budżetu dla selecta
 * Używane w PreferenceFormDialog
 */
export interface BudgetTypeOption {
  value: string;
  label: string;
}

// Predefiniowane opcje budżetu
export const BUDGET_TYPE_OPTIONS: BudgetTypeOption[] = [
  { value: "", label: "Nie określono" },
  { value: "low", label: "Niski" },
  { value: "medium", label: "Średni" },
  { value: "high", label: "Wysoki" },
];
```

## 6. Zarządzanie stanem

### 6.1 Stan komponentu PreferencesView

Stan zarządzany przez `useState` w React:

```typescript
const [state, setState] = useState<PreferencesViewState>({
  preferences: [],
  isLoading: true,
  isSubmitting: false,
  isDeleting: false,
  error: null,
  dialogMode: null,
  selectedPreference: null,
  showDeleteDialog: false,
  preferenceToDelete: null,
});
```

### 6.2 Custom Hook: usePreferences

Zalecane jest stworzenie custom hooka `usePreferences` do enkapsulacji logiki zarządzania preferencjami:

```typescript
/**
 * Hook do zarządzania operacjami CRUD na preferencjach
 * Centralizuje logikę API calls i zarządzanie stanem
 */
function usePreferences() {
  const [state, setState] = useState<PreferencesViewState>({
    preferences: [],
    isLoading: true,
    isSubmitting: false,
    isDeleting: false,
    error: null,
    dialogMode: null,
    selectedPreference: null,
    showDeleteDialog: false,
    preferenceToDelete: null,
  });

  // Funkcja pobierająca wszystkie preferencje
  const fetchPreferences = async (): Promise<void> => {
    // Logika GET /api/user/preferences
  };

  // Funkcja tworząca nową preferencję
  const createPreference = async (data: CreateUserPreferenceDto): Promise<void> => {
    // Logika POST /api/user/preferences
  };

  // Funkcja aktualizująca preferencję
  const updatePreference = async (id: string, data: UpdateUserPreferenceDto): Promise<void> => {
    // Logika PUT /api/user/preferences/:id
  };

  // Funkcja usuwająca preferencję
  const deletePreference = async (id: string): Promise<void> => {
    // Logika DELETE /api/user/preferences/:id
  };

  // Funkcje pomocnicze do zarządzania dialogami
  const openCreateDialog = () => {
    /* ... */
  };
  const openEditDialog = (preference: UserPreferenceDto) => {
    /* ... */
  };
  const openDeleteDialog = (preference: UserPreferenceDto) => {
    /* ... */
  };
  const closeDialogs = () => {
    /* ... */
  };

  return {
    state,
    fetchPreferences,
    createPreference,
    updatePreference,
    deletePreference,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialogs,
  };
}
```

### 6.3 Custom Hook: usePreferenceForm

Hook do zarządzania stanem formularza i walidacją:

```typescript
/**
 * Hook do zarządzania formularzem preferencji
 * Obsługuje walidację i transformację danych
 */
function usePreferenceForm(initialData?: UserPreferenceDto) {
  const [formData, setFormData] = useState<PreferenceFormViewModel>({
    name: initialData?.name || "",
    people_count: initialData?.people_count?.toString() || "",
    budget_type: initialData?.budget_type || "",
  });

  const [errors, setErrors] = useState<PreferenceFormErrors>({});

  // Walidacja pojedynczego pola
  const validateField = (name: keyof PreferenceFormViewModel, value: string): string | undefined => {
    // Logika walidacji
  };

  // Walidacja całego formularza
  const validateForm = (): boolean => {
    // Logika walidacji wszystkich pól
  };

  // Obsługa zmiany wartości pola
  const handleChange = (name: keyof PreferenceFormViewModel, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Opcjonalnie: walidacja on-the-fly
  };

  // Obsługa blur (walidacja po opuszczeniu pola)
  const handleBlur = (name: keyof PreferenceFormViewModel) => {
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Reset formularza
  const reset = () => {
    setFormData({
      name: initialData?.name || "",
      people_count: initialData?.people_count?.toString() || "",
      budget_type: initialData?.budget_type || "",
    });
    setErrors({});
  };

  // Konwersja do DTO
  const toDto = (): CreateUserPreferenceDto | UpdateUserPreferenceDto => {
    return {
      name: formData.name.trim(),
      people_count: formData.people_count ? parseInt(formData.people_count, 10) : null,
      budget_type: formData.budget_type || null,
    };
  };

  return {
    formData,
    errors,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    toDto,
  };
}
```

### 6.4 Cykl życia i efekty

```typescript
// W komponencie PreferencesView
useEffect(() => {
  // Pobranie preferencji przy pierwszym renderowaniu
  fetchPreferences();
}, []);
```

## 7. Integracja API

### 7.1 Endpoint: GET /api/user/preferences

**Cel:** Pobranie wszystkich preferencji użytkownika

**Request:**

- Metoda: GET
- URL: `/api/user/preferences`
- Headers: `Content-Type: application/json`
- Body: brak

**Response (200 OK):**

```typescript
ApiSuccessResponse<UserPreferenceDto[]>
// Przykład:
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Wakacje rodzinne",
      "people_count": 4,
      "budget_type": "medium"
    },
    {
      "id": "uuid-2",
      "name": "Wyjazd służbowy",
      "people_count": 1,
      "budget_type": "high"
    }
  ]
}
```

**Obsługa błędów:**

- 401 Unauthorized - sesja wygasła, przekierowanie do logowania
- 500 Internal Server Error - wyświetlenie komunikatu błędu z możliwością retry

**Frontend implementation:**

```typescript
async function fetchPreferences(): Promise<void> {
  setState((prev) => ({ ...prev, isLoading: true, error: null }));

  try {
    const response = await fetch("/api/user/preferences", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Przekierowanie do logowania
        window.location.href = "/login";
        return;
      }
      throw new Error("Nie udało się pobrać preferencji");
    }

    const result: ApiSuccessResponse<UserPreferenceDto[]> = await response.json();
    setState((prev) => ({ ...prev, preferences: result.data, isLoading: false }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      error: "Nie udało się pobrać preferencji. Spróbuj ponownie.",
    }));
  }
}
```

### 7.2 Endpoint: POST /api/user/preferences

**Cel:** Utworzenie nowej preferencji

**Request:**

- Metoda: POST
- URL: `/api/user/preferences`
- Headers: `Content-Type: application/json`
- Body: `CreateUserPreferenceDto`

```typescript
// Przykład request body:
{
  "name": "Wakacje rodzinne",
  "people_count": 4,
  "budget_type": "medium"
}
```

**Response (201 Created):**

```typescript
ApiSuccessResponse<UserPreferenceDto>
// Przykład:
{
  "data": {
    "id": "uuid-new",
    "name": "Wakacje rodzinne",
    "people_count": 4,
    "budget_type": "medium"
  }
}
```

**Obsługa błędów:**

- 400 Bad Request - błędy walidacji (np. duplikat nazwy)
- 401 Unauthorized - sesja wygasła
- 500 Internal Server Error - błąd serwera

**Frontend implementation:**

```typescript
async function createPreference(data: CreateUserPreferenceDto): Promise<void> {
  setState((prev) => ({ ...prev, isSubmitting: true }));

  try {
    const response = await fetch("/api/user/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 400) {
        const errorData: ApiErrorResponse = await response.json();
        // Obsługa błędów walidacji (np. duplikat nazwy)
        throw new Error(errorData.error.message);
      }

      throw new Error("Nie udało się utworzyć preferencji");
    }

    const result: ApiSuccessResponse<UserPreferenceDto> = await response.json();

    // Dodanie nowej preferencji do listy
    setState((prev) => ({
      ...prev,
      preferences: [...prev.preferences, result.data],
      isSubmitting: false,
      dialogMode: null,
    }));

    // Opcjonalnie: wyświetlenie toast success
  } catch (error) {
    setState((prev) => ({
      ...prev,
      isSubmitting: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd",
    }));
  }
}
```

### 7.3 Endpoint: PUT /api/user/preferences/:id

**UWAGA:** Ten endpoint nie jest jeszcze zaimplementowany w backendzie. Należy go utworzyć przed implementacją funkcji edycji.

**Cel:** Aktualizacja istniejącej preferencji

**Request:**

- Metoda: PUT
- URL: `/api/user/preferences/:id`
- Headers: `Content-Type: application/json`
- Body: `UpdateUserPreferenceDto`

```typescript
// Przykład request body:
{
  "name": "Wakacje rodzinne 2025",
  "people_count": 5,
  "budget_type": "high"
}
```

**Response (200 OK):**

```typescript
ApiSuccessResponse<UserPreferenceDto>
// Przykład:
{
  "data": {
    "id": "uuid-1",
    "name": "Wakacje rodzinne 2025",
    "people_count": 5,
    "budget_type": "high"
  }
}
```

**Obsługa błędów:**

- 400 Bad Request - błędy walidacji
- 401 Unauthorized - sesja wygasła
- 404 Not Found - preferencja nie istnieje
- 500 Internal Server Error - błąd serwera

**Frontend implementation:**

```typescript
async function updatePreference(id: string, data: UpdateUserPreferenceDto): Promise<void> {
  setState((prev) => ({ ...prev, isSubmitting: true }));

  try {
    const response = await fetch(`/api/user/preferences/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 404) {
        throw new Error("Preferencja nie została znaleziona");
      }

      if (response.status === 400) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error.message);
      }

      throw new Error("Nie udało się zaktualizować preferencji");
    }

    const result: ApiSuccessResponse<UserPreferenceDto> = await response.json();

    // Aktualizacja preferencji na liście
    setState((prev) => ({
      ...prev,
      preferences: prev.preferences.map((p) => (p.id === id ? result.data : p)),
      isSubmitting: false,
      dialogMode: null,
      selectedPreference: null,
    }));

    // Opcjonalnie: wyświetlenie toast success
  } catch (error) {
    setState((prev) => ({
      ...prev,
      isSubmitting: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd",
    }));
  }
}
```

### 7.4 Endpoint: DELETE /api/user/preferences/:id

**Cel:** Usunięcie preferencji

**Request:**

- Metoda: DELETE
- URL: `/api/user/preferences/:id`
- Headers: `Content-Type: application/json`
- Body: brak

**Response (204 No Content):**

- Pusta odpowiedź, status 204

**Obsługa błędów:**

- 401 Unauthorized - sesja wygasła
- 404 Not Found - preferencja nie istnieje
- 500 Internal Server Error - błąd serwera

**Frontend implementation:**

```typescript
async function deletePreference(id: string): Promise<void> {
  setState((prev) => ({ ...prev, isDeleting: true }));

  try {
    const response = await fetch(`/api/user/preferences/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (response.status === 404) {
        throw new Error("Preferencja nie została znaleziona");
      }

      throw new Error("Nie udało się usunąć preferencji");
    }

    // Usunięcie preferencji z listy
    setState((prev) => ({
      ...prev,
      preferences: prev.preferences.filter((p) => p.id !== id),
      isDeleting: false,
      showDeleteDialog: false,
      preferenceToDelete: null,
    }));

    // Opcjonalnie: wyświetlenie toast success
  } catch (error) {
    setState((prev) => ({
      ...prev,
      isDeleting: false,
      error: error instanceof Error ? error.message : "Wystąpił błąd",
    }));
  }
}
```

## 8. Interakcje użytkownika

### 8.1 Ładowanie strony

**Sekwencja:**

1. Użytkownik wchodzi na `/preferences`
2. Komponent PreferencesView montuje się
3. `useEffect` wywołuje `fetchPreferences()`
4. Wyświetlany jest `LoadingSpinner` z komunikatem "Ładowanie preferencji..."
5. Po otrzymaniu danych:
   - Jeśli lista pusta → wyświetl `EmptyState`
   - Jeśli lista niepusta → wyświetl `PreferenceCard` dla każdej preferencji

**Oczekiwany wynik:**

- Płynne przejście od loadingu do wyświetlenia danych
- Brak migotania/skakania elementów UI
- W przypadku błędu: wyświetlenie `ErrorAlert` z przyciskiem "Spróbuj ponownie"

### 8.2 Tworzenie nowej preferencji

**Sekwencja:**

1. Użytkownik klika "Nowa preferencja" (w headerze lub w EmptyState)
2. Otwiera się `PreferenceFormDialog` w trybie 'create'
3. Formularz jest pusty i gotowy do wypełnienia
4. Użytkownik wypełnia pola:
   - Nazwa (wymagana) - walidacja on blur
   - Liczba osób (opcjonalna) - walidacja on blur
   - Typ budżetu (opcjonalny) - wybór z selecta
5. Użytkownik klika "Zapisz"
6. Walidacja formularza:
   - Jeśli błędy → wyświetl komunikaty przy polach, focus na pierwszym błędnym polu
   - Jeśli OK → wywołaj `createPreference()`
7. Przycisk "Zapisz" pokazuje spinner i jest disabled
8. Po sukcesie:
   - Dialog się zamyka
   - Nowa preferencja pojawia się na liście
   - Opcjonalnie: toast "Preferencja została utworzona"
9. W przypadku błędu:
   - Dialog pozostaje otwarty
   - Wyświetlany jest `ErrorAlert` w dialogu
   - Użytkownik może poprawić dane lub anulować

**Oczekiwany wynik:**

- Intuicyjny proces tworzenia
- Natychmiastowe wyświetlenie nowej preferencji
- Jasne komunikaty błędów
- Możliwość anulowania w każdym momencie

### 8.3 Edycja istniejącej preferencji

**Sekwencja:**

1. Użytkownik klika ikonę edycji na `PreferenceCard`
2. Otwiera się `PreferenceFormDialog` w trybie 'edit'
3. Formularz jest wypełniony aktualnymi danymi preferencji
4. Tytuł dialogu: "Edytuj preferencję"
5. Użytkownik modyfikuje wybrane pola
6. Walidacja działa tak samo jak przy tworzeniu
7. Użytkownik klika "Zapisz"
8. Wywołane jest `updatePreference(id, data)`
9. Przycisk "Zapisz" pokazuje spinner
10. Po sukcesie:
    - Dialog się zamyka
    - Preferencja na liście aktualizuje się (dane zmieniają się "w miejscu")
    - Opcjonalnie: toast "Preferencja została zaktualizowana"
11. W przypadku błędu:
    - Dialog pozostaje otwarty
    - Wyświetlany jest komunikat błędu

**Oczekiwany wynik:**

- Płynna aktualizacja danych na liście
- Brak przeładowania strony
- Jasne odróżnienie trybu edycji od tworzenia (tytuł dialogu)

### 8.4 Usuwanie preferencji

**Sekwencja:**

1. Użytkownik klika ikonę kosza na `PreferenceCard`
2. Otwiera się `DeleteConfirmationDialog`
3. Dialog wyświetla komunikat: "Czy na pewno chcesz usunąć preferencję '[nazwa]'?"
4. Użytkownik ma dwie opcje:
   - "Anuluj" → zamyka dialog, nic się nie dzieje
   - "Usuń" → wykonuje usunięcie
5. Po kliknięciu "Usuń":
   - Przycisk pokazuje spinner i jest disabled
   - Wywołane jest `deletePreference(id)`
6. Po sukcesie:
   - Dialog się zamyka
   - Preferencja znika z listy (animacja fade-out)
   - Jeśli to była ostatnia preferencja → wyświetl EmptyState
   - Opcjonalnie: toast "Preferencja została usunięta"
7. W przypadku błędu:
   - Dialog się zamyka
   - Wyświetlany jest `ErrorAlert` na poziomie strony

**Oczekiwany wynik:**

- Wyraźne potwierdzenie przed nieodwracalną akcją
- Płynne usunięcie z listy
- Automatyczne przejście do EmptyState gdy brak preferencji

### 8.5 Anulowanie dialogów

**Sekwencja:**

1. Użytkownik otwiera dialog (tworzenia, edycji lub usuwania)
2. Użytkownik klika "Anuluj" lub klika poza dialogiem lub klika X
3. Dialog się zamyka
4. Wszystkie zmiany w formularzu są odrzucane
5. Stan dialogu resetuje się do początkowego

**Oczekiwany wynik:**

- Natychmiastowe zamknięcie dialogu
- Brak zapisania zmian
- Lista preferencji pozostaje niezmieniona

### 8.6 Obsługa błędów sieciowych

**Sekwencja:**

1. Użytkownik wykonuje akcję (create/update/delete)
2. Brak połączenia z internetem lub serwer nie odpowiada
3. Po timeout (lub natychmiastowym błędzie):
   - Operacja nie powiedzie się
   - Wyświetlany jest ErrorAlert z komunikatem: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
   - Przycisk "Spróbuj ponownie" pozwala powtórzyć operację

**Oczekiwany wynik:**

- Jasny komunikat o problemie
- Możliwość ponownej próby
- Brak utraty wprowadzonych danych w formularzu

## 9. Warunki i walidacja

### 9.1 Walidacja pola "Nazwa" (name)

**Komponent:** PreferenceFormDialog

**Warunki:**

1. **Pole wymagane:**
   - Warunek: `name.trim().length === 0`
   - Komunikat: "Nazwa jest wymagana"
   - Weryfikacja: on blur, on submit
   - Wpływ na UI: Czerwone obramowanie input, komunikat błędu pod polem, disabled submit

2. **Maksymalna długość:**
   - Warunek: `name.length > 256`
   - Komunikat: "Nazwa nie może przekraczać 256 znaków"
   - Weryfikacja: on change (counter), on blur, on submit
   - Wpływ na UI: Licznik znaków (np. "42/256"), czerwone obramowanie przy przekroczeniu

3. **Unikalność:**
   - Warunek: Backend sprawdza czy nazwa już istnieje dla tego użytkownika
   - Komunikat z API: "Preferencja o tej nazwie już istnieje"
   - Weryfikacja: on submit (odpowiedź z API)
   - Wpływ na UI: Komunikat błędu pod polem, focus na pole nazwa, dialog pozostaje otwarty

**Implementacja:**

```typescript
function validateName(value: string): string | undefined {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Nazwa jest wymagana";
  }

  if (value.length > 256) {
    return "Nazwa nie może przekraczać 256 znaków";
  }

  return undefined;
}
```

### 9.2 Walidacja pola "Liczba osób" (people_count)

**Komponent:** PreferenceFormDialog

**Warunki:**

1. **Pole opcjonalne:**
   - Warunek: Pole może być puste
   - Weryfikacja: Brak błędu gdy puste
   - Wpływ na UI: Placeholder "Opcjonalne"

2. **Typ liczbowy:**
   - Warunek: Wartość musi być liczbą całkowitą
   - Komunikat: "Liczba osób musi być liczbą całkowitą"
   - Weryfikacja: on blur, on submit
   - Wpływ na UI: Input type="number" step="1"

3. **Wartość minimalna:**
   - Warunek: `people_count < 1` (jeśli wypełnione)
   - Komunikat: "Liczba osób musi być większa lub równa 1"
   - Weryfikacja: on blur, on submit
   - Wpływ na UI: Czerwone obramowanie, komunikat błędu, disabled submit

**Implementacja:**

```typescript
function validatePeopleCount(value: string): string | undefined {
  // Puste pole jest OK (opcjonalne)
  if (!value || value.trim() === "") {
    return undefined;
  }

  const num = parseInt(value, 10);

  if (isNaN(num)) {
    return "Liczba osób musi być liczbą całkowitą";
  }

  if (num < 1) {
    return "Liczba osób musi być większa lub równa 1";
  }

  return undefined;
}
```

### 9.3 Walidacja pola "Typ budżetu" (budget_type)

**Komponent:** PreferenceFormDialog

**Warunki:**

1. **Pole opcjonalne:**
   - Warunek: Pole może być puste
   - Weryfikacja: Brak walidacji
   - Wpływ na UI: Opcja "Nie określono" w select

2. **Wartości sugerowane:**
   - Opcje: "" (pusty), "low", "medium", "high"
   - Weryfikacja: Brak (select zapewnia poprawne wartości)
   - Wpływ na UI: Dropdown z predefiniowanymi opcjami

**Implementacja:**

- Pole type="select" z predefiniowanymi opcjami
- Brak dodatkowej walidacji (select zapewnia poprawność)

### 9.4 Warunki wyświetlania UI

**EmptyState:**

- Warunek: `preferences.length === 0 && !isLoading && !error`
- Wyświetlany gdy: Użytkownik nie ma żadnych preferencji
- Ukrywany gdy: Lista się ładuje, wystąpił błąd, lub są preferencje

**LoadingSpinner:**

- Warunek: `isLoading === true`
- Wyświetlany gdy: Trwa pobieranie preferencji z API
- Ukrywany gdy: Dane załadowane lub wystąpił błąd

**ErrorAlert (poziom strony):**

- Warunek: `error !== null`
- Wyświetlany gdy: Błąd podczas GET, DELETE, lub błąd serwera
- Ukrywany gdy: Użytkownik zamknie alert lub operacja się powiedzie

**PreferencesList:**

- Warunek: `preferences.length > 0 && !isLoading`
- Wyświetlana gdy: Są preferencje i nie trwa ładowanie
- Ukrywana gdy: Brak preferencji lub trwa ładowanie

**PreferenceFormDialog:**

- Warunek: `dialogMode !== null`
- Wyświetlany gdy: `dialogMode === 'create'` lub `dialogMode === 'edit'`
- Ukrywany gdy: `dialogMode === null`

**DeleteConfirmationDialog:**

- Warunek: `showDeleteDialog === true`
- Wyświetlany gdy: Użytkownik kliknął delete na preferencji
- Ukrywany gdy: `showDeleteDialog === false`

**Submit button (disabled state):**

- Warunek: `isSubmitting || hasValidationErrors`
- Disabled gdy: Trwa wysyłanie lub są błędy walidacji
- Enabled gdy: Formularz poprawny i nie trwa wysyłanie

## 10. Obsługa błędów

### 10.1 Błędy sieciowe (Network errors)

**Scenariusz:** Brak internetu, serwer niedostępny, timeout

**Obsługa:**

- Catch w bloku try-catch podczas fetch
- Wyświetlenie ErrorAlert z komunikatem: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe i spróbuj ponownie."
- Przycisk "Spróbuj ponownie" wywołuje ponownie odpowiednią funkcję
- Dane w formularzu nie są tracone

**Kod:**

```typescript
try {
  const response = await fetch(...);
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setError('Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.');
  }
}
```

### 10.2 Błąd 401 Unauthorized

**Scenariusz:** Sesja użytkownika wygasła

**Obsługa:**

- Sprawdzenie `response.status === 401`
- Automatyczne przekierowanie do strony logowania: `window.location.href = '/login'`
- Opcjonalnie: Zapis URL do powrotu po zalogowaniu w localStorage
- Komunikat po przekierowaniu: "Sesja wygasła. Zaloguj się ponownie."

**Kod:**

```typescript
if (response.status === 401) {
  localStorage.setItem("redirectAfterLogin", window.location.pathname);
  window.location.href = "/login?message=session_expired";
  return;
}
```

### 10.3 Błąd 400 Bad Request - Walidacja

**Scenariusz:** Błędy walidacji po stronie serwera (np. duplikat nazwy)

**Obsługa:**

- Parse odpowiedzi: `const errorData: ApiErrorResponse = await response.json()`
- Wyświetlenie błędu:
  - Jeśli `errorData.error.details` zawiera pola formularza → wyświetl inline przy polach
  - W przeciwnym razie → wyświetl ErrorAlert w dialogu
- Przykład: Duplikat nazwy → "Preferencja o tej nazwie już istnieje" pod polem nazwa
- Dialog pozostaje otwarty, focus na błędnym polu

**Kod:**

```typescript
if (response.status === 400) {
  const errorData: ApiErrorResponse = await response.json();

  // Jeśli są szczegóły dotyczące pól
  if (errorData.error.details) {
    setFormErrors(errorData.error.details as PreferenceFormErrors);
  } else {
    setError(errorData.error.message);
  }

  return;
}
```

### 10.4 Błąd 404 Not Found

**Scenariusz:** Próba edycji/usunięcia nieistniejącej preferencji

**Obsługa:**

- Wyświetlenie ErrorAlert: "Preferencja nie została znaleziona. Mogła zostać już usunięta."
- Automatyczne odświeżenie listy preferencji: `fetchPreferences()`
- Zamknięcie dialogu (jeśli otwarty)

**Kod:**

```typescript
if (response.status === 404) {
  setError("Preferencja nie została znaleziona. Lista zostanie odświeżona.");
  closeDialogs();
  await fetchPreferences();
  return;
}
```

### 10.5 Błąd 500 Internal Server Error

**Scenariusz:** Błąd po stronie serwera

**Obsługa:**

- Wyświetlenie ErrorAlert: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- Przycisk "Spróbuj ponownie"
- Logowanie błędu do console (dla deweloperów)
- Dane w formularzu nie są tracone

**Kod:**

```typescript
if (response.status === 500) {
  console.error("Server error:", await response.text());
  setError("Wystąpił błąd serwera. Spróbuj ponownie za chwilę.");
  return;
}
```

### 10.6 Timeout podczas ładowania

**Scenariusz:** API nie odpowiada w rozsądnym czasie

**Obsługa:**

- Timeout po 30 sekundach
- Wyświetlenie ErrorAlert: "Ładowanie trwa zbyt długo. Sprawdź połączenie i spróbuj ponownie."
- Możliwość anulowania i retry

**Kod:**

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    signal: controller.signal,
    ...options,
  });
  clearTimeout(timeoutId);
  // ...
} catch (error) {
  if (error.name === "AbortError") {
    setError("Ładowanie trwa zbyt długo. Sprawdź połączenie.");
  }
}
```

### 10.7 Błąd parsowania JSON

**Scenariusz:** Nieprawidłowa odpowiedź z serwera

**Obsługa:**

- Catch podczas `response.json()`
- Wyświetlenie ErrorAlert: "Otrzymano nieprawidłową odpowiedź z serwera."
- Logowanie do console
- Możliwość retry

**Kod:**

```typescript
try {
  const data = await response.json();
  // ...
} catch (error) {
  console.error("JSON parse error:", error);
  setError("Otrzymano nieprawidłową odpowiedź z serwera.");
}
```

### 10.8 Stan pusty (Empty state)

**Scenariusz:** Użytkownik nie ma żadnych preferencji

**Obsługa:**

- Nie jest to błąd, ale specjalny stan UI
- Wyświetlenie EmptyState component
- Przyjazny komunikat: "Brak preferencji. Utwórz swoją pierwszą preferencję, aby szybciej planować przyszłe wyjazdy."
- CTA: "Utwórz pierwszą preferencję" → otwiera dialog tworzenia

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu

**Zadania:**

1. Utworzenie katalogu dla komponentów widoku: `src/components/preferences/`
2. Utworzenie katalogu dla hooków: `src/hooks/`
3. Utworzenie pliku strony: `src/pages/preferences.astro`
4. Dodanie nowych typów do `src/types.ts` (ViewModels z sekcji 5.2)

**Pliki do utworzenia:**

- `src/components/preferences/PreferencesView.tsx`
- `src/components/preferences/PreferenceCard.tsx`
- `src/components/preferences/PreferenceFormDialog.tsx`
- `src/components/preferences/DeleteConfirmationDialog.tsx`
- `src/components/preferences/EmptyState.tsx`
- `src/components/preferences/ErrorAlert.tsx`
- `src/components/preferences/LoadingSpinner.tsx`
- `src/hooks/usePreferences.ts`
- `src/hooks/usePreferenceForm.ts`
- `src/pages/preferences.astro`

### Krok 2: Implementacja brakującego endpointa PUT

**UWAGA:** Endpoint PUT /api/user/preferences/:id nie jest jeszcze zaimplementowany.

**Zadania:**

1. Utworzenie walidatora Zod dla update: `updateUserPreferenceSchema` w `src/lib/validators/preferences.validator.ts`
2. Dodanie metody `updatePreference` w `UserPreferencesService`
3. Implementacja handlera PUT w `src/pages/api/user/preferences/[id].ts`
4. Testowanie endpointa

**Implementacja walidatora:**

```typescript
// src/lib/validators/preferences.validator.ts
export const updateUserPreferenceSchema = z
  .object({
    name: z.string().trim().min(1, "Name cannot be empty").max(256, "Name must not exceed 256 characters").optional(),

    people_count: z
      .number()
      .int("People count must be an integer")
      .positive("People count must be positive")
      .optional()
      .nullable(),

    budget_type: z.string().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

### Krok 3: Implementacja custom hooków

**3.1 Implementacja usePreferences**

**Zadania:**

1. Utworzenie pliku `src/hooks/usePreferences.ts`
2. Implementacja stanu komponentu
3. Implementacja funkcji CRUD (fetchPreferences, createPreference, updatePreference, deletePreference)
4. Implementacja funkcji zarządzania dialogami
5. Dodanie obsługi błędów dla każdej operacji

**Struktura:**

```typescript
export function usePreferences() {
  // Stan
  const [state, setState] = useState<PreferencesViewState>({ ... });

  // Funkcje CRUD
  const fetchPreferences = async () => { ... };
  const createPreference = async (data: CreateUserPreferenceDto) => { ... };
  const updatePreference = async (id: string, data: UpdateUserPreferenceDto) => { ... };
  const deletePreference = async (id: string) => { ... };

  // Funkcje UI
  const openCreateDialog = () => { ... };
  const openEditDialog = (preference: UserPreferenceDto) => { ... };
  const openDeleteDialog = (preference: UserPreferenceDto) => { ... };
  const closeDialogs = () => { ... };
  const clearError = () => { ... };

  // useEffect dla initial load
  useEffect(() => {
    fetchPreferences();
  }, []);

  return { state, /* wszystkie funkcje */ };
}
```

**3.2 Implementacja usePreferenceForm**

**Zadania:**

1. Utworzenie pliku `src/hooks/usePreferenceForm.ts`
2. Implementacja stanu formularza
3. Implementacja walidacji (validateField, validateForm)
4. Implementacja obsługi zdarzeń (handleChange, handleBlur)
5. Implementacja konwersji do DTO

### Krok 4: Implementacja podstawowych komponentów UI

**4.1 LoadingSpinner**

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/LoadingSpinner.tsx`
2. Użycie Tailwind do stylowania
3. Dodanie animacji (spin)
4. Opcjonalny prop dla komunikatu

**4.2 ErrorAlert**

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/ErrorAlert.tsx`
2. Użycie shadcn/ui Alert component
3. Dodanie przycisku zamykania
4. Opcjonalny przycisk "Spróbuj ponownie"

**4.3 EmptyState**

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/EmptyState.tsx`
2. Dodanie ikony (np. z lucide-react)
3. Przyjazny komunikat
4. CTA button do tworzenia pierwszej preferencji

### Krok 5: Implementacja PreferenceCard

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/PreferenceCard.tsx`
2. Użycie shadcn/ui Card components (Card, CardHeader, CardContent, CardFooter)
3. Wyświetlenie danych preferencji (nazwa, liczba osób, budżet)
4. Stylowanie badge dla typu budżetu (różne kolory dla low/medium/high)
5. Dodanie przycisków akcji (Edit, Delete) w CardFooter
6. Ikony z lucide-react (Pencil, Trash2)
7. Responsywność dla mobile

### Krok 6: Implementacja DeleteConfirmationDialog

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/DeleteConfirmationDialog.tsx`
2. Użycie shadcn/ui AlertDialog components
3. Wyświetlenie nazwy preferencji w komunikacie
4. Przyciski: Anuluj (outline) i Usuń (destructive)
5. Disabled state i spinner podczas usuwania
6. Obsługa zdarzeń: onConfirm, onCancel

### Krok 7: Implementacja PreferenceFormDialog

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/PreferenceFormDialog.tsx`
2. Użycie shadcn/ui Dialog components
3. Użycie hooka usePreferenceForm
4. Implementacja pól formularza:
   - TextField dla nazwy (wymagane, licznik znaków)
   - NumberField dla liczby osób (opcjonalne, min=1)
   - Select dla typu budżetu (opcjonalne, predefiniowane opcje)
5. Wyświetlanie błędów walidacji inline pod polami
6. Disabled submit button gdy są błędy lub trwa wysyłanie
7. Spinner na przycisku submit podczas wysyłania
8. ErrorAlert dla błędów API (np. duplikat nazwy)
9. Dynamiczny tytuł w zależności od mode ('create' / 'edit')
10. Reset formularza po zamknięciu dialogu

### Krok 8: Implementacja PreferencesView (główny komponent)

**Zadania:**

1. Utworzenie komponentu w `src/components/preferences/PreferencesView.tsx`
2. Użycie hooka usePreferences
3. Implementacja layoutu:
   - Header z tytułem i CreatePreferenceButton
   - Container dla listy kart
   - Grid/flex layout dla PreferenceCard (responsywny)
4. Warunkowe renderowanie:
   - LoadingSpinner gdy isLoading
   - EmptyState gdy brak preferencji
   - Lista PreferenceCard gdy są dane
   - ErrorAlert gdy błąd
5. Montowanie dialogów (PreferenceFormDialog, DeleteConfirmationDialog)
6. Przekazanie funkcji z hooka do komponentów dzieci
7. Obsługa wszystkich interakcji użytkownika

### Krok 9: Utworzenie strony Astro

**Zadania:**

1. Utworzenie pliku `src/pages/preferences.astro`
2. Zaimportowanie PreferencesView jako React island
3. Dodanie podstawowego layoutu (tytuł strony, meta tags)
4. Opcjonalnie: Sprawdzenie uwierzytelnienia (gdy będzie dostępne)
5. Dodanie client:load directive dla React island

**Przykład:**

```astro
---
import Layout from "../layouts/Layout.astro";
import PreferencesView from "../components/preferences/PreferencesView";
---

<Layout title="Moje Preferencje - Tripper">
  <main>
    <PreferencesView client:load />
  </main>
</Layout>
```

### Krok 10: Styling i responsywność

**Zadania:**

1. Dodanie Tailwind classes dla wszystkich komponentów
2. Testowanie na różnych rozmiarach ekranu:
   - Desktop (>1024px)
   - Tablet (768px-1024px)
   - Mobile (400px-768px)
   - Small mobile (<400px) - szczególnie ważne wg PRD
3. Sprawdzenie czytelności fontów
4. Sprawdzenie kontrastów kolorów (accessibility)
5. Dodanie smooth transitions dla animacji
6. Testowanie dark mode (jeśli aplikacja to wspiera)

### Krok 11: Accessibility (a11y)

**Zadania:**

1. Dodanie ARIA labels do wszystkich interaktywnych elementów
2. Sprawdzenie kolejności focus (keyboard navigation)
3. Testowanie z screen readerem
4. Dodanie skip links jeśli potrzebne
5. Sprawdzenie kontrastów WCAG AA
6. Role attributes dla semantyki
7. Komunikaty błędów powiązane z polami (aria-describedby)
8. Live regions dla dynamicznych komunikatów (aria-live)

### Krok 12: Testowanie manualne

**Zadania:**

1. **Happy path:**
   - Tworzenie nowej preferencji (wszystkie pola)
   - Tworzenie nowej preferencji (tylko nazwa)
   - Edycja preferencji
   - Usuwanie preferencji
2. **Edge cases:**
   - Nazwa 256 znaków (max)
   - Nazwa 257 znaków (powinno dać błąd)
   - Duplikat nazwy
   - Liczba osób = 0 (powinno dać błąd)
   - Liczba osób = 1 (min, OK)
   - Puste pola opcjonalne
3. **Błędy:**
   - Symulacja błędu sieci (offline)
   - Symulacja błędu 500
   - Sprawdzenie timeout
4. **UX:**
   - Anulowanie dialogów
   - Zamykanie dialogów przez kliknięcie poza
   - Keyboard navigation (Tab, Enter, Escape)
   - Responsywność na różnych urządzeniach

### Krok 13: Optymalizacja i finalizacja

**Zadania:**

1. Usunięcie console.log i debug code
2. Sprawdzenie typów TypeScript (brak any)
3. Code review
4. Optymalizacja re-renderów React (useMemo, useCallback gdzie potrzebne)
5. Lazy loading komponentów jeśli potrzebne
6. Sprawdzenie bundle size
7. Dodanie komentarzy do skomplikowanych części kodu
8. Aktualizacja dokumentacji jeśli potrzebne

### Krok 14: Deployment checklist

**Zadania:**

1. Sprawdzenie czy wszystkie environment variables są ustawione
2. Test na środowisku staging
3. Sprawdzenie API endpoints (produkcyjne URLs)
4. Smoke tests po deploymencie
5. Monitoring błędów po wdrożeniu
6. Komunikacja z zespołem o nowej funkcjonalności

## Uwagi końcowe

### Priorytety implementacji

1. **Must-have (MVP):**
   - Wyświetlanie listy preferencji
   - Tworzenie nowej preferencji
   - Usuwanie preferencji
   - Podstawowa walidacja
   - Responsywność mobile

2. **Should-have:**
   - Edycja preferencji (wymaga implementacji PUT endpoint)
   - Zaawansowana obsługa błędów
   - Accessibility features
   - Smooth animations

3. **Nice-to-have:**
   - Toast notifications
   - Undo usunięcia
   - Sortowanie/filtrowanie preferencji
   - Export/import preferencji

### Potencjalne problemy i rozwiązania

**Problem:** Endpoint PUT nie jest zaimplementowany
**Rozwiązanie:** Zaimplementować najpierw backend (Krok 2), następnie frontend

**Problem:** Brak systemu uwierzytelniania
**Rozwiązanie:** Na razie używać hardcoded userId, przygotować kod na przyszłą integrację

**Problem:** Brak toast notifications
**Rozwiązanie:** Można dodać jako nice-to-have, na razie użyć ErrorAlert

**Problem:** Synchronizacja stanu po błędzie 404
**Rozwiązanie:** Automatyczne odświeżenie listy po wykryciu 404

### Kolejne kroki po MVP

1. Dodanie sortowania listy preferencji (alfabetycznie, po dacie utworzenia)
2. Dodanie wyszukiwania/filtrowania
3. Dodanie systemu toast notifications
4. Dodanie opcji eksportu preferencji
5. Dodanie statystyk użycia preferencji w planach
6. Integracja z formularzem generowania planu (auto-fill preferencji)
