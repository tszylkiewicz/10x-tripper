# Architektura UI dla Tripper

## 1. Przegląd struktury UI

Aplikacja Tripper składa się z dwóch głównych warstw interfejsu:

1. **Publiczna** – widoki niezabezpieczone: logowanie, rejestracja, reset hasła.
2. **Prywatna** – widoki wymagające uwierzytelnienia (dashboard, plany, preferencje), osadzone w chronionym layoucie z globalną nawigacją.

Routing realizowany jest w Astro 5 z dynamicznymi wycinkami React 19. Warstwa React odpowiada za interaktywne formularze, modale i drag-&-drop. Tailwind 4 zapewnia układ mobilny (mobile-first) oraz motyw ciemny.

## 2. Lista widoków

### 2.1 Publiczne

• **Logowanie** (`/login`)

- Cel: Uwierzytelnienie użytkownika
- Kluczowe informacje: Formularz e-mail + hasło, link „Zapomniałeś hasła?"
- Kluczowe komponenty: `AuthForm`, `AuthGate`
- Uwagi UX / a11y / bezpieczeństwo: Val. pól Zod, tryb ciemny, komunikaty błędów w toastach

• **Rejestracja** (`/register`)

- Cel: Utworzenie konta
- Kluczowe informacje: Formularz e-mail + hasło (+ powtórz)
- Kluczowe komponenty: `AuthForm`
- Uwagi UX / a11y / bezpieczeństwo: Po sukcesie auto-login & redirect

• **Reset hasła** (`/forgot-password`)

- Cel: Wysłanie linku resetu
- Kluczowe informacje: Formularz e-mail
- Kluczowe komponenty: `ResetPasswordForm`
- Uwagi UX / a11y / bezpieczeństwo: Dostępne bez logowania

• **Zmiana hasła** (`/account/change-password`)

- Cel: Ustawienie nowego hasła po linku
- Kluczowe informacje: Formularz nowe hasło
- Kluczowe komponenty: `ChangePasswordForm`
- Uwagi UX / a11y / bezpieczeństwo: Wymaga tokenu z e-maila

• **404** (`/404`)

- Cel: Nie znaleziono strony
- Kluczowe informacje: Prosty komunikat
- Kluczowe komponenty: `ErrorLayout`
- Uwagi UX / a11y / bezpieczeństwo: Link „Powrót do strony głównej"

• **500** (`/500`)

- Cel: Błąd aplikacji
- Kluczowe informacje: Prosty komunikat
- Kluczowe komponenty: `ErrorLayout`
- Uwagi UX / a11y / bezpieczeństwo: —

### 2.2 Prywatne (wymagają sesji)

• **Dashboard (lista planów)** (`/`)

- Cel: Przegląd planów, wejście w szczegóły
- Kluczowe informacje: Karty planów, status (AI/Edytowany), daty, przycisk „Utwórz plan"
- Kluczowe komponenty: `Navbar`, `PlanCard`, `CreatePlanButton`, `ToastProvider`
- Uwagi UX / a11y / bezpieczeństwo: Infinite scroll planowane >20 planów

• **Nowy plan** (`/trip-plans/new`)

- Cel: Zainicjowanie generowania
- Kluczowe informacje: Formularz dest., daty, budżet, preferencje, przycisk „Generuj plan"
- Kluczowe komponenty: `PlanForm`, `UseApi`, `SpinnerOverlay`
- Uwagi UX / a11y / bezpieczeństwo: Walidacja Zod, loader pełnoekranowy ≤180 s

• **Szczegóły planu** (`/trip-plans/:id`)

- Cel: Podgląd i edycja planu
- Kluczowe informacje: Nagłówek planu, dni, aktywności, przyciski „Edytuj", „Usuń"
- Kluczowe komponenty: `PlanDetails`, `PlanDay`, `PlanActivity`, `DeleteDialog`
- Uwagi UX / a11y / bezpieczeństwo: Soft-delete – backend filtruje `deleted_at`

• **Modal edytora planu** (— Dialog)

- Cel: Drag-&-drop dni/aktywności, akceptacja
- Kluczowe informacje: Lista dni, DnD, pola edycji tytułu/opisu
- Kluczowe komponenty: `PlanEditorModal`, `DndProvider`, `AlertDialog`
- Uwagi UX / a11y / bezpieczeństwo: Slide-over mobile, 80 % desktop; brak DnD klawiatury w MVP

• **Lista preferencji** (`/preferences`)

- Cel: Przegląd szablonów preferencji
- Kluczowe informacje: Karty preferencji, przycisk „Nowe preferencje"
- Kluczowe komponenty: `PreferenceCard`, `CreatePreferenceButton`
- Uwagi UX / a11y / bezpieczeństwo:

• **Nowe/edycja preferencji** (`/preferences/new`, `/preferences/:id`)

- Cel: Dodanie lub edycja szablonu
- Kluczowe informacje: Formularz nazwa, liczba osób, budżet
- Kluczowe komponenty: `PreferenceForm`, `DeleteDialog`
- Uwagi UX / a11y / bezpieczeństwo: Walidacja unikalności nazwy

## 3. Mapa podróży użytkownika

