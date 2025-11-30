# Test Plan: Aplikacja "Tripper"

## 1. Podsumowanie projektu

### 1.1. Opis aplikacji
"Tripper" to nowoczesna aplikacja internetowa przeznaczona do planowania podróży. Jej główną funkcjonalnością jest generowanie spersonalizowanych planów wycieczek przy użyciu sztucznej inteligencji (AI). Użytkownicy mogą definiować cel podróży, daty, budżet i osobiste preferencje, a aplikacja tworzy szczegółowy harmonogram, w tym aktywności i zakwaterowanie. Aplikacja umożliwia również zapisywanie, przeglądanie, edytowanie i usuwanie planów podróży oraz zarządzanie szablonami preferencji.

### 1.2. Kluczowe moduły i funkcjonalności
*   **Moduł uwierzytelniania:** Rejestracja, logowanie, wylogowywanie, przypominanie i resetowanie hasła.
*   **Dashboard (Panel główny):** Centralny widok prezentujący listę zapisanych planów podróży użytkownika, z opcjami tworzenia i usuwania planów.
*   **Moduł tworzenia planu (AI):** Wieloetapowy proces obejmujący formularz wejściowy, generowanie planu przez AI, podgląd, edycję i akceptację wygenerowanego planu.
*   **Moduł szczegółów planu:** Widok do przeglądania i ręcznej edycji szczegółów zapisanego planu (metadane, dni, aktywności, zakwaterowanie).
*   **Moduł preferencji użytkownika:** Funkcjonalność CRUD (Create, Read, Update, Delete) dla szablonów preferencji, które mogą być używane do szybszego tworzenia nowych planów.
*   **Warstwa API:** Zestaw endpointów RESTful obsługujących logikę biznesową aplikacji.

### 1.3. Architektura systemu
*   **Frontend:** Zbudowany w oparciu o meta-framework **Astro**, z interaktywnymi komponentami ("wyspami") napisanymi w **React** i **TypeScript**. Stylowanie realizowane jest za pomocą **Tailwind CSS**.
*   **Backend:** Zrealizowany jako zestaw endpointów API w Astro (`/src/pages/api`), które pełnią rolę funkcji serverless. Backend komunikuje się z usługami zewnętrznymi.
*   **Baza danych i uwierzytelnianie:** System opiera się na **Supabase**, które dostarcza bazę danych PostgreSQL oraz usługi uwierzytelniania i autoryzacji.
*   **Usługi zewnętrzne:** Integracja z **OpenRouter API** w celu generowania planów podróży przez AI.

## 2. Cele testowania

### 2.1. Główne cele
*   **Weryfikacja funkcjonalna:** Upewnienie się, że wszystkie funkcjonalności aplikacji działają zgodnie ze specyfikacją i oczekiwaniami.
*   **Zapewnienie niezawodności:** Sprawdzenie stabilności aplikacji, jej odporności na błędy oraz poprawnego zarządzania stanem.
*   **Walidacja integracji:** Potwierdzenie, że integracja pomiędzy frontendem, backendem (API), bazą danych (Supabase) i usługami zewnętrznymi (OpenRouter) działa poprawnie.
*   **Użyteczność i doświadczenie użytkownika (UX):** Ocena, czy aplikacja jest intuicyjna, responsywna i łatwa w obsłudze.
*   **Bezpieczeństwo:** Identyfikacja podstawowych luk bezpieczeństwa i weryfikacja mechanizmów autoryzacji.

### 2.2. Zakres testów (Scope)
*   Testowanie wszystkich kluczowych modułów wymienionych w sekcji 1.2.
*   Testowanie wszystkich endpointów API pod kątem poprawności działania, obsługi błędów i walidacji danych wejściowych.
*   Testowanie głównych ścieżek użytkownika (end-to-end).
*   Testowanie responsywności interfejsu użytkownika (RWD) na najpopularniejszych urządzeniach.
*   Podstawowe testy kompatybilności na najnowszych wersjach głównych przeglądarek.

### 2.3. Poza zakresem (Out of Scope)
*   Testowanie wewnętrznej infrastruktury usług Supabase i OpenRouter (testujemy jedynie integrację z nimi).
*   Zaawansowane testy wydajnościowe i obciążeniowe (w tej fazie skupiamy się na podstawowych metrykach wydajności po stronie klienta).
*   Testowanie kodu bibliotek i frameworków firm trzecich (np. React, Astro).
*   Zaawansowane testy penetracyjne (w tej fazie skupiamy się na podstawowych, zautomatyzowanych testach bezpieczeństwa).

