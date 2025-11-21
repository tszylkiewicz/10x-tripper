# Plan implementacji widoku Tworzenia Nowego Planu Wycieczki

## 1. Przegląd

Widok **Tworzenie Nowego Planu Wycieczki** (`/trip-plans/new`) umożliwia użytkownikom generowanie spersonalizowanych planów podróży przy użyciu sztucznej inteligencji. Widok składa się z formularza do wprowadzania parametrów wycieczki, mechanizmu generowania planu przez AI (z limitem czasowym 180 sekund), podglądu wygenerowanego planu z możliwością edycji oraz funkcji akceptacji i zapisu planu do bazy danych.

Kluczowe aspekty widoku:

- Generowany plan NIE jest automatycznie zapisywany - pozostaje tylko w interfejsie użytkownika
- Użytkownik może wielokrotnie regenerować plan bez ograniczeń
- Plan można edytować przed zaakceptowaniem
- System śledzi czy plan został zmodyfikowany (dla celów analitycznych)
- Dopiero po kliknięciu "Akceptuj plan" następuje zapis do bazy danych ze statusem "ai" lub "ai-edited"

## 2. Routing widoku

**Ścieżka:** `/trip-plans/new`

**Typ strony:** Dynamiczna strona Astro z komponentami React dla interaktywnych elementów

**Plik:** `src/pages/trip-plans/new.astro`

**Zabezpieczenie:** Wymaga uwierzytelnienia - niezalogowani użytkownicy powinni być przekierowani do `/login`

## 3. Struktura komponentów

```
CreateTripPlanView (src/pages/trip-plans/new.astro)
│
├── TripPlanFormSection (React)
│   └── TripPlanForm (React)
│       ├── FormField - destination (Shadcn Input)
│       ├── FormField - start_date (Shadcn DatePicker)
│       ├── FormField - end_date (Shadcn DatePicker)
│       ├── FormField - people_count (Shadcn Input type="number")
│       ├── FormField - budget_type (Shadcn Select)
│       ├── Collapsible - Preferencje (opcjonalne)
│       │   ├── FormField - transport (Shadcn Textarea)
│       │   ├── FormField - todo (Shadcn Textarea)
│       │   └── FormField - avoid (Shadcn Textarea)
│       └── Button - "Generuj plan" (Shadcn Button)
│
├── LoadingOverlay (React, warunkowy)
│   ├── Spinner (Shadcn Loading Spinner)
│   └── ProgressMessage (Text)
│
├── ErrorDisplay (React, warunkowy)
│   ├── Alert (Shadcn Alert)
│   └── Button - "Spróbuj ponownie" (Shadcn Button)
│
└── GeneratedPlanSection (React, warunkowy - po udanym generowaniu)
    ├── PlanHeader
    │   ├── Title (destination + daty)
    │   └── Metadata (liczba osób, budżet)
    │
    ├── AccommodationCard (jeśli accommodation istnieje)
    │   ├── AccommodationInfo
    │   └── Button - "Edytuj" (Shadcn Button)
    │
    ├── DaysList
    │   └── DayCard (dla każdego dnia)
    │       ├── DayHeader (dzień, data)
    │       ├── ActivitiesList
    │       │   └── ActivityCard (dla każdej aktywności)
    │       │       ├── ActivityInfo (czas, tytuł, opis, lokalizacja, koszt)
    │       │       ├── Button - "Edytuj" (Shadcn Button)
    │       │       ├── Button - "Usuń" (Shadcn Button)
    │       │       └── DragHandle (dla drag & drop)
    │       └── Button - "Dodaj aktywność" (Shadcn Button)
    │
    └── PlanActions
        ├── Button - "Regeneruj plan" (Shadcn Button variant="outline")
        └── Button - "Akceptuj plan" (Shadcn Button variant="default")
```

## 4. Szczegóły komponentów

### 4.1. CreateTripPlanView (Strona Astro)

**Opis komponentu:**
Główny komponent strony zarządzający całym przepływem generowania i akceptacji planu. Odpowiada za orchestrację stanów, wywołania API oraz nawigację między etapami (formularz → generowanie → podgląd → akceptacja).

**Główne elementy:**

- Container HTML z responsywnym layoutem
- TripPlanFormSection - sekcja z formularzem
- LoadingOverlay - pełnoekranowy overlay podczas generowania
- ErrorDisplay - komunikat błędu (jeśli wystąpił)
- GeneratedPlanSection - podgląd i edycja wygenerowanego planu

**Obsługiwane zdarzenia:**

- `onGeneratePlan(formData)` - inicjuje generowanie planu przez API
- `onRegeneratePlan()` - ponowne generowanie z tymi samymi danymi formularza
- `onAcceptPlan(plan, isEdited)` - akceptuje i zapisuje plan do bazy
- `onEditPlan(updatedPlan)` - aktualizuje plan w stanie lokalnym

**Warunki walidacji:**

- Użytkownik musi być zalogowany (middleware Astro)
- Wszystkie walidacje biznesowe delegowane do komponentów potomnych

**Typy:**

- `CreateTripPlanViewState` (stan widoku)
- `GenerateTripPlanRequestDto` (request do API)
- `GeneratedTripPlanDto` (response z API)
- `AcceptTripPlanDto` (request do API przy akceptacji)

**Propsy:**
Brak - komponent strony nie przyjmuje propsów (dane z Astro locals dla auth)

---

### 4.2. TripPlanForm (Komponent React)

**Opis komponentu:**
Formularz zbierający dane wymagane do wygenerowania planu wycieczki. Zawiera pola obowiązkowe (cel podróży, daty, liczba osób, budżet) oraz opcjonalną sekcję z preferencjami (transport, co robić, czego unikać). Implementuje walidację Zod zgodną z wymaganiami API.

**Główne elementy:**

- `<form>` element z onSubmit handler
- Input field - "Cel podróży" (destination) - Shadcn Input
- DatePicker - "Data rozpoczęcia" (start_date) - Shadcn Calendar
- DatePicker - "Data zakończenia" (end_date) - Shadcn Calendar
- Number Input - "Liczba osób" (people_count) - Shadcn Input
- Select - "Rodzaj budżetu" (budget_type) - Shadcn Select z opcjami: niski, średni, wysoki
- Collapsible - "Preferencje (opcjonalnie)" - Shadcn Collapsible
  - Textarea - "Transport" (preferences.transport) - Shadcn Textarea
  - Textarea - "Co chcesz robić" (preferences.todo) - Shadcn Textarea
  - Textarea - "Czego chcesz unikać" (preferences.avoid) - Shadcn Textarea
- Button - "Generuj plan" - Shadcn Button (primary, full-width na mobile)

**Obsługiwane zdarzenia:**

- `onSubmit(formData: TripPlanFormData)` - wywołane po pomyślnej walidacji formularza
- `onChange(field: keyof TripPlanFormData, value: unknown)` - aktualizacja wartości pola
- `onValidationError(errors: TripPlanFormErrors)` - wewnętrzna obsługa błędów walidacji

**Warunki walidacji:**

1. **destination** (cel podróży):
   - Wymagane: tak
   - Typ: string
   - Min długość: 1 znak
   - Komunikat błędu: "Cel podróży jest wymagany"

2. **start_date** (data rozpoczęcia):
   - Wymagane: tak
   - Format: YYYY-MM-DD (ISO date)
   - Warunek: data >= dzisiaj (nie może być w przeszłości)
   - Komunikat błędu: "Data rozpoczęcia jest wymagana" / "Data nie może być w przeszłości"

3. **end_date** (data zakończenia):
   - Wymagane: tak
   - Format: YYYY-MM-DD (ISO date)
   - Warunek: end_date >= start_date
   - Komunikat błędu: "Data zakończenia jest wymagana" / "Data zakończenia musi być równa lub późniejsza niż data rozpoczęcia"