1. **Pierwsza wizyta** → `/login` (lub `/register`)
2. **Logowanie sukces** → przekierowanie do `/` Dashboard.
3. **Utwórz plan** → `/trip-plans/new` formularz → klik „Generuj plan”.
4. **Loader** pełnoekranowy do odpowiedzi 200/timeout.
5. **Sukces** → otwiera się `PlanEditorModal` nad `/` (rout nadal `/`).
6. **Użytkownik edytuje** (opcjonalnie) → klika „Akceptuj”.
7. **POST /api/trip-plans** → po sukcesie modal zamyka się; Dashboard odświeża listę.
8. **Kliknięcie karty** na Dashboard → `/trip-plans/:id` z detalami.
9. **Edycja zapis. planu** → przycisk „Edytuj” otwiera `PlanEditorModal` (PATCH).
10. **Usunięcie** → `AlertDialog` → DELETE → powrót na `/`.
11. **Zarządzanie preferencjami**: `/preferences` → lista → nowy/edycja → powrót.
12. **Wylogowanie automatyczne** minutę przed `expires_at`; manualne w menu użytkownika.

## 4. Układ i struktura nawigacji

- **Navbar (private layout)**: logo + zakładki „Plany”, „Preferencje”, + przycisk „Utwórz plan”, menu użytkownika (avatar, „Wyloguj”).
- **Routing**: Astro Filesystem routes zgodnie z tabelami; `AuthGate` owija prywatne trasy.
- **Breadcrumby** zbędne (płytka struktura).
- **Responsywność**: Mobile-First, navbar zamienia karty na menu burgera < 640 px.

## 5. Kluczowe komponenty (wielokrotnego użycia)

• **`AuthGate`** – Sprawdza sesję Supabase, renderuje spinner do czasu walidacji.

• **`UseApi` (hook)** – GET/POST/PATCH/DELETE z tokenem; globalna obsługa błędów.

• **`ToastProvider` + `Toast`** – Komunikaty sukces/błąd, FIFO, max 3 widoczne.

• **`SpinnerOverlay`** – Pełnoekranowy loader dla długich operacji (generowanie).

• **`PlanCard` / `PreferenceCard`** – Prezentacja zasobów na listach.

• **`PlanForm`** – Walidacja z Zod, submit do `/api/trip-plans/generate`.

• **`PlanEditorModal`** – Drag-&-drop (React DnD), formularze inline; AlertDialog przy zamknięciu bez zapisu.

• **`DeleteDialog`** – Potwierdzenia soft-delete.

• **`ErrorLayout`** – Szablon stron 404/500.

• **`DndProvider`** – Kontekst dla drag-&-drop w edytorze.

## 6. Mapowanie historyjek użytkowników → widoki

• **US-001,002** – `/register`, `/login` → Rejestracja / Logowanie

• **US-003** – `/preferences`, `PreferenceForm` → Zarządzanie preferencjami

• **US-004,005** – `/trip-plans/new`, `SpinnerOverlay` → Generowanie + ponowne generowanie

• **US-006** – `PlanEditorModal` → Edycja przed akceptacją

• **US-007** – `PlanEditorModal` → POST → Dashboard → Akceptacja i zapis

• **US-008** – `/trip-plans/:id`, `PlanEditorModal` → Edycja zapisanego planu

• **US-009** – `DeleteDialog` → Soft-delete planu

• **US-010** – `AuthGate`, backend RLS → Bezpieczny dostęp

## 7. Stany brzegowe i błędy

- **Timeout 180 s** – `SpinnerOverlay` zamienia się w Alert z komunikatem i przyciskiem „Spróbuj ponownie”.
- **429 Too Many Requests** – Toast ostrzegawczy + blokada przycisku do resetu licznika (30 s).
- **Brak sieci** – Banner offline u góry strony; formularze disabled.
- **Pusty dashboard** – komunikat „Brak planów” + CTA „Utwórz plan”.
- **Brak preferencji** – analogiczny komunikat.
- **Nie znaleziono planu (404)** – przekierowanie na `/404`.

## 8. Zgodność z API

Wszystkie działania UI mapują się 1-1 do punktów końcowych z planu API:

- `/api/preferences` – lista, tworzenie, edycja, usuwanie szablonów.
- `/api/trip-plans` & `/generate` – generowanie, akceptacja, edycja, soft-delete.
- Middleware `AuthGate` zapewnia token JWT dla każdego zapytania.

## 9. Rozwiązanie punktów bólu użytkownika

• **Czasochłonne planowanie** → Formularz + AI generowanie jednym kliknięciem + loader

• **Niejasne połączenie preferencji z planem** → Szablony preferencji + pre-fill formularza nowego planu

• **Zagubione informacje w narzędziach** → Centralny dashboard planów

• **Brak szybkiej iteracji** → Nieograniczone ponowne generowanie + modal edytora

• **Niepewność utraty zmian** → AlertDialog „Odrzuć zmiany?" przed zamknięciem modalu

---

> Dokument określa architekturę UI MVP Tripper zgodną z wymaganiami PRD, planem API i ustaleniami z sesji planowania. Wszystkie widoki są zoptymalizowane pod mobile-first, wspierają motyw ciemny i zapewniają dostępność na poziomie WCAG AA.