## 3. Strategia testowania

### a) Testy jednostkowe (Unit Tests)
*   **Narzędzia:** **Vitest** jako framework testowy (natywny dla środowiska Vite, używanego przez Astro) oraz **React Testing Library (RTL)** do testowania komponentów React.
*   **Zakres:**
    *   **Serwisy i logika biznesowa:** Wszystkie funkcje w `src/lib/services/`, ze szczególnym uwzględnieniem `tripPlan.service.ts` i `userPreferences.service.ts`.
    *   **Funkcje pomocnicze i walidatory:** Wszystkie funkcje w `src/lib/validators/` i `src/lib/utils/`.
    *   **Komponenty React z logiką:** Komponenty zawierające skomplikowany stan lub logikę, np. `TripPlanForm.tsx` (walidacja), `DashboardContent.tsx` (zarządzanie stanem).
    *   **Haki (Hooks):** Wszystkie customowe hooki, np. `useTripPlans.ts`, `useTripPlanDetails.ts`, `usePreferences.ts`.
*   **Pokrycie kodu:** Docelowe pokrycie kodu dla krytycznych modułów (serwisy, walidatory) powinno wynosić **minimum 80%**.
*   **Przykładowe scenariusze:**
    *   `calculateDays` (`PlanCard.tsx`): Test dla tego samego dnia, zakresu w obrębie miesiąca, zakresu obejmującego koniec roku, roku przestępnego.
    *   `validateAcceptPlanCommand` (`tripPlan.service.ts`): Test z datą końcową wcześniejszą niż początkowa, z `people_count < 1`, z pustym `plan_details`.
    *   `useTripPlans.ts`: Testowanie hooka z zamockowanym `fetch` zwracającym sukces, błąd 401 i błąd 500.

### b) Testy integracyjne (Integration Tests)
*   **Punkty integracji:**
    *   **Frontend ↔ Backend:** Interakcja komponentów React z endpointami API Astro (np. formularz logowania wysyłający dane do `/api/auth/login`).
    *   **Backend ↔ Baza danych:** Poprawność operacji CRUD wykonywanych przez serwisy na bazie danych Supabase.
    *   **Backend ↔ Usługi zewnętrzne:** Poprawność zapytań i obsługi odpowiedzi z OpenRouter API przez `aiGeneration.service.ts`.
*   **Testy API:**
    *   **Narzędzia:** **Vitest** z biblioteką **Supertest** do wykonywania zapytań HTTP do endpointów API Astro.
    *   **Scenariusze:** Testowanie każdego endpointu dla przypadków sukcesu (status 2xx), błędów walidacji (status 400), błędów autoryzacji (status 401/403) i błędów serwera (status 500).
*   **Testy bazy danych:**
    *   Testy na poziomie serwisów (`tripPlan.service.ts`) powinny wykorzystywać dedykowaną, testową bazę danych Supabase do weryfikacji, czy operacje (np. `acceptPlan`) poprawnie tworzą i modyfikują rekordy.

### c) Testy E2E (End-to-End)
*   **Narzędzia:** **Playwright** – ze względu na szybkość, niezawodność i doskonałą współpracę z nowoczesnymi frameworkami.
*   **Kluczowe ścieżki użytkownika (User Flows):**
    1.  **Pełny cykl uwierzytelniania:** Użytkownik rejestruje się, potwierdza e-mail (mock), loguje się, a następnie wylogowuje.
    2.  **Tworzenie planu podróży:** Użytkownik loguje się, przechodzi do tworzenia nowego planu, wypełnia formularz, generuje plan, edytuje jedną aktywność, akceptuje i zapisuje plan.
    3.  **Zarządzanie istniejącym planem:** Użytkownik loguje się, wybiera istniejący plan z dashboardu, wchodzi w tryb edycji, zmienia cel podróży, zapisuje zmiany.
    4.  **Usuwanie planu:** Użytkownik loguje się, klika przycisk usuwania na karcie planu, potwierdza usunięcie w oknie dialogowym.
    5.  **Zarządzanie preferencjami:** Użytkownik loguje się, przechodzi do strony preferencji, tworzy nową preferencję, edytuje ją, a następnie usuwa.