4. **people_count** (liczba osób):
   - Wymagane: tak
   - Typ: positive integer
   - Warunek: >= 1
   - Komunikat błędu: "Liczba osób jest wymagana" / "Liczba osób musi wynosić co najmniej 1"

5. **budget_type** (rodzaj budżetu):
   - Wymagane: tak
   - Typ: string (enum)
   - Dozwolone wartości: "low", "medium", "high"
   - Komunikat błędu: "Rodzaj budżetu jest wymagany"

6. **preferences** (preferencje) - wszystkie opcjonalne:
   - transport: string, opcjonalny
   - todo: string, opcjonalny
   - avoid: string, opcjonalny

**Typy:**

- `TripPlanFormData` (dane formularza)
- `TripPlanFormErrors` (błędy walidacji)
- `GenerateTripPlanRequestDto` (output po walidacji)

**Propsy:**

```typescript
interface TripPlanFormProps {
  onSubmit: (data: GenerateTripPlanRequestDto) => void;
  isSubmitting?: boolean;
  initialData?: Partial<TripPlanFormData>;
}
```

---

### 4.3. LoadingOverlay (Komponent React)

**Opis komponentu:**
Pełnoekranowy overlay wyświetlany podczas generowania planu przez AI. Zawiera animowany spinner oraz komunikat informujący użytkownika o trwającym procesie. Zakłada się, że proces może trwać do 180 sekund.

**Główne elementy:**

- `<div>` z position fixed, full screen, z-index wysoki
- Semi-transparent backdrop (bg-black/50)
- Centered content wrapper
- Spinner animation (Shadcn Loading Spinner lub custom SVG)
- Text message: "Generowanie spersonalizowanego planu wycieczki..."
- Subtext: "To może potrwać do 3 minut"
- Opcjonalnie: Progress bar (jeśli backend wspiera progress updates)

**Obsługiwane zdarzenia:**
Brak - komponent nie obsługuje żadnych interakcji (overlay nie powinien być zamykany przez użytkownika)

**Warunki walidacji:**
Brak

**Typy:**
Brak specyficznych typów (używa prymitywów)

**Propsy:**

```typescript
interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  subMessage?: string;
}
```

---

### 4.4. ErrorDisplay (Komponent React)

**Opis komponentu:**
Komponent wyświetlający komunikaty błędów występujących podczas generowania planu. Obsługuje różne typy błędów (timeout, rate limit, błąd serwera, błąd walidacji) i dostosowuje komunikat oraz dostępne akcje.

**Główne elementy:**

- Shadcn Alert component (variant="destructive")
- Alert title z odpowiednim komunikatem błędu
- Alert description z dodatkowymi szczegółami (jeśli dostępne)
- Button "Spróbuj ponownie" - wywołuje ponowne generowanie
- Opcjonalnie: Button "Edytuj formularz" - powrót do formularza

**Obsługiwane zdarzenia:**

- `onRetry()` - ponowienie żądania generowania
- `onEditForm()` - powrót do edycji formularza

**Warunki walidacji:**
Brak

**Typy:**

- `ApiErrorResponse` (z types.ts)
- `ErrorDisplayType` (typ błędu: timeout, rate_limit, validation, server_error)

**Propsy:**

```typescript
interface ErrorDisplayProps {
  error: ApiErrorResponse | null;
  onRetry: () => void;
  onEditForm?: () => void;
}
```

---

### 4.5. GeneratedPlanSection (Komponent React)

**Opis komponentu:**
Sekcja wyświetlająca wygenerowany plan wycieczki z możliwością edycji przed akceptacją. Zawiera nagłówek planu, informacje o zakwaterowaniu, listę dni z aktywnościami oraz przyciski akcji (Regeneruj, Akceptuj).

**Główne elementy:**

- Container div z responsive layout
- PlanHeader - nagłówek z destination i metadanymi
- AccommodationCard - karta z informacjami o zakwaterowaniu (jeśli istnieje)
- DaysList - lista kart dni (DayCard dla każdego dnia)
- PlanActions - sekcja z przyciskami akcji

**Obsługiwane zdarzenia:**

- `onRegeneratePlan()` - żądanie ponownego wygenerowania
- `onAcceptPlan()` - akceptacja i zapis planu
- `onPlanChange(updatedPlan: GeneratedTripPlanDto)` - propaguje zmiany planu do górnego poziomu

**Warunki walidacji:**

- Plan musi zawierać co najmniej 1 dzień
- Każdy dzień musi mieć co najmniej 1 aktywność
- Daty dni muszą być sekwencyjne

**Typy:**

- `GeneratedTripPlanDto` (z types.ts)
- `EditableGeneratedPlan` (rozszerzenie o flagę isEdited)

**Propsy:**

```typescript
interface GeneratedPlanSectionProps {
  plan: GeneratedTripPlanDto;
  onRegeneratePlan: () => void;
  onAcceptPlan: (plan: GeneratedTripPlanDto, isEdited: boolean) => void;
  onPlanChange: (updatedPlan: GeneratedTripPlanDto) => void;
}
```

---

### 4.6. PlanHeader (Komponent React)

**Opis komponentu:**
Nagłówek sekcji wygenerowanego planu wyświetlający podstawowe informacje: cel podróży, zakres dat, liczbę osób i rodzaj budżetu.

**Główne elementy:**

- `<header>` element
- `<h1>` z nazwą celu podróży (destination)
- Metadata grid z ikonami:
  - Icon Calendar + zakres dat (start_date - end_date)
  - Icon Users + liczba osób (people_count)
  - Icon Wallet + rodzaj budżetu (budget_type)

**Obsługiwane zdarzenia:**
Brak

**Warunki walidacji:**
Brak

**Typy:**

- `GeneratedTripPlanDto` (z types.ts) - używa pól: destination, start_date, end_date, people_count, budget_type

**Propsy:**

```typescript
interface PlanHeaderProps {
  destination: string;
  startDate: string;
  endDate: string;
  peopleCount: number;
  budgetType: string;
}
```

---

### 4.7. AccommodationCard (Komponent React)

**Opis komponentu:**
Karta wyświetlająca informacje o zakwaterowaniu (hotel, apartament itp.). Umożliwia edycję szczegółów zakwaterowania.

**Główne elementy:**

- Shadcn Card component
- CardHeader z tytułem "Zakwaterowanie"
- CardContent z informacjami:
  - Nazwa zakwaterowania (name)
  - Adres (address)
  - Data zameldowania (check_in)
  - Data wymeldowania (check_out)
  - Szacowany koszt (estimated_cost) - jeśli dostępny
  - Link do rezerwacji (booking_url) - jeśli dostępny
- CardFooter z Button "Edytuj"

**Obsługiwane zdarzenia:**

- `onEdit()` - otwiera dialog/modal do edycji zakwaterowania
- `onSave(updatedAccommodation: AccommodationDto)` - zapisuje zmiany

**Warunki walidacji:**

- name: wymagane, niepuste
- address: wymagane, niepuste
- check_in: wymagane, valid date
- check_out: wymagane, valid date, >= check_in

**Typy:**

- `AccommodationDto` (z types.ts)

**Propsy:**

```typescript
interface AccommodationCardProps {
  accommodation: AccommodationDto;
  onUpdate: (updated: AccommodationDto) => void;
}
```

---

### 4.8. DayCard (Komponent React)

**Opis komponentu:**
Karta reprezentująca pojedynczy dzień w planie wycieczki. Zawiera listę aktywności dla danego dnia oraz przyciski do zarządzania dniem i aktywnościami.

**Główne elementy:**

- Shadcn Card component z border
- CardHeader:
  - `<h3>` z numerem dnia i datą (np. "Dzień 1 - 15 czerwca 2025")
  - Badge z liczbą aktywności
- CardContent:
  - ActivitiesList (lista ActivityCard)
