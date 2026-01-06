# Dokument wymagań produktu (PRD) - Tripper

## 1. Przegląd produktu

Tripper to webowa aplikacja wspierająca planowanie wycieczek. Dzięki generatywnej sztucznej inteligencji konwertuje uproszczone notatki użytkownika w szczegółowe, wielodniowe plany podróży. MVP koncentruje się na:

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
   - Rejestracja (e-mail + hasło) z potwierdzeniem przez e-mail (double opt-in)
   - Logowanie (e-mail + hasło)
   - Resetowanie zapomnianego hasła
   - Sesje i zabezpieczenie endpointów API
2. Profil użytkownika (szablony preferencji)
   - Dodawanie, edycja, usuwanie szablonów preferencji
   - Każdy szablon zawiera:
     - Nazwę szablonu (wymagana, unikalna per użytkownik)
     - Liczbę osób (opcjonalna)
     - Typ budżetu (opcjonalny): niski, średni, wysoki
     - Środki transportu (opcjonalne): wielokrotny wybór z predefiniowanej listy + własny tekst
     - Preferowane aktywności "Co robić" (opcjonalne): wielokrotny wybór z predefiniowanej listy + własny tekst
     - Aktywności do unikania "Czego unikać" (opcjonalne): wielokrotny wybór z predefiniowanej listy + własny tekst
   - Możliwość zapisania danych z formularza generowania jako nowy szablon preferencji
3. Generowanie planu przy użyciu AI
   - Formularz z polami:
     - Cel podróży (wymagany)
     - Daty rozpoczęcia i zakończenia (wymagane)
     - Liczba osób (wymagana)
     - Typ budżetu (wymagany): niski, średni, wysoki
     - Transport (opcjonalny): wielokrotny wybór z predefiniowanej listy + możliwość dodania własnego tekstu
     - "Co robić" (opcjonalne): wielokrotny wybór z predefiniowanej listy + możliwość dodania własnego tekstu
     - "Czego unikać" (opcjonalne): wielokrotny wybór z predefiniowanej listy + możliwość dodania własnego tekstu
   - Możliwość załadowania zapisanego szablonu preferencji do formularza
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
- Brak rekomendacji zakwaterowania w MVP (funkcja planowana na przyszłe wersje)

## 5. Predefiniowane opcje

### 5.1 Środki transportu

Lista predefiniowanych opcji transportu (multi-select):

- Samolot
- Pociąg
- Autobus dalekobieżny
- Wypożyczony samochód
- Własny samochód
- Transport publiczny (metro, tramwaj, autobus miejski)
- Piesze spacery
- Rower / hulajnoga
- Taksówki / Uber

### 5.2 Aktywności (dla "Co robić" i "Czego unikać")

Lista predefiniowanych kategorii aktywności (multi-select):

- Zwiedzanie muzeów
- Zabytki i architektura
- Lokalna kuchnia / restauracje
- Zakupy
- Piesze wycieczki / trekking
- Sporty wodne
- Plaża / wypoczynek
- Życie nocne / kluby
- Parki i natura
- Atrakcje dla dzieci
- Punkty widokowe (must-see)
- Festiwale i wydarzenia lokalne
- Spa i wellness

## 6. Historyjki użytkowników

### US-001

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako niezarejestrowany użytkownik chcę założyć konto, aby móc tworzyć plany wycieczek.
- Kryteria akceptacji:
  1. Formularz przyjmuje poprawny e-mail i hasło.
  2. Po sukcesie konto zostaje utworzone i system wysyła e-mail z linkiem aktywacyjnym.
  3. Wyświetlany jest komunikat informujący o konieczności potwierdzenia adresu e-mail.
  4. Po kliknięciu w link aktywacyjny użytkownik jest przekierowywany na stronę logowania z komunikatem o potwierdzeniu konta.
  5. Użytkownik może się zalogować dopiero po potwierdzeniu adresu e-mail.
  6. Błędne dane zwracają komunikat o błędzie.

### US-002

- ID: US-002
- Tytuł: Logowanie
- Opis: Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich danych.
- Kryteria akceptacji:
  1. Formularz przyjmuje e-mail i hasło.
  2. Poprawne dane logują i przekierowują na dashboard z listą planów (strona główna `/`).
  3. Niepoprawne dane wyświetlają komunikat o błędzie.
  4. Próba logowania bez potwierdzenia adresu e-mail wyświetla komunikat z informacją o konieczności aktywacji konta.

### US-003

- ID: US-003
- Tytuł: Zarządzanie szablonami preferencji
- Opis: Jako zalogowany użytkownik chcę zarządzać szablonami preferencji zawierającymi moje typowe ustawienia podróży, aby szybciej wypełniać formularz generowania planu.
- Kryteria akceptacji:
  1. Użytkownik może dodawać nowe szablony preferencji z pełnym zestawem pól (nazwa, liczba osób, budżet, transport, co robić, czego unikać).
  2. Pola transport, "co robić" i "czego unikać" umożliwiają wielokrotny wybór z predefiniowanej listy opcji.
  3. Użytkownik może dodać własny tekst do każdego z pól preferencji oprócz wyboru z listy.
  4. Użytkownik może edytować istniejące szablony.
  5. Użytkownik może usuwać szablony.
  6. Nazwa szablonu musi być unikalna dla danego użytkownika.
  7. Zmiany zapisują się w profilu natychmiast po potwierdzeniu.