### d) Pozostałe typy testów
*   **Testy wydajnościowe:** Podstawowa analiza wydajności frontendu przy użyciu **Google Lighthouse**. Należy monitorować metryki Core Web Vitals.
*   **Testy bezpieczeństwa:**
    *   Weryfikacja, czy middleware (`src/middleware/index.ts`) poprawnie blokuje dostęp do chronionych tras dla niezalogowanych użytkowników.
    *   Sprawdzenie, czy wszystkie dane wejściowe są walidowane (po stronie klienta i serwera) w celu ochrony przed XSS i innymi atakami.
    *   Weryfikacja, czy endpointy API poprawnie egzekwują polityki RLS (Row-Level Security) Supabase.
*   **Testy dostępności (Accessibility):** Integracja biblioteki **`axe-core`** z testami E2E w Playwright w celu automatycznego wykrywania naruszeń WCAG.
*   **Testy kompatybilności:** Manualne i/lub zautomatyzowane testy na najnowszych wersjach przeglądarek: **Chrome, Firefox, Safari**. Testy responsywności powinny być wykonywane w ramach testów E2E przy użyciu różnych viewportów (mobilny, tablet, desktop).

## 4. Środowiska testowe
*   **Lokalne (Development):** Środowisko deweloperskie uruchamiane lokalnie, połączone z lokalną instancją Supabase (zarządzaną przez Supabase CLI).
*   **Testowe/Staging:** Oddzielny deployment aplikacji (np. na Vercel, Netlify) połączony z dedykowanym projektem Supabase Cloud przeznaczonym do testów. To środowisko będzie używane do uruchamiania testów E2E w pipeline'ach CI/CD.
*   **Dane testowe:** Przygotowanie skryptów do seedowania bazy danych (tzw. "fixtures"), aby zapewnić spójny i przewidywalny stan danych przed każdym przebiegiem testów automatycznych.

## 5. Harmonogram i zasoby
*   **Faza 1 (Priorytet: Krytyczny):**
    *   **Testy:** Testy jednostkowe dla walidatorów i serwisów, testy integracyjne API dla modułu uwierzytelniania, testy E2E dla ścieżek logowania i rejestracji.
    *   **Szacowany czas:** 5 dni roboczych.
*   **Faza 2 (Priorytet: Wysoki):**
    *   **Testy:** Testy E2E dla pełnego cyklu tworzenia i akceptacji planu. Testy integracyjne dla endpointu `/generate`. Testy jednostkowe dla komponentów i hooków związanych z tworzeniem planu.
    *   **Szacowany czas:** 8 dni roboczych.
*   **Faza 3 (Priorytet: Średni):**
    *   **Testy:** Testy E2E dla edycji i usuwania planów oraz zarządzania preferencjami. Testy integracyjne dla pozostałych endpointów API. Zwiększenie pokrycia testami jednostkowymi.
    *   **Szacowany czas:** 7 dni roboczych.
*   **Zasoby:**
    *   1 x Inżynier QA/Tester (odpowiedzialny za tworzenie i utrzymanie testów E2E, strategię i przypadki testowe).
    *   Deweloperzy (odpowiedzialni za pisanie testów jednostkowych i integracyjnych dla tworzonego przez siebie kodu).

## 6. Przypadki testowe (Test Cases)

### Moduł: Uwierzytelnianie
| ID | Tytuł | Priorytet | Warunki wstępne | Kroki | Oczekiwany rezultat | Dane testowe |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Logowanie z poprawnymi danymi | Krytyczny | Użytkownik z potwierdzonym adresem e-mail istnieje w systemie. | 1. Otwórz stronę `/login`.<br>2. Wpisz poprawny e-mail.<br>3. Wpisz poprawne hasło.<br>4. Kliknij przycisk "Zaloguj się". | Użytkownik zostaje pomyślnie zalogowany i przekierowany na stronę główną (`/`). | E-mail: `test@example.com`<br>Hasło: `ValidPassword1` |
| **AUTH-02** | Logowanie z niepoprawnym hasłem | Wysoki | Użytkownik istnieje w systemie. | 1. Otwórz stronę `/login`.<br>2. Wpisz poprawny e-mail.<br>3. Wpisz niepoprawne hasło.<br>4. Kliknij "Zaloguj się". | Pod formularzem pojawia się komunikat błędu "Nieprawidłowy email lub hasło". Użytkownik pozostaje na stronie logowania. | E-mail: `test@example.com`<br>Hasło: `WrongPassword` |
| **AUTH-03** | Rejestracja nowego użytkownika | Krytyczny | Brak użytkownika o podanym e-mailu w systemie. | 1. Otwórz stronę `/register`.<br>2. Wpisz nowy, poprawny e-mail.<br>3. Wpisz silne hasło.<br>4. Powtórz hasło.<br>5. Kliknij "Zarejestruj się". | Wyświetla się ekran z potwierdzeniem wysłania linku aktywacyjnego. Nowy użytkownik zostaje utworzony w bazie danych (z niepotwierdzonym e-mailem). | E-mail: `newuser@example.com`<br>Hasło: `StrongPassword123` |
| **AUTH-04** | Próba rejestracji z istniejącym e-mailem | Wysoki | Użytkownik o danym e-mailu już istnieje. | 1. Otwórz stronę `/register`.<br>2. Wpisz istniejący e-mail.<br>3. Wpisz dowolne hasło.<br>4. Kliknij "Zarejestruj się". | Pod formularzem pojawia się komunikat błędu "Użytkownik z tym adresem email już istnieje". | E-mail: `test@example.com` |
| **AUTH-05** | Resetowanie hasła | Wysoki | Użytkownik istnieje w systemie. | 1. Otwórz stronę `/forgot-password`.<br>2. Wpisz e-mail użytkownika.<br>3. Kliknij "Wyślij link resetujący". | Wyświetla się komunikat o wysłaniu linku. Użytkownik otrzymuje e-mail (mock) z linkiem do zresetowania hasła. | E-mail: `test@example.com` |