- CardFooter:
  - Button "Dodaj aktywność"
  - Button "Usuń dzień" (icon only, destructive)

**Obsługiwane zdarzenia:**

- `onAddActivity()` - otwiera dialog dodawania nowej aktywności
- `onRemoveDay()` - usuwa cały dzień (z potwierdzeniem)
- `onActivityUpdate(activityIndex, updatedActivity)` - aktualizuje konkretną aktywność
- `onActivityRemove(activityIndex)` - usuwa aktywność

**Warunki walidacji:**

- Dzień musi mieć co najmniej 1 aktywność
- Numer dnia musi być unikalny i sekwencyjny
- Data musi być w zakresie start_date - end_date planu

**Typy:**

- `DayDto` (z types.ts)
- `ActivityDto` (z types.ts)

**Propsy:**

```typescript
interface DayCardProps {
  day: DayDto;
  onUpdate: (updated: DayDto) => void;
  onRemove: () => void;
}
```

---

### 4.9. ActivityCard (Komponent React)

**Opis komponentu:**
Karta reprezentująca pojedynczą aktywność w ramach dnia. Wyświetla szczegóły aktywności i umożliwia edycję oraz usunięcie. Wspiera drag & drop do zmiany kolejności.

**Główne elementy:**

- Shadcn Card component (compact variant)
- DragHandle icon (dla reordering)
- CardContent:
  - Time badge (time)
  - Title (title)
  - Description (description)
  - Location with icon (location)
  - Cost badge (estimated_cost) - jeśli dostępny
  - Duration badge (duration) - jeśli dostępny
  - Category badge (category) - jeśli dostępny
- CardFooter z action buttons:
  - Button "Edytuj" (icon only)
  - Button "Usuń" (icon only, destructive)

**Obsługiwane zdarzenia:**

- `onEdit()` - otwiera dialog edycji aktywności
- `onRemove()` - usuwa aktywność (z potwierdzeniem)
- `onDragStart()`, `onDragEnd()` - obsługa drag & drop

**Warunki walidacji:**

- time: wymagane, format HH:MM
- title: wymagane, niepuste
- description: wymagane, niepuste
- location: wymagane, niepuste
- estimated_cost: opcjonalny, >= 0
- duration: opcjonalny, format string (np. "2 godziny")
- category: opcjonalny, string

**Typy:**

- `ActivityDto` (z types.ts)

**Propsy:**

```typescript
interface ActivityCardProps {
  activity: ActivityDto;
  onUpdate: (updated: ActivityDto) => void;
  onRemove: () => void;
  dragHandleProps?: any; // z react-beautiful-dnd lub dnd-kit
}
```

---

### 4.10. PlanActions (Komponent React)

**Opis komponentu:**
Sekcja z przyciskami akcji dla wygenerowanego planu: "Regeneruj plan" i "Akceptuj plan".

**Główne elementy:**

- Container div z flex layout (responsive - column na mobile, row na desktop)
- Button "Regeneruj plan" (Shadcn Button variant="outline", full-width na mobile)
- Button "Akceptuj plan" (Shadcn Button variant="default", full-width na mobile)

**Obsługiwane zdarzenia:**

- `onRegenerate()` - żądanie ponownego wygenerowania (z potwierdzeniem jeśli plan był edytowany)
- `onAccept()` - akceptacja i zapis planu

**Warunki walidacji:**
Brak (walidacja odbywa się na wyższym poziomie)

**Typy:**
Brak specyficznych typów

**Propsy:**

```typescript
interface PlanActionsProps {
  onRegenerate: () => void;
  onAccept: () => void;
  isAccepting?: boolean;
  isEdited?: boolean; // dla pokazania ostrzeżenia przy regeneracji
}
```

## 5. Typy

### 5.1. Typy istniejące (z types.ts)

Następujące typy są już zdefiniowane w `src/types.ts` i będą wykorzystane:

- **GenerateTripPlanRequestDto**: Request body dla POST /api/trip-plans/generate
- **GeneratedTripPlanDto**: Response z POST /api/trip-plans/generate
- **AcceptTripPlanDto**: Request body dla POST /api/trip-plans
- **PlanDetailsDto**: Struktura szczegółów planu (days, accommodation, notes, total_estimated_cost)
- **DayDto**: Pojedynczy dzień planu (day: number, date: string, activities: ActivityDto[])
- **ActivityDto**: Pojedyncza aktywność (time, title, description, location, estimated_cost?, duration?, category?)
- **AccommodationDto**: Zakwaterowanie (name, address, check_in, check_out, estimated_cost?, booking_url?)
- **TripPlanNotesDto**: Notatki użytkownika (transport?, todo?, avoid?)
- **ApiSuccessResponse<T>**: Wrapper sukcesu API ({ data: T })
- **ApiErrorResponse**: Wrapper błędu API ({ error: { code, message, details? } })

### 5.2. Nowe typy ViewModel

Następujące typy należy stworzyć w pliku `src/types/viewModels.ts`:

```typescript
/**
 * ViewModel dla formularza tworzenia planu wycieczki
 * Używany w TripPlanForm do zarządzania stanem formularza
 */
export interface TripPlanFormData {
  destination: string;
  start_date: string; // Format: YYYY-MM-DD
  end_date: string; // Format: YYYY-MM-DD
  people_count: number;
  budget_type: string;
  preferences?: {
    transport?: string;
    todo?: string;
    avoid?: string;
  };
}

/**
 * Błędy walidacji formularza
 * Struktura odzwierciedla TripPlanFormData dla łatwego mapowania
 */
export interface TripPlanFormErrors {
  destination?: string;
  start_date?: string;
  end_date?: string;
  people_count?: string;
  budget_type?: string;
  preferences?: {
    transport?: string;
    todo?: string;
    avoid?: string;
  };
}

/**
 * Stan procesu generowania planu
 */
export type GenerationState =
  | "idle" // Początkowy stan, formularz gotowy
  | "generating" // Trwa generowanie (API call w toku)
  | "success" // Generowanie zakończone sukcesem
  | "error"; // Generowanie zakończone błędem

/**
 * Rozszerzenie GeneratedTripPlanDto o flagę śledzącą edycję
 * Używany w stanie komponentu do śledzenia czy plan został zmodyfikowany
 */
export interface EditableGeneratedPlan extends GeneratedTripPlanDto {
  isEdited: boolean; // true jeśli użytkownik dokonał jakichkolwiek zmian
}

/**
 * Stan widoku tworzenia planu
 * Główny stan zarządzany w CreateTripPlanView
 */
export interface CreateTripPlanViewState {
  formData: TripPlanFormData | null;
  generationState: GenerationState;
  generatedPlan: EditableGeneratedPlan | null;
  generationError: ApiErrorResponse | null;
  isAccepting: boolean;
}

/**
 * Typ dla akcji edycji planu
 * Używany w reducerze zarządzającym stanem planu
 */
export type PlanEditAction =
  | { type: "UPDATE_DAY"; dayIndex: number; day: DayDto }
  | { type: "REMOVE_DAY"; dayIndex: number }
  | { type: "ADD_DAY"; day: DayDto }
  | { type: "UPDATE_ACTIVITY"; dayIndex: number; activityIndex: number; activity: ActivityDto }
  | { type: "REMOVE_ACTIVITY"; dayIndex: number; activityIndex: number }
  | { type: "ADD_ACTIVITY"; dayIndex: number; activity: ActivityDto }
  | { type: "REORDER_ACTIVITIES"; dayIndex: number; fromIndex: number; toIndex: number }
  | { type: "UPDATE_ACCOMMODATION"; accommodation: AccommodationDto };

/**
 * Konfiguracja typu budżetu dla Select
 */
export interface BudgetTypeOption {
  value: string;
  label: string;
}

export const BUDGET_TYPE_OPTIONS: BudgetTypeOption[] = [
  { value: "low", label: "Niski" },
  { value: "medium", label: "Średni" },
  { value: "high", label: "Wysoki" },
];
```

