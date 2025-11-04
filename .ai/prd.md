# Dokument wymagań produktu (PRD) - Tripper

## 1. Przegląd produktu

Tripper to webowa aplikacja wspierająca planowanie wycieczek. Dzięki generatywnej sztucznej inteligencji konwertuje uproszczone notatki użytkownika w szczegółowe, wielodniowe plany podróży wraz z rekomendacjami noclegów. MVP koncentruje się na:

- prostym zarządzaniu kontem i preferencjami użytkownika,
- tworzeniu i przechowywaniu planów przyszłych wyjazdów,
- generowaniu, edycji i akceptacji planu opartego na AI.

## 2. Problem użytkownika

Samodzielne układanie zbalansowanych planów wycieczek wymaga czasu, doświadczenia i researchu. Użytkownicy:

- nie wiedzą, jak połączyć własne preferencje z lokalnymi atrakcjami,
- gubią informacje w różnych narzędziach,
- potrzebują szybkiej transformacji koncepcji wyjazdu w realny plan.
  Tripper skraca ten proces, łącząc notatki, profil preferencji i AI w spójny przepływ pracy.

## 3. Wymagania funkcjonalne

1. System kont użytkowników
   - Rejestracja i logowanie (e-mail + hasło)
   - Sesje i zabezpieczenie endpointów API
2. Profil użytkownika
   - Dodawanie, edycja, usuwanie szablonów preferencji (ogólne dane — brak informacji wrażliwych)
   - Możliwość zapisania preferencji podczas tworzenia pierwszego planu (wymaga potwierdzenia)
3. Generowanie planu przy użyciu AI
   - Formularz z polami: cel podróży, daty, liczba osób, transport, budżet, „Co robić", „Czego unikać"
   - Jedno kliknięcie „Generuj plan"
   - Czas odpowiedzi ≤ 180 s; w razie niepowodzenia wyświetlany jest komunikat błędu
   - Nieograniczona liczba ponownych prób (manualnie inicjowanych)
   - Wygenerowany plan NIE jest od razu zapisywany w bazie — istnieje tylko w interfejsie użytkownika
4. Edycja wygenerowanego planu (przed akceptacją)
   - Użytkownik może przeglądać i edytować wygenerowany plan w interfejsie
   - Może dodawać / usuwać / przenosić dni i atrakcje
   - Edycje są tymczasowe (tylko w interfejsie) dopóki użytkownik nie zaakceptuje planu
   - Zmiana planu przed akceptacją oznacza, że plan staje się „edytowany" (informacja analityczna)
5. Akceptacja planu
   - Użytkownik zatwierdza plan (z lub bez edycji) klikając „Akceptuj"
   - Dopiero wtedy plan jest zapisywany w bazie danych
   - Plan zapisuje się ze statusem „AI" (jeśli niezmieniony) lub „Edytowany" (jeśli użytkownik go zmodyfikował)
6. Edycja zapisanego planu (po akceptacji)
   - Użytkownik może edytować już zapisane plany z listy
   - Każda edycja zapisanego planu zmienia jego status na „Edytowany"
7. Zarządzanie planami
   - Lista wszystkich zaakceptowanych/zapisanych planów (sortowana według daty rozpoczęcia - od najbliższej)
   - Domyślnie wyświetlane są tylko aktywne plany (usunięte plany są ukryte)
   - Możliwość przeglądania szczegółów planu
   - Usuwanie planu z potwierdzeniem (soft-delete)
8. Analityka
   - Automatyczne oznaczenie planu statusem: „AI" lub „Edytowany"
   - Metryka główna: odsetek zaakceptowanych planów w pełni wygenerowanych przez AI (niezmodyfikowanych przed akceptacją)
   - Metryka dodatkowa: % wygenerowanych planów, które zostały zaakceptowane
9. Responsywność i UX
   - Mobile-first: pełna funkcjonalność na ekranach < 400 px
   - Progres indicator podczas generowania

## 4. Granice produktu

- Brak zewnętrznych integracji (Booking, Google Places itp.) w MVP
- Brak wersjonowania planów
- Brak współdzielenia planów między użytkownikami
- Brak zaawansowanej analizy multimediów oraz map
- Brak systemu ocen planu na etapie MVP

## 5. Historyjki użytkowników

### US-001

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako niezarejestrowany użytkownik chcę założyć konto, aby móc tworzyć plany wycieczek.
- Kryteria akceptacji:
  1. Formularz przyjmuje poprawny e-mail i hasło.
  2. Po sukcesie konto zostaje utworzone, a użytkownik zalogowany.
  3. Błędne dane zwracają komunikat o błędzie.

### US-002

- ID: US-002
- Tytuł: Logowanie
- Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich danych.
- Kryteria akceptacji:
  1. Formularz przyjmuje e-mail i hasło.
  2. Poprawne dane logują i przekierowują na listę planów.
  3. Niepoprawne dane wyświetlają komunikat o błędzie.