### Moduł: Tworzenie planu podróży (AI)
| ID | Tytuł | Priorytet | Warunki wstępne | Kroki | Oczekiwany rezultat | Dane testowe |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TPC-01** | Pomyślne wygenerowanie planu | Krytyczny | Użytkownik jest zalogowany. | 1. Przejdź na stronę `/trip-plans/new`.<br>2. Wypełnij wszystkie wymagane pola poprawnymi danymi.<br>3. Kliknij "Generuj plan". | Wyświetla się ekran ładowania, a następnie pojawia się wygenerowany plan z zakwaterowaniem i listą dni z aktywnościami. | Cel: `Paryż, Francja`<br>Daty: `2026-06-10` do `2026-06-12`<br>Liczba osób: `2`<br>Budżet: `medium` |
| **TPC-02** | Walidacja formularza - data końcowa przed początkową | Wysoki | Użytkownik jest zalogowany. | 1. Przejdź na stronę `/trip-plans/new`.<br>2. Wypełnij pole daty rozpoczęcia.<br>3. Wypełnij pole daty zakończenia datą wcześniejszą niż data rozpoczęcia. | Pod polem daty zakończenia pojawia się komunikat błędu. Przycisk "Generuj plan" jest nieaktywny. | Data rozpoczęcia: `2026-06-15`<br>Data zakończenia: `2026-06-14` |
| **TPC-03** | Edycja wygenerowanego planu przed akceptacją | Wysoki | Plan został pomyślnie wygenerowany (kroki z TPC-01). | 1. Kliknij przycisk edycji przy pierwszej aktywności w pierwszym dniu.<br>2. Zmień godzinę aktywności.<br>3. Zapisz zmiany.<br>4. Kliknij "Akceptuj plan". | Zmiany są widoczne w interfejsie. Po kliknięciu "Akceptuj", plan zostaje zapisany w bazie danych z `source: "ai-edited"`. | Godzina: zmiana z `09:00` na `09:30` |
| **TPC-04** | Odrzucenie zmian i ponowne generowanie planu | Średni | Plan został wygenerowany i zmodyfikowany. | 1. Kliknij przycisk "Regeneruj plan".<br>2. W oknie dialogowym potwierdź chęć utraty zmian. | Wyświetla się ekran ładowania, a następnie pojawia się nowy, niezmieniony plan. Flaga `isEdited` jest ustawiona na `false`. | - |
| **TPC-05** | Obsługa błędu generowania planu (np. timeout) | Wysoki | Użytkownik jest zalogowany. API AI (mock) zwraca błąd timeout. | 1. Przejdź na stronę `/trip-plans/new`.<br>2. Wypełnij formularz.<br>3. Kliknij "Generuj plan". | Ekran ładowania znika, a na jego miejscu pojawia się komponent `ErrorDisplay` z informacją o błędzie i przyciskiem "Spróbuj ponownie". | - |