### 5.3. Schemat walidacji Zod

W pliku `src/lib/validators/tripPlanForm.validator.ts`:

```typescript
import { z } from "zod";

/**
 * Funkcja pomocnicza sprawdzająca czy data nie jest w przeszłości
 */
const isNotPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset czasu do początku dnia
  return date >= today;
};

/**
 * Schemat walidacji formularza tworzenia planu
 * Zgodny z GenerateTripPlanRequestDto i wymaganiami API
 */
export const tripPlanFormSchema = z
  .object({
    destination: z
      .string()
      .min(1, "Cel podróży jest wymagany")
      .max(256, "Cel podróży może mieć maksymalnie 256 znaków"),

    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie YYYY-MM-DD")
      .refine(isNotPastDate, "Data rozpoczęcia nie może być w przeszłości"),

    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data musi być w formacie YYYY-MM-DD"),

    people_count: z
      .number()
      .int("Liczba osób musi być liczbą całkowitą")
      .min(1, "Liczba osób musi wynosić co najmniej 1")
      .max(50, "Liczba osób nie może przekraczać 50"),

    budget_type: z.enum(["low", "medium", "high"], {
      errorMap: () => ({ message: "Wybierz rodzaj budżetu" }),
    }),

    preferences: z
      .object({
        transport: z.string().optional(),
        todo: z.string().optional(),
        avoid: z.string().optional(),
      })
      .optional(),
  })
  .refine((data) => new Date(data.end_date) >= new Date(data.start_date), {
    message: "Data zakończenia musi być równa lub późniejsza niż data rozpoczęcia",
    path: ["end_date"],
  });

export type TripPlanFormSchema = z.infer<typeof tripPlanFormSchema>;
```

## 6. Zarządzanie stanem

### 6.1. Stan główny widoku

Stan widoku będzie zarządzany w głównym komponencie strony (Astro + React) za pomocą `useState` oraz custom hooków.

**Główne zmienne stanu:**

```typescript
const [viewState, setViewState] = useState<CreateTripPlanViewState>({
  formData: null,
  generationState: "idle",
  generatedPlan: null,
  generationError: null,
  isAccepting: false,
});
```

### 6.2. Custom Hooks

#### Hook: useTripPlanGeneration

**Lokalizacja:** `src/hooks/useTripPlanGeneration.ts`

**Cel:** Zarządzanie procesem generowania planu (wywołanie API, obsługa timeout, retry logic)

**Implementacja:**

```typescript
interface UseTripPlanGenerationReturn {
  generatePlan: (formData: GenerateTripPlanRequestDto) => Promise<void>;
  isGenerating: boolean;
  generatedPlan: GeneratedTripPlanDto | null;
  error: ApiErrorResponse | null;
  reset: () => void;
}

export function useTripPlanGeneration(): UseTripPlanGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedTripPlanDto | null>(null);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const generatePlan = async (formData: GenerateTripPlanRequestDto) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/trip-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setError(errorData);
        return;
      }

      const result: ApiSuccessResponse<GeneratedTripPlanDto> = await response.json();
      setGeneratedPlan(result.data);
    } catch (err) {
      setError({
        error: {
          code: "NETWORK_ERROR",
          message: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.",
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setGeneratedPlan(null);
    setError(null);
  };

  return { generatePlan, isGenerating, generatedPlan, error, reset };
}
```

#### Hook: usePlanEditor

**Lokalizacja:** `src/hooks/usePlanEditor.ts`

**Cel:** Zarządzanie edycją wygenerowanego planu, śledzenie zmian (flagę isEdited)

**Implementacja:**

```typescript
interface UsePlanEditorReturn {
  editablePlan: EditableGeneratedPlan | null;
  updatePlan: (action: PlanEditAction) => void;
  isEdited: boolean;
  setPlan: (plan: GeneratedTripPlanDto) => void;
}

export function usePlanEditor(initialPlan: GeneratedTripPlanDto | null): UsePlanEditorReturn {
  const [editablePlan, setEditablePlan] = useState<EditableGeneratedPlan | null>(
    initialPlan ? { ...initialPlan, isEdited: false } : null
  );

  useEffect(() => {
    if (initialPlan) {
      setEditablePlan({ ...initialPlan, isEdited: false });
    }
  }, [initialPlan]);

  const updatePlan = (action: PlanEditAction) => {
    if (!editablePlan) return;

    // Implementacja reducer logic dla różnych akcji edycji
    // Przykład dla UPDATE_DAY:
    if (action.type === "UPDATE_DAY") {
      const updatedDays = [...editablePlan.plan_details.days];
      updatedDays[action.dayIndex] = action.day;

      setEditablePlan({
        ...editablePlan,
        plan_details: {
          ...editablePlan.plan_details,
          days: updatedDays,
        },
        isEdited: true, // Oznacz jako edytowany
      });
    }
    // ... pozostałe akcje
  };

  const setPlan = (plan: GeneratedTripPlanDto) => {
    setEditablePlan({ ...plan, isEdited: false });
  };

  return {
    editablePlan,
    updatePlan,
    isEdited: editablePlan?.isEdited ?? false,
    setPlan,
  };
}
```

#### Hook: useAcceptPlan

**Lokalizacja:** `src/hooks/useAcceptPlan.ts`

**Cel:** Obsługa akceptacji planu i zapisu do bazy danych

**Implementacja:**

```typescript
interface UseAcceptPlanReturn {
  acceptPlan: (plan: EditableGeneratedPlan) => Promise<TripPlanDto | null>;
  isAccepting: boolean;
  error: ApiErrorResponse | null;
}

export function useAcceptPlan(): UseAcceptPlanReturn {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  const acceptPlan = async (plan: EditableGeneratedPlan): Promise<TripPlanDto | null> => {
    setIsAccepting(true);
    setError(null);

    const requestBody: AcceptTripPlanDto = {
      generation_id: plan.generation_id,
      destination: plan.destination,
      start_date: plan.start_date,
      end_date: plan.end_date,
      people_count: plan.people_count,
      budget_type: plan.budget_type,
      plan_details: plan.plan_details,
      source: plan.isEdited ? "ai-edited" : "ai",
    };

    try {
      const response = await fetch("/api/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setError(errorData);
        return null;
      }

      const result: ApiSuccessResponse<TripPlanDto> = await response.json();
      return result.data;
    } catch (err) {
      setError({
        error: {
          code: "NETWORK_ERROR",
          message: "Nie udało się zapisać planu. Sprawdź połączenie internetowe.",
        },
      });
      return null;
    } finally {
      setIsAccepting(false);
    }
  };

  return { acceptPlan, isAccepting, error };
}
```

#### Hook: useTripPlanForm (opcjonalny - można użyć react-hook-form)

**Lokalizacja:** `src/hooks/useTripPlanForm.ts`

**Cel:** Zarządzanie stanem formularza, walidacją (można alternatywnie użyć biblioteki react-hook-form + zod resolver)

**Rekomendacja:** Użycie `react-hook-form` z `@hookform/resolvers/zod` dla lepszego zarządzania formularzem.

## 7. Integracja API

### 7.1. POST /api/trip-plans/generate

**Endpoint:** `/api/trip-plans/generate`

**Metoda:** POST

**Cel:** Wygenerowanie nowego planu wycieczki przy użyciu AI

**Request Body Type:** `GenerateTripPlanRequestDto`

```typescript
interface GenerateTripPlanRequestDto {
  destination: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  people_count: number;
  budget_type: string;
  notes?: TripPlanNotesDto;
}
```

**Response Type (Success - 200):** `ApiSuccessResponse<GeneratedTripPlanDto>`

