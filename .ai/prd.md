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
3. Tworzenie planu
   - Formularz notatki z polami: cel podróży, daty, liczba osób, transport, budżet, „Co robić”, „Czego unikać”
4. Generowanie planu przy użyciu AI
   - Jedno kliknięcie „Generuj plan”
   - Czas odpowiedzi ≤ 30 s; w razie niepowodzenia wyświetlany jest komunikat błędu
   - Nieograniczona liczba ponownych prób (manualnie inicjowanych)
5. Edycja planu
   - Użytkownik może dodawać / usuwać / przenosić dni i atrakcje
   - Zmiana dowolnej części planu oznacza, że plan staje się „edytowany” (informacja tylko analityczna, niewidoczna w UI)
6. Akceptacja planu
   - Użytkownik zatwierdza plan jako finalny
   - Plan jest zapisywany w bazie
7. Zarządzanie planami
   - Lista planów (wszystkie stany)
   - Usuwanie planu z potwierdzeniem
8. Analityka
   - Oznaczenie planu statusem: „AI”, „Edytowany”
   - Metryka główna: odsetek zaakceptowanych planów w pełni wygenerowanych przez AI (niezmodyfikowanych)
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
- Tytuł: Tworzenie notatki planu
- Opis: Jako zalogowany użytkownik chcę wprowadzić dane wyjazdu, aby przygotować plan.
- Kryteria akceptacji:
  1. Formularz wymusza wypełnienie pól obowiązkowych.
  2. Część pól moze zostać zapisana jako szablon preferencji.

### US-005

- ID: US-005
- Tytuł: Generowanie planu
- Opis: Jako użytkownik chcę wygenerować plan na podstawie notatki i preferencji.
- Kryteria akceptacji:
  1. Kliknięcie „Generuj plan” rozpoczyna proces.
  2. Wyświetla się wskaźnik postępu.
  3. Plan pojawia się w ≤ 30 s lub komunikat błędu.

### US-006

- ID: US-006
- Tytuł: Ponowienie generowania
- Opis: Jako użytkownik chcę powtórzyć generowanie, gdy poprzednia próba się nie powiodła.
- Kryteria akceptacji:
  1. Po błędzie dostępny przycisk „Spróbuj ponownie”.
  2. Nieograniczona liczba prób.

### US-007

- ID: US-007
- Tytuł: Edycja planu
- Opis: Jako użytkownik chcę modyfikować wygenerowany plan (dodawać, usuwać, przenosić atrakcje i dni).
- Kryteria akceptacji:
  1. UI pozwala na dodawanie, usuwanie, przeciąganie pozycji.
  2. Po zapisaniu plan oznaczony jako „edytowany”.

### US-008

- ID: US-008
- Tytuł: Akceptacja planu
- Opis: Jako użytkownik chcę zaakceptować plan, aby zapisać go jako finalny.
- Kryteria akceptacji:
  1. Kliknięcie „Akceptuj” ustawia status „zaakceptowany”.
  2. Plan trafia na listę planów.

### US-009

- ID: US-009
- Tytuł: Usuwanie planu
- Opis: Jako użytkownik chcę usunąć plan, aby zachować porządek.
- Kryteria akceptacji:
  1. Użytkownik wybiera „Usuń” z listy lub widoku szczegółowego.
  2. System prosi o potwierdzenie.
  3. Po potwierdzeniu plan znika.

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
4. Czas generowania planu ≤ 30 s w 95 percentylu.
5. Dostępność systemu ≥ 99 % w trakcie testów MVP.