## 7. Kryteria akceptacji
Testy zostaną uznane za zakończone, gdy:
*   Wszystkie przypadki testowe o priorytecie **Krytyczny** i **Wysoki** zakończą się sukcesem.
*   Pokrycie kodu testami jednostkowymi dla kluczowych serwisów i logiki biznesowej osiągnie poziom **≥ 80%**.
*   Wszystkie krytyczne ścieżki użytkownika w testach E2E przechodzą pomyślnie w środowisku testowym.
*   Liczba otwartych defektów o priorytecie Krytyczny/Wysoki wynosi **zero**.
*   Aplikacja przechodzi testy dostępności `axe-core` bez krytycznych naruszeń.

## 8. Zarządzanie defektami
*   **Proces:** Wszystkie znalezione błędy będą raportowane w systemie do zarządzania projektami (np. Jira, GitHub Issues). Każdy raport musi zawierać: tytuł, opis, kroki do reprodukcji, oczekiwany vs. aktualny rezultat, priorytet/krytyczność, zrzuty ekranu/nagrania wideo.
*   **Priorytetyzacja:**
    *   **P0 (Krytyczny):** Błąd blokujący kluczowe funkcjonalności, powodujący utratę danych lub luki bezpieczeństwa.
    *   **P1 (Wysoki):** Błąd znacznie utrudniający korzystanie z ważnej funkcjonalności, ale istnieje obejście.
    *   **P2 (Średni):** Błąd w mniej istotnej funkcjonalności lub problem UI/UX.
    *   **P3 (Niski):** Drobny błąd kosmetyczny, literówka.
*   **Cykl życia defektu:** `New` → `Open` → `In Progress` → `Ready for Retest` → `Closed` / `Reopened`.

## 9. Narzędzia i infrastruktura
*   **Frameworki testowe:**
    *   Testy jednostkowe/integracyjne: **Vitest**, **React Testing Library**, **Supertest**.
    *   Testy E2E: **Playwright**.
*   **CI/CD:** **GitHub Actions** do automatycznego uruchamiania testów jednostkowych, integracyjnych i E2E dla każdego Pull Requesta.
*   **Raportowanie:** Wbudowane reportery Vitest i Playwright. Dla zagregowanych raportów można rozważyć integrację z **Allure Report**.
*   **Zarządzanie testami:** **Jira** z dodatkiem (np. Xray) lub **GitHub Issues** z etykietami do śledzenia przypadków testowych i defektów.

## 10. Ryzyka i mitygacja
*   **Ryzyko 1: Niestabilność i niedeterministyczność odpowiedzi AI.**
    *   **Opis:** Model AI może zwracać dane w niepoprawnym formacie JSON, niekompletne lub nielogiczne, co może powodować błędy aplikacji.
    *   **Mitygacja:**
        *   Implementacja solidnej walidacji (Zod) i parsowania po stronie backendu (`aiGeneration.service.ts`).
        *   Mechanizm ponawiania próby generowania planu dla użytkownika.
        *   Szczegółowe logowanie błędnych odpowiedzi z API AI w celu debugowania i dostrajania promptów.
*   **Ryzyko 2: Zależność od usług zewnętrznych (Supabase, OpenRouter).**
    *   **Opis:** Awaria lub niedostępność tych usług uniemożliwi działanie kluczowych części aplikacji.
    *   **Mitygacja:**
        *   Stosowanie mocków dla usług zewnętrznych w testach jednostkowych i integracyjnych.
        *   Implementacja mechanizmów `retry` z `exponential backoff` dla zapytań API.
        *   Wyświetlanie zrozumiałych komunikatów o błędach dla użytkownika w przypadku niedostępności usługi.
*   **Ryzyko 3: Zarządzanie stanem danych testowych.**
    *   **Opis:** Niespójne dane testowe mogą prowadzić do niestabilnych ("flaky") testów i fałszywych wyników.
    *   **Mitygacja:**
        *   Stworzenie i wersjonowanie skryptów do seedowania testowej bazy danych.
        *   Automatyzacja procesu czyszczenia i ponownego seedowania bazy danych przed każdym przebiegiem testów E2E w CI/CD.
*   **Ryzyko 4: Brak uwierzytelnienia (placeholder w kodzie).**
    *   **Opis:** Obecny kod API zawiera zastępczy, statyczny `userId`. Wprowadzenie rzeczywistego uwierzytelnienia będzie wymagało refaktoryzacji i ponownego przetestowania warstwy API.
    *   **Mitygacja:** Priorytetowe wdrożenie pełnego przepływu autoryzacji i aktualizacja testów integracyjnych API, aby każdy test uwierzytelniał się i działał w kontekście określonego użytkownika.