```typescript
interface ApiSuccessResponse<GeneratedTripPlanDto> {
  data: {
    generation_id: string; // UUID
    destination: string;
    start_date: string;
    end_date: string;
    people_count: number;
    budget_type: string;
    plan_details: PlanDetailsDto;
  };
}
```

**Error Responses:**

- **400 Bad Request**: Błąd walidacji (np. end_date < start_date, brak wymaganych pól)
- **401 Unauthorized**: Brak lub nieprawidłowy token uwierzytelniający
- **408 Request Timeout**: Generowanie AI przekroczyło 180 sekund
- **429 Too Many Requests**: Przekroczony limit zapytań
- **500 Internal Server Error**: Błąd generowania AI

**Wywołanie w kodzie:**

```typescript
const { generatePlan, isGenerating, generatedPlan, error } = useTripPlanGeneration();

const handleSubmit = async (formData: TripPlanFormData) => {
  const requestData: GenerateTripPlanRequestDto = {
    destination: formData.destination,
    start_date: formData.start_date,
    end_date: formData.end_date,
    people_count: formData.people_count,
    budget_type: formData.budget_type,
    notes: formData.preferences,
  };

  await generatePlan(requestData);
};
```

### 7.2. POST /api/trip-plans

**Endpoint:** `/api/trip-plans`

**Metoda:** POST

**Cel:** Akceptacja i zapis wygenerowanego planu do bazy danych

**Request Body Type:** `AcceptTripPlanDto`

```typescript
interface AcceptTripPlanDto {
  generation_id?: string | null; // Opcjonalny UUID linkujący do generacji
  destination: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  people_count: number;
  budget_type: string;
  plan_details: PlanDetailsDto;
  source: "ai" | "ai-edited"; // Krytyczne dla analityki!
}
```

**Response Type (Success - 201):** `ApiSuccessResponse<TripPlanDto>`

```typescript
interface ApiSuccessResponse<TripPlanDto> {
  data: {
    id: string; // UUID zapisanego planu
    destination: string;
    start_date: string;
    end_date: string;
    people_count: number;
    budget_type: string;
    plan_details: PlanDetailsDto;
  };
}
```

**Error Responses:**

- **400 Bad Request**: Błąd walidacji (np. puste plan_details, nieprawidłowa wartość source)
- **401 Unauthorized**: Brak lub nieprawidłowy token uwierzytelniający

**Wywołanie w kodzie:**

```typescript
const { acceptPlan, isAccepting, error } = useAcceptPlan();

const handleAcceptPlan = async (editablePlan: EditableGeneratedPlan) => {
  const savedPlan = await acceptPlan(editablePlan);

  if (savedPlan) {
    // Sukces - przekieruj do listy planów lub szczegółów
    window.location.href = `/trip-plans/${savedPlan.id}`;
  }
};
```

## 8. Interakcje użytkownika

### 8.1. Wypełnienie formularza i generowanie planu

**Kroki:**

1. Użytkownik wchodzi na stronę `/trip-plans/new`
2. Widzi formularz z polami: cel podróży, data rozpoczęcia, data zakończenia, liczba osób, budżet
3. Wypełnia wymagane pola
4. Opcjonalnie rozWija sekcję "Preferencje" i uzupełnia: transport, co chcę robić, czego unikać
5. Klika przycisk "Generuj plan"

**Reakcja systemu:**

- Formularz waliduje dane po stronie klienta (Zod schema)
- Jeśli walidacja nie przejdzie → wyświetl błędy walidacji przy odpowiednich polach
- Jeśli walidacja przejdzie → wywołaj POST /api/trip-plans/generate
- Wyświetl LoadingOverlay z komunikatem "Generowanie spersonalizowanego planu wycieczki... To może potrwać do 3 minut"
- Czekaj na odpowiedź (do 180 sekund)

**Możliwe wyniki:**

- **Sukces**: Ukryj LoadingOverlay, wyświetl GeneratedPlanSection z wygenerowanym planem
- **Błąd**: Ukryj LoadingOverlay, wyświetl ErrorDisplay z komunikatem błędu i przyciskiem "Spróbuj ponownie"

### 8.2. Przeglądanie wygenerowanego planu

**Kroki:**

1. Po udanym wygenerowaniu użytkownik widzi GeneratedPlanSection
2. Może przewijać i przeglądać:
   - Nagłówek z celem podróży i metadanymi
   - Kartę zakwaterowania (jeśli dostępna)
   - Karty dni z aktywnościami

**Reakcja systemu:**

- Wyświetla wszystkie elementy planu w czytelnym formacie
- Każda karta dni zawiera listę aktywności z czasami, tytułami, opisami, lokalizacjami i kosztami

### 8.3. Edycja wygenerowanego planu

**Możliwe akcje:**

#### 8.3.1. Edycja zakwaterowania

1. Użytkownik klika "Edytuj" na AccommodationCard
2. Otwiera się dialog/modal z formularzem edycji
3. Użytkownik modyfikuje dane (nazwa, adres, daty, koszt)
4. Klika "Zapisz"

**Reakcja systemu:**

- Aktualizuje dane zakwaterowania w stanie (updatePlan action)
- Ustawia flagę isEdited = true
- Zamyka dialog, wyświetla zaktualizowane dane

#### 8.3.2. Edycja aktywności

1. Użytkownik klika "Edytuj" na ActivityCard
2. Otwiera się dialog/modal z formularzem edycji
3. Użytkownik modyfikuje dane (czas, tytuł, opis, lokalizacja, koszt, czas trwania)
4. Klika "Zapisz"

**Reakcja systemu:**

- Aktualizuje aktywność w odpowiednim dniu (UPDATE_ACTIVITY action)
- Ustawia flagę isEdited = true
- Zamyka dialog, wyświetla zaktualizowane dane

#### 8.3.3. Usunięcie aktywności

1. Użytkownik klika "Usuń" na ActivityCard
2. Pojawia się dialog potwierdzenia: "Czy na pewno chcesz usunąć tę aktywność?"
3. Użytkownik klika "Usuń"

**Reakcja systemu:**

- Usuwa aktywność z dnia (REMOVE_ACTIVITY action)
- Ustawia flagę isEdited = true
- Jeśli dzień pozostaje bez aktywności → pokaż ostrzeżenie lub usuń cały dzień

#### 8.3.4. Dodanie nowej aktywności

1. Użytkownik klika "Dodaj aktywność" na DayCard
2. Otwiera się dialog z pustym formularzem aktywności
3. Użytkownik wypełnia dane (czas, tytuł, opis, lokalizacja, opcjonalnie koszt i czas trwania)
4. Klika "Dodaj"

**Reakcja systemu:**

- Dodaje nową aktywność do dnia (ADD_ACTIVITY action)
- Ustawia flagę isEdited = true
- Zamyka dialog, wyświetla nową aktywność na liście

#### 8.3.5. Usunięcie całego dnia

1. Użytkownik klika "Usuń dzień" na DayCard
2. Pojawia się dialog potwierdzenia: "Czy na pewno chcesz usunąć cały dzień wraz z aktywnościami?"
3. Użytkownik klika "Usuń"

**Reakcja systemu:**

- Usuwa cały dzień z planu (REMOVE_DAY action)
- Ustawia flagę isEdited = true
- Jeśli plan pozostaje bez dni → pokaż komunikat błędu (plan musi mieć co najmniej 1 dzień)

#### 8.3.6. Zmiana kolejności aktywności (drag & drop)

1. Użytkownik chwyta DragHandle na ActivityCard
2. Przeciąga aktywność w górę lub w dół w ramach dnia
3. Upuszcza aktywność w nowej pozycji

**Reakcja systemu:**

- Zmienia kolejność aktywności w dniu (REORDER_ACTIVITIES action)
- Ustawia flagę isEdited = true
- Natychmiast aktualizuje widok

### 8.4. Regeneracja planu

**Kroki:**