### US-004

- ID: US-004
- Tytuł: Generowanie planu przez AI
- Opis: Jako zalogowany użytkownik chcę wygenerować plan wycieczki na podstawie moich preferencji przy użyciu AI.
- Kryteria akceptacji:
  1. Formularz wymusza wypełnienie pól obowiązkowych (cel, daty, liczba osób, budżet).
  2. Pola transport, "co robić" i "czego unikać" umożliwiają wielokrotny wybór z predefiniowanej listy opcji oraz dodanie własnego tekstu.
  3. Kliknięcie „Generuj plan" rozpoczyna proces generowania.
  4. Wyświetla się wskaźnik postępu podczas generowania.
  5. Plan pojawia się w ≤ 180 s lub komunikat błędu.
  6. Wygenerowany plan jest wyświetlany w interfejsie, ale NIE jest jeszcze zapisany w bazie.

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

### US-011

- ID: US-011
- Tytuł: Resetowanie zapomnianego hasła
- Opis: Jako użytkownik, który zapomniał hasła, chcę móc je zresetować, aby odzyskać dostęp do konta.
- Kryteria akceptacji:
  1. Użytkownik może wejść na stronę "Zapomniałem hasła" z poziomu strony logowania.
  2. Formularz przyjmuje adres e-mail.
  3. System wysyła e-mail z linkiem resetującym (niezależnie od tego, czy konto istnieje - zapobieganie enumeracji adresów).
  4. Wyświetlany jest komunikat o wysłaniu linku.
  5. Po kliknięciu w link użytkownik jest przekierowywany na stronę ustawiania nowego hasła.
  6. Formularz nowego hasła wymaga wprowadzenia hasła i jego potwierdzenia.
  7. Po sukcesie użytkownik jest przekierowywany na stronę logowania z komunikatem o zmianie hasła.
  8. Link resetujący wygasa po 24 godzinach.

### US-012

- ID: US-012
- Tytuł: Ładowanie szablonu preferencji do formularza generowania
- Opis: Jako użytkownik chcę załadować zapisany szablon preferencji do formularza generowania planu, aby nie wprowadzać tych samych danych wielokrotnie.
- Kryteria akceptacji:
  1. W formularzu generowania planu dostępna jest opcja "Załaduj z preferencji".
  2. Użytkownik może wybrać szablon z listy swoich zapisanych preferencji.
  3. Po wybraniu szablonu, odpowiednie pola formularza wypełniają się automatycznie (liczba osób, budżet, transport, co robić, czego unikać).
  4. Użytkownik może modyfikować załadowane wartości przed generowaniem.
  5. Pola obowiązkowe (cel, daty) pozostają do ręcznego wypełnienia.

### US-013

- ID: US-013
- Tytuł: Zapisywanie preferencji z formularza generowania
- Opis: Jako użytkownik chcę zapisać dane wprowadzone w formularzu generowania jako nowy szablon preferencji, aby móc je wykorzystać w przyszłości.
- Kryteria akceptacji:
  1. Po wypełnieniu formularza generowania (przed lub po wygenerowaniu planu) użytkownik może kliknąć "Zapisz jako preferencję".
  2. System wyświetla dialog z prośbą o podanie nazwy dla nowego szablonu.
  3. Zapisywane są: liczba osób, budżet, transport, co robić, czego unikać.
  4. Nie są zapisywane: cel podróży, daty (te są specyficzne dla konkretnej podróży).
  5. Po zapisaniu użytkownik otrzymuje potwierdzenie.
  6. Nowy szablon pojawia się na liście preferencji użytkownika.

### US-014

- ID: US-014
- Tytuł: Wybór predefiniowanych opcji w formularzu
- Opis: Jako użytkownik chcę szybko wybrać opcje transportu i aktywności z gotowej listy zamiast wpisywać je ręcznie.
- Kryteria akceptacji:
  1. Pola "Transport", "Co robić" i "Czego unikać" wyświetlają listę predefiniowanych opcji jako checkboxy/multi-select.
  2. Użytkownik może zaznaczyć dowolną liczbę opcji z listy.
  3. Oprócz predefiniowanych opcji dostępne jest pole tekstowe na dodatkowe własne preferencje.
  4. Wybrane opcje są wyraźnie oznaczone wizualnie.
  5. Użytkownik może odznaczyć wcześniej wybrane opcje.
  6. Listy opcji są takie same dla "Co robić" i "Czego unikać" (te same kategorie aktywności).

## 7. Metryki sukcesu

1. Odsetek zaakceptowanych planów w pełni wygenerowanych przez AI ≥ 60 % w ciągu 3 miesięcy od startu.
2. 75 % aktywnych użytkowników generuje ≥ 3 plany rocznie.
3. 90 % aktywnych użytkowników ma zapisane preferencje w profilu.
4. Czas generowania planu ≤ 180 s w 95 percentylu.
5. Dostępność systemu ≥ 99 % w trakcie testów MVP.