### US-003

- ID: US-003
- Tytuł: Edycja profilu
- Opis: Jako zalogowany użytkownik chcę zarządzać szablonami preferencji, aby szybciej tworzyć podobne plany.
- Kryteria akceptacji:
  1. Użytkownik może dodawać, edytować, usuwać szablony preferencji.
  2. Zmiany zapisują się w profilu.

### US-004

- ID: US-004
- Tytuł: Generowanie planu przez AI
- Opis: Jako zalogowany użytkownik chcę wygenerować plan wycieczki na podstawie moich preferencji przy użyciu AI.
- Kryteria akceptacji:
  1. Formularz wymusza wypełnienie pól obowiązkowych (cel, daty, liczba osób, budżet).
  2. Kliknięcie „Generuj plan" rozpoczyna proces generowania.
  3. Wyświetla się wskaźnik postępu podczas generowania.
  4. Plan pojawia się w ≤ 180 s lub komunikat błędu.
  5. Wygenerowany plan jest wyświetlany w interfejsie, ale NIE jest jeszcze zapisany w bazie.

### US-005

- ID: US-005
- Tytuł: Ponowne generowanie planu
- Opis: Jako użytkownik chcę móc wygenerować nowy plan, gdy poprzednia próba się nie powiodła lub nie podobał mi się wygenerowany plan.
- Kryteria akceptacji:
  1. Po błędzie generowania dostępny przycisk „Spróbuj ponownie".
  2. Użytkownik może kliknąć „Generuj ponownie" nawet jeśli poprzednie generowanie się powiodło.
  3. Nieograniczona liczba prób generowania.
  4. Każde nowe generowanie nadpisuje poprzedni plan w interfejsie.

### US-006

- ID: US-006
- Tytuł: Edycja wygenerowanego planu przed akceptacją
- Opis: Jako użytkownik chcę móc edytować wygenerowany plan (dodawać, usuwać, przenosić atrakcje i dni) przed jego zaakceptowaniem.
- Kryteria akceptacji:
  1. UI pozwala na dodawanie, usuwanie, przeciąganie pozycji w wygenerowanym planie.
  2. Edycje są widoczne natychmiast w interfejsie.
  3. Plan pozostaje niezapisany w bazie do momentu akceptacji.
  4. System śledzi czy plan został edytowany (do celów analitycznych).

### US-007

- ID: US-007
- Tytuł: Akceptacja i zapis planu
- Opis: Jako użytkownik chcę zaakceptować wygenerowany plan (z lub bez moich edycji), aby zapisać go w bazie jako mój plan wycieczki.
- Kryteria akceptacji:
  1. Kliknięcie „Akceptuj plan" zapisuje plan w bazie danych.
  2. Plan pojawia się na liście moich zapisanych planów.
  3. Jeśli plan był edytowany przed akceptacją, zapisuje się ze statusem „Edytowany".
  4. Jeśli plan nie był edytowany, zapisuje się ze statusem „AI".

### US-008

- ID: US-008
- Tytuł: Edycja zapisanego planu
- Opis: Jako użytkownik chcę móc edytować już zapisane plany z mojej listy.
- Kryteria akceptacji:
  1. Użytkownik może otworzyć zapisany plan z listy.
  2. UI pozwala na edycję wszystkich elementów planu.
  3. Zapisanie zmian automatycznie zmienia status planu na „Edytowany" (jeśli był „AI").
  4. Zmiany są natychmiast widoczne na liście planów.

### US-009

- ID: US-009
- Tytuł: Usuwanie zapisanego planu
- Opis: Jako użytkownik chcę usunąć zapisany plan z mojej listy, aby zachować porządek.
- Kryteria akceptacji:
  1. Użytkownik wybiera „Usuń" z listy planów lub widoku szczegółowego planu.
  2. System prosi o potwierdzenie usunięcia.
  3. Po potwierdzeniu plan znika z listy (soft-delete).
  4. Usunięte plany nie są wyświetlane domyślnie na liście.

### US-010

- ID: US-010
- Tytuł: Bezpieczny dostęp
- Opis: Jako użytkownik chcę, aby moje dane były dostępne tylko po zalogowaniu.
- Kryteria akceptacji:
  1. Próba dostępu bez sesji zwraca błąd 401.
  2. Po zalogowaniu wszystkie funkcje są dostępne.

## 6. Metryki sukcesu

1. Odsetek zaakceptowanych planów w pełni wygenerowanych przez AI ≥ 60 % w ciągu 3 miesięcy od startu.
2. 75 % aktywnych użytkowników generuje ≥ 3 plany rocznie.
3. 90 % aktywnych użytkowników ma zapisane preferencje w profilu.
4. Czas generowania planu ≤ 180 s w 95 percentylu.
5. Dostępność systemu ≥ 99 % w trakcie testów MVP.