1. Użytkownik klika "Regeneruj plan" w sekcji PlanActions
2. Jeśli plan był edytowany (isEdited = true) → pojawia się dialog potwierdzenia: "Regenerowanie planu usunie Twoje zmiany. Czy chcesz kontynuować?"
3. Użytkownik klika "Regeneruj" lub "Anuluj"

**Reakcja systemu:**

- Jeśli anulowano → nic się nie dzieje
- Jeśli potwierdzono:
  - Wywołuje ponownie POST /api/trip-plans/generate z tymi samymi danymi formularza
  - Wyświetla LoadingOverlay
  - Czeka na nowy plan (do 180 sekund)
  - Po sukcesie → zastępuje stary plan nowym, resetuje isEdited = false
  - Po błędzie → wyświetla ErrorDisplay

### 8.5. Akceptacja planu

**Kroki:**

1. Użytkownik klika "Akceptuj plan" w sekcji PlanActions
2. System sprawdza flagę isEdited
3. Przygotowuje AcceptTripPlanDto z odpowiednim source ("ai" lub "ai-edited")
4. Wywołuje POST /api/trip-plans

**Reakcja systemu:**

- Wyświetla loading indicator na przycisku "Akceptuj plan"
- Jeśli sukces (201):
  - Przekierowuje do `/trip-plans` (lista planów) lub `/trip-plans/{id}` (szczegóły zapisanego planu)
  - Opcjonalnie: pokazuje toast/notification "Plan został zapisany!"
- Jeśli błąd:
  - Wyświetla komunikat błędu w ErrorDisplay
  - Zachowuje plan w interfejsie, umożliwia ponowienie akcji

### 8.6. Obsługa błędów generowania

**Kroki:**

1. Generowanie kończy się błędem (timeout, błąd AI, błąd walidacji)
2. System wyświetla ErrorDisplay z odpowiednim komunikatem

**Możliwe komunikaty błędów:**

- **400 Validation Error**: "Nieprawidłowe dane formularza: [szczegóły]"
- **401 Unauthorized**: "Sesja wygasła. Zaloguj się ponownie." + przekierowanie do /login
- **408 Timeout**: "Generowanie planu przekroczyło limit czasu. Spróbuj ponownie."
- **429 Rate Limit**: "Przekroczono limit zapytań. Poczekaj chwilę i spróbuj ponownie."
- **500 Server Error**: "Wystąpił błąd podczas generowania planu. Spróbuj ponownie."
- **Network Error**: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."

**Dostępne akcje:**

- Przycisk "Spróbuj ponownie" → ponowne wywołanie generatePlan z tymi samymi danymi
- Przycisk "Edytuj formularz" → powrót do formularza (ukrycie błędu, wyświetlenie formularza z wypełnionymi danymi)

## 9. Warunki i walidacja

### 9.1. Walidacja formularza (TripPlanForm)

**Warunki weryfikowane przed wysłaniem żądania do API:**

1. **destination (cel podróży)**
   - Warunek: niepuste, min. 1 znak
   - Komponent: TripPlanForm
   - Wpływ na UI: jeśli błąd → czerwona ramka wokół pola, komunikat błędu pod polem
   - Blokada: przycisk "Generuj plan" disabled jeśli pole puste

2. **start_date (data rozpoczęcia)**
   - Warunek: data >= dzisiaj (nie może być w przeszłości)
   - Format: YYYY-MM-DD
   - Komponent: TripPlanForm (DatePicker)
   - Wpływ na UI: jeśli błąd → czerwona ramka, komunikat "Data nie może być w przeszłości"
   - Blokada: przycisk "Generuj plan" disabled jeśli warunek nie spełniony

3. **end_date (data zakończenia)**
   - Warunek: end_date >= start_date
   - Format: YYYY-MM-DD
   - Komponent: TripPlanForm (DatePicker)
   - Wpływ na UI: jeśli błąd → czerwona ramka, komunikat "Data zakończenia musi być równa lub późniejsza niż data rozpoczęcia"
   - Blokada: przycisk "Generuj plan" disabled jeśli warunek nie spełniony

4. **people_count (liczba osób)**
   - Warunek: >= 1, liczba całkowita
   - Komponent: TripPlanForm (Input type="number")
   - Wpływ na UI: jeśli błąd → czerwona ramka, komunikat "Liczba osób musi wynosić co najmniej 1"
   - Blokada: przycisk "Generuj plan" disabled jeśli warunek nie spełniony

5. **budget_type (rodzaj budżetu)**
   - Warunek: musi być wybrany (low/medium/high)
   - Komponent: TripPlanForm (Select)
   - Wpływ na UI: jeśli błąd → czerwona ramka, komunikat "Wybierz rodzaj budżetu"
   - Blokada: przycisk "Generuj plan" disabled jeśli nie wybrano

6. **preferences (preferencje) - wszystkie opcjonalne**
   - Brak warunków wymaganych
   - Komponent: TripPlanForm (Collapsible z Textarea)
   - Wpływ na UI: brak blokad, pola mogą być puste

### 9.2. Walidacja podczas edycji planu

**Warunki weryfikowane w komponentach edycji:**

1. **DayCard - warunek istnienia aktywności**
   - Warunek: dzień musi mieć co najmniej 1 aktywność
   - Komponent: DayCard
   - Wpływ na UI: jeśli użytkownik próbuje usunąć ostatnią aktywność → pokaż komunikat "Dzień musi zawierać co najmniej jedną aktywność" i zablokuj akcję
   - Alternatywa: usuń cały dzień jeśli nie ma aktywności

2. **DayCard - warunek sekwencyjności dni**
   - Warunek: numery dni muszą być sekwencyjne (1, 2, 3...)
   - Komponent: GeneratedPlanSection (logika wyższego poziomu)
   - Wpływ na UI: automatyczne przenumerowanie dni po dodaniu/usunięciu

3. **ActivityCard - walidacja czasu**
   - Warunek: czas w formacie HH:MM (np. 09:00, 14:30)
   - Komponent: ActivityCard (dialog edycji)
   - Wpływ na UI: jeśli błąd → czerwona ramka, komunikat "Czas musi być w formacie GG:MM"

4. **ActivityCard - warunek wymaganych pól**
   - Warunki:
     - time: wymagane
     - title: wymagane, niepuste
     - description: wymagane, niepuste
     - location: wymagane, niepuste
   - Komponent: ActivityCard (dialog edycji)
   - Wpływ na UI: jeśli błąd → czerwona ramka przy polu, przycisk "Zapisz" disabled

5. **AccommodationCard - walidacja dat**
   - Warunki:
     - check_in: wymagane, valid date
     - check_out: wymagane, valid date, >= check_in
   - Komponent: AccommodationCard (dialog edycji)
   - Wpływ na UI: jeśli błąd → czerwona ramka, komunikat "Data wymeldowania musi być późniejsza niż data zameldowania"

### 9.3. Walidacja przed akceptacją planu

**Warunki weryfikowane przed wywołaniem POST /api/trip-plans:**

1. **Plan musi zawierać co najmniej 1 dzień**
   - Komponent: GeneratedPlanSection
   - Wpływ na UI: jeśli warunek nie spełniony → przycisk "Akceptuj plan" disabled, komunikat "Plan musi zawierać co najmniej jeden dzień"

2. **Każdy dzień musi mieć co najmniej 1 aktywność**
   - Komponent: GeneratedPlanSection
   - Wpływ na UI: jeśli warunek nie spełniony → przycisk "Akceptuj plan" disabled, komunikat "Każdy dzień musi zawierać co najmniej jedną aktywność"

3. **Sprawdzenie flagi isEdited dla określenia source**
   - Komponent: GeneratedPlanSection (logika przed wywołaniem API)
   - Wpływ: automatyczne ustawienie source = "ai" lub "ai-edited" w AcceptTripPlanDto

## 10. Obsługa błędów

### 10.1. Błędy walidacji formularza (klient)

**Scenariusz:** Użytkownik wypełnił formularz niepoprawnie i próbuje wygenerować plan

**Obsługa:**

- Walidacja Zod schema wykrywa błędy
- Wyświetl komunikaty błędów przy odpowiednich polach formularza
- Zablokuj przycisk "Generuj plan" (disabled) dopóki błędy nie zostaną naprawione
- Nie wykonuj wywołania API

**Przykładowe komunikaty:**

- "Cel podróży jest wymagany"
- "Data rozpoczęcia nie może być w przeszłości"
- "Data zakończenia musi być późniejsza niż data rozpoczęcia"
- "Liczba osób musi wynosić co najmniej 1"

### 10.2. Błędy API - Generowanie planu

#### 10.2.1. 400 Bad Request (błąd walidacji po stronie serwera)

**Scenariusz:** Server-side walidacja wykryła błąd (np. nieprawidłowy format daty)

**Obsługa:**

- Wyświetl ErrorDisplay z komunikatem z API
- Jeśli API zwraca `details` z nazwami pól → pokaż błędy przy konkretnych polach w formularzu
- Przycisk "Edytuj formularz" → powrót do formularza z wypełnionymi danymi

**Komunikat:**

```
"Nieprawidłowe dane formularza"
[Szczegóły z API, np. "end_date: Data zakończenia musi być późniejsza"]
```

#### 10.2.2. 401 Unauthorized

**Scenariusz:** Użytkownik nie jest zalogowany lub sesja wygasła

**Obsługa:**

- Wyświetl komunikat: "Sesja wygasła. Zostaniesz przekierowany do logowania."
- Po 2 sekundach przekieruj do `/login`
- Zapisz URL `/trip-plans/new` w sessionStorage, aby po zalogowaniu wrócić do formularza

#### 10.2.3. 408 Request Timeout

**Scenariusz:** Generowanie AI przekroczyło 180 sekund

**Obsługa:**

- Ukryj LoadingOverlay
- Wyświetl ErrorDisplay z komunikatem:
  ```
  "Generowanie planu przekroczyło limit czasu"
  "Proces generowania planu trwał zbyt długo. Spróbuj ponownie z prostszymi wymaganiami."
  ```
- Przycisk "Spróbuj ponownie" → ponowne wywołanie generatePlan
- Przycisk "Edytuj formularz" → powrót do formularza

#### 10.2.4. 429 Too Many Requests

**Scenariusz:** Użytkownik wykonał zbyt wiele żądań w krótkim czasie

**Obsługa:**

- Wyświetl ErrorDisplay z komunikatem:
  ```
  "Przekroczono limit zapytań"
  "Wykonałeś zbyt wiele prób generowania. Poczekaj chwilę i spróbuj ponownie."
  ```
- Przycisk "Spróbuj ponownie" disabled przez 30 sekund (countdown timer)
- Po 30 sekundach przycisk staje się aktywny

#### 10.2.5. 500 Internal Server Error

**Scenariusz:** Błąd po stronie serwera lub błąd AI

**Obsługa:**

- Wyświetl ErrorDisplay z komunikatem:
  ```
  "Wystąpił błąd podczas generowania planu"
  "Przepraszamy, nie udało się wygenerować planu. Spróbuj ponownie za chwilę."
  ```
- Przycisk "Spróbuj ponownie"
- Opcjonalnie: przycisk "Zgłoś problem" (mailto: lub link do support)

#### 10.2.6. Network Error

**Scenariusz:** Brak połączenia z internetem, problem z siecią

**Obsługa:**

- Wyświetl ErrorDisplay z komunikatem:
  ```
  "Brak połączenia z internetem"
  "Sprawdź swoje połączenie internetowe i spróbuj ponownie."
  ```
- Przycisk "Spróbuj ponownie"

### 10.3. Błędy API - Akceptacja planu

#### 10.3.1. 400 Bad Request

**Scenariusz:** Błąd walidacji przy zapisie planu (np. puste plan_details)

**Obsługa:**

- Wyświetl komunikat błędu w AlertDialog:
  ```
  "Nie udało się zapisać planu"
  [Szczegóły z API]
  ```
- Zachowaj plan w interfejsie
- Przycisk "Spróbuj ponownie"

#### 10.3.2. 401 Unauthorized

**Scenariusz:** Sesja wygasła podczas edycji planu

**Obsługa:**

- Zapisz edytowany plan w localStorage (fallback)
- Wyświetl komunikat: "Sesja wygasła. Zaloguj się ponownie, aby zapisać plan."
- Przekieruj do `/login`
- Po zalogowaniu: przywróć plan z localStorage i pokaż opcję "Kontynuuj edycję"

#### 10.3.3. Network Error

**Scenariusz:** Brak połączenia podczas zapisu

**Obsługa:**

- Zapisz plan w localStorage jako backup
- Wyświetl komunikat:
  ```
  "Nie udało się połączyć z serwerem"
  "Plan został zapisany lokalnie. Spróbuj zapisać ponownie, gdy połączenie zostanie przywrócone."
  ```
- Przycisk "Spróbuj ponownie"

### 10.4. Błędy edycji planu (klient)

#### 10.4.1. Próba usunięcia ostatniej aktywności

**Scenariusz:** Użytkownik próbuje usunąć ostatnią aktywność w dniu

**Obsługa:**

- Wyświetl AlertDialog z komunikatem:
  ```
  "Nie można usunąć aktywności"
  "Dzień musi zawierać co najmniej jedną aktywność. Usuń cały dzień lub dodaj najpierw nową aktywność."
  ```
- Przyciski: "Usuń cały dzień" / "Anuluj"

#### 10.4.2. Próba akceptacji planu bez dni

**Scenariusz:** Użytkownik usunął wszystkie dni i próbuje zaakceptować plan

**Obsługa:**

- Przycisk "Akceptuj plan" pozostaje disabled
- Wyświetl komunikat ostrzegawczy nad przyciskami:
  ```
  "Plan musi zawierać co najmniej jeden dzień z aktywnościami"
  ```

### 10.5. Przypadki brzegowe

#### 10.5.1. Bardzo długi plan (wiele dni)

**Scenariusz:** Plan ma > 14 dni, payload może być duży

**Obsługa:**

- Przed wysłaniem sprawdź rozmiar JSON.stringify(plan_details)
- Jeśli > 500KB → wyświetl ostrzeżenie:
  ```
  "Plan jest bardzo duży i może nie zostać zapisany. Rozważ skrócenie liczby dni lub aktywności."
  ```
- Pozwól użytkownikowi kontynuować lub edytować

#### 10.5.2. Regeneracja po długiej edycji

**Scenariusz:** Użytkownik spędził dużo czasu na edycji i przypadkowo klika "Regeneruj"

**Obsługa:**

- Wyświetl AlertDialog z potwierdzeniem:
  ```
  "Regenerowanie usunie Twoje zmiany"
  "Czy na pewno chcesz wygenerować nowy plan? Wszystkie wprowadzone zmiany zostaną utracone."
  ```
- Przyciski: "Regeneruj" (destructive) / "Anuluj"

#### 10.5.3. Utrata połączenia podczas generowania

**Scenariusz:** Użytkownik traci połączenie w trakcie generowania (po 60 sekundach)

**Obsługa:**

- Fetch automatycznie rzuci błąd sieciowy po timeout
- Wyświetl komunikat:
  ```
  "Utracono połączenie podczas generowania"
  "Sprawdź połączenie internetowe i spróbuj ponownie."
  ```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów i walidacji

1. Stwórz plik `src/types/viewModels.ts` i zdefiniuj typy ViewModel (TripPlanFormData, TripPlanFormErrors, GenerationState, EditableGeneratedPlan, CreateTripPlanViewState, PlanEditAction, BudgetTypeOption)
2. Stwórz plik `src/lib/validators/tripPlanForm.validator.ts` i zaimplementuj schemat Zod `tripPlanFormSchema`
3. Upewnij się, że wszystkie potrzebne typy z `src/types.ts` są poprawnie eksportowane

### Krok 2: Implementacja custom hooks

1. Stwórz `src/hooks/useTripPlanGeneration.ts`:
   - Implementuj logikę wywołania POST /api/trip-plans/generate
   - Dodaj obsługę stanów: isGenerating, generatedPlan, error
   - Dodaj funkcję generatePlan i reset
2. Stwórz `src/hooks/usePlanEditor.ts`:
   - Implementuj reducer dla akcji edycji planu (PlanEditAction)
   - Dodaj logikę śledzenia flagi isEdited
   - Dodaj funkcje updatePlan i setPlan
3. Stwórz `src/hooks/useAcceptPlan.ts`:
   - Implementuj logikę wywołania POST /api/trip-plans
   - Dodaj obsługę stanów: isAccepting, error
   - Dodaj funkcję acceptPlan zwracającą TripPlanDto lub null

### Krok 3: Implementacja komponentów atomowych

1. **LoadingOverlay** (`src/components/trip-plans/LoadingOverlay.tsx`):
   - Stwórz komponent z pełnoekranowym overlay
   - Dodaj animowany spinner (Shadcn Spinner lub custom SVG)
   - Dodaj teksty: message i subMessage
   - Styluj z Tailwind (fixed, inset-0, z-50, bg-black/50)

2. **ErrorDisplay** (`src/components/trip-plans/ErrorDisplay.tsx`):
   - Użyj Shadcn Alert (variant="destructive")
   - Wyświetl error.message z ApiErrorResponse
   - Dodaj przyciski: "Spróbuj ponownie", "Edytuj formularz"
   - Obsłuż różne typy błędów (timeout, rate_limit, validation, server_error)

### Krok 4: Implementacja formularza

1. **TripPlanForm** (`src/components/trip-plans/TripPlanForm.tsx`):
   - Użyj `react-hook-form` z `@hookform/resolvers/zod`
   - Podłącz schemat walidacji `tripPlanFormSchema`
   - Zaimplementuj pola formularza:
     - Input (destination)
     - Shadcn DatePicker (start_date, end_date)
     - Input type="number" (people_count)
     - Shadcn Select (budget_type) z opcjami: low, medium, high
     - Shadcn Collapsible z Textarea (preferences.transport, todo, avoid)
   - Dodaj przycisk "Generuj plan" (disabled jeśli formularz niepoprawny)
   - Obsłuż onSubmit → wywołanie props.onSubmit z walidowanymi danymi
   - Styluj responsywnie (mobile-first, stack fields vertically)

### Krok 5: Implementacja komponentów edycji planu

1. **ActivityCard** (`src/components/trip-plans/ActivityCard.tsx`):
   - Użyj Shadcn Card (compact variant)
   - Wyświetl: time badge, title, description, location (z ikoną), cost badge, duration badge
   - Dodaj przyciski: "Edytuj" (icon), "Usuń" (icon, destructive)
   - Dodaj DragHandle dla drag & drop (użyj `@dnd-kit/core` lub `react-beautiful-dnd`)
   - Dodaj dialog edycji (Shadcn Dialog) z formularzem aktywności

2. **DayCard** (`src/components/trip-plans/DayCard.tsx`):
   - Użyj Shadcn Card
   - CardHeader: dzień + data + badge z liczbą aktywności
   - CardContent: lista ActivityCard
   - CardFooter: "Dodaj aktywność", "Usuń dzień"
   - Implementuj drag & drop dla aktywności w ramach dnia

3. **AccommodationCard** (`src/components/trip-plans/AccommodationCard.tsx`):
   - Użyj Shadcn Card
   - Wyświetl: name, address, check_in - check_out, cost, booking_url (link)
   - Dodaj przycisk "Edytuj"
   - Dodaj dialog edycji (Shadcn Dialog) z formularzem zakwaterowania

### Krok 6: Implementacja sekcji wygenerowanego planu

1. **PlanHeader** (`src/components/trip-plans/PlanHeader.tsx`):
   - Wyświetl destination jako h1
   - Wyświetl metadata grid z ikonami (Calendar, Users, Wallet)
   - Styluj responsywnie

2. **PlanActions** (`src/components/trip-plans/PlanActions.tsx`):
   - Dodaj Button "Regeneruj plan" (variant="outline")
   - Dodaj Button "Akceptuj plan" (variant="default", loading state jeśli isAccepting)
   - Styluj: flex row na desktop, column na mobile, full-width buttons

3. **GeneratedPlanSection** (`src/components/trip-plans/GeneratedPlanSection.tsx`):
   - Połącz wszystkie komponenty: PlanHeader, AccommodationCard, lista DayCard, PlanActions
   - Użyj hooka usePlanEditor do zarządzania edycjami
   - Propaguj zmiany do góry przez props.onPlanChange
   - Obsłuż onRegeneratePlan (z potwierdzeniem jeśli isEdited)
   - Obsłuż onAcceptPlan (wywołanie props.onAcceptPlan z planem i flagą isEdited)

### Krok 7: Implementacja głównej strony

1. **CreateTripPlanView** (`src/pages/trip-plans/new.astro`):
   - Dodaj middleware auth (sprawdzenie czy użytkownik zalogowany)
   - Stwórz główny komponent React który orchestruje całość
   - Użyj hooków: useTripPlanGeneration, usePlanEditor, useAcceptPlan
   - Zarządzaj stanem widoku (CreateTripPlanViewState)
   - Implementuj przepływ:
     - Początek: pokaż TripPlanForm
     - Po submit: wywołaj generatePlan, pokaż LoadingOverlay
     - Po sukcesie generowania: pokaż GeneratedPlanSection
     - Po błędzie: pokaż ErrorDisplay
     - Po akceptacji: przekieruj do /trip-plans lub /trip-plans/{id}
   - Dodaj obsługę wszystkich interakcji użytkownika (regeneracja, edycja, akceptacja)

### Krok 8: Stylowanie i responsywność

1. Upewnij się, że wszystkie komponenty są responsywne (mobile-first)
2. Przetestuj na różnych rozmiarach ekranów (< 400px, tablet, desktop)
3. Użyj Tailwind utilities: sm:, md:, lg: dla breakpoints
4. Upewnij się, że drag & drop działa na urządzeniach dotykowych
5. Dodaj odpowiednie focus states dla a11y (keyboard navigation)

### Krok 9: Testowanie i edge cases

1. Przetestuj wszystkie scenariusze użytkownika (US-004 do US-007)
2. Przetestuj obsługę błędów (timeout, rate limit, validation errors)
3. Przetestuj długie plany (> 10 dni, wiele aktywności)
4. Przetestuj edycję i śledzenie flagi isEdited
5. Przetestuj regenerację z/bez edycji (potwierdzenie)
6. Przetestuj akceptację z różnymi wartościami source ("ai" vs "ai-edited")
7. Przetestuj responsywność na różnych urządzeniach

### Krok 10: Optymalizacja i finalizacja

1. Dodaj lazy loading dla komponentów (React.lazy dla GeneratedPlanSection)
2. Zoptymalizuj re-renders (React.memo dla ActivityCard, DayCard)
3. Dodaj analytics tracking (opcjonalnie):
   - Track event: "plan_generation_started"
   - Track event: "plan_generation_success" / "plan_generation_failed"
   - Track event: "plan_edited" (po każdej edycji)
   - Track event: "plan_accepted" z parametrem source
4. Dodaj error logging (Sentry lub podobne)
5. Przegląd kodu i dokumentacja
6. Deploy i monitoring

---

**Koniec planu implementacji**
