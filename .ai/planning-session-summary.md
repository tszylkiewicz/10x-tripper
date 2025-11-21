<conversation_summary>
<decisions>

1.  **Grupa docelowa:** Użytkownicy planujący wycieczki samodzielnie, bez względu na wiek czy status majątkowy.
2.  **Wynik AI (Plan):** Plan wycieczki to lista punktów z podziałem na dni, sugerującą porę dnia (np. rano, popołudnie), a nie konkretne godziny.
3.  **Preferencje w profilu:** Służą jako ogólny kontekst dla AI (np. stała grupa podróżnicza, ogólne zainteresowania) i mogą być zapisywane jako szablony do ponownego użytku.
4.  **Preferencje w notatce:** Notatka zawiera dedykowane pola na to, co użytkownik chce robić, a czego unikać. Te dane mają najwyższy priorytet i nadpisują preferencje z profilu.
5.  **Dane wejściowe do planu:** Wymagane pola to: miejsce docelowe, liczba osób, daty, sposób transportu i budżet (niski/średni/wysoki).
6.  **Rekomendacje noclegowe:** AI będzie rekomendować ogólne obszary (miasta, dzielnice), a nie konkretne obiekty.
7.  **Cykl życia planu:** Wygenerowany przez AI plan jest propozycją. Użytkownik musi go jawnie "zaakceptować", aby został zapisany. Nowo zaakceptowany plan nadpisuje poprzedni powiązany z daną notatką.
8.  **Organizacja treści:** Będą istnieć dwie osobne listy: jedna dla notatek bez zaakceptowanego planu i druga dla wycieczek z zaakceptowanym planem. Po akceptacji planu, notatka "przechodzi" z pierwszej listy na drugą, stając się częścią widoku planu.
    </decisions>

<matched_recommendations>

1.  W MVP AI powinno sugerować porę dnia (rano, popołudnie) zamiast konkretnych godzin, aby uniknąć problemów z niedokładnym szacowaniem czasu i zachować prostotę.
2.  Preferencje zdefiniowane bezpośrednio w notatce (co robić / czego unikać) powinny mieć zawsze wyższy priorytet niż ogólne preferencje zapisane w profilu użytkownika.
3.  Wybór środka transportu powinien wpływać na logikę AI – grupowanie atrakcji blisko siebie dla transportu pieszego i proponowanie bardziej oddalonych miejsc przy wyborze samochodu.
4.  Nowo zaakceptowany plan powinien nadpisywać poprzednią wersję planu powiązaną z tą samą notatką, co upraszcza zarządzanie wersjami w MVP.
5.  Wprowadzenie możliwości zapisywania szablonów preferencji (np. "Wyjazd rodzinny") przyspieszy proces tworzenia powtarzalnych typów wycieczek.
6.  W przypadku niemożliwych do zrealizowania próśb (np. plaża w Warszawie zimą), AI powinno zwrócić grzeczny komunikat o niemożności wykonania zadania, zamiast generować błędny plan.
    </matched_recommendations>

<prd_planning_summary>

### a. Główne wymagania funkcjonalne produktu

1.  **System kont i profili użytkowników:** Umożliwia rejestrację, logowanie i zarządzanie profilem, w tym sekcją do tworzenia i edycji szablonów preferencji turystycznych.
2.  **Tworzenie notatek podróżniczych:** Interfejs do tworzenia notatek, które są punktem wyjścia do generowania planu. Musi zawierać ustrukturyzowane pola (miejsce docelowe, daty, liczba osób, transport, budżet) oraz pola tekstowe na szczegółowe preferencje ("co robić" i "czego unikać").
3.  **Generator planów oparty na AI:** Kluczowa funkcja, która na podstawie danych z notatki generuje propozycję planu wycieczki. Plan zawiera listę atrakcji z podziałem na dni i sugerowane pory dnia.
4.  **System zarządzania notatkami i planami:** Dwa oddzielne widoki/listy:
    - Lista notatek, dla których nie ma jeszcze zaakceptowanego planu.
    - Lista zaakceptowanych planów, gdzie każdy plan jest powiązany ze swoją notatką źródłową.
5.  **Mechanizm akceptacji i nadpisywania planu:** Użytkownik musi aktywnie zaakceptować wygenerowaną propozycję, aby ją zapisać. Ponowne wygenerowanie i zaakceptowanie planu dla tej samej notatki nadpisuje poprzednią wersję.

### b. Kluczowe historie użytkownika i ścieżki korzystania

1.  **Jako nowy użytkownik, chcę stworzyć swój pierwszy plan wycieczki:**
    - Rejestruję się i loguję do aplikacji.
    - Tworzę nową notatkę, podając kluczowe dane: cel podróży, daty, budżet.
    - Wpisuję w dedykowanych polach, co lubię robić (np. zwiedzać muzea, chodzić po górach) i czego unikać (np. tłumów, klubów nocnych).
    - Uruchamiam generowanie planu.
    - Przeglądam propozycję AI. Jeśli mi się podoba, akceptuję ją, co powoduje jej zapisanie na liście moich planów.

2.  **Jako powracający użytkownik, chcę zaplanować kolejny wyjazd z tą samą grupą:**
    - Loguję się do aplikacji.
    - W profilu mam zapisany szablon preferencji "Wyjazd z przyjaciółmi" (np. 4 osoby, preferencje: puby, muzyka na żywo, unikanie muzeów).
    - Tworzę nową notatkę, wybieram zapisany szablon preferencji, podaję tylko nowy cel podróży i daty.
    - Generuję i akceptuję plan.

3.  **Jako użytkownik, chcę dopracować swój plan:**
    - Odnajduję na liście planów wycieczkę, którą chcę zmienić.
    - Otwieram powiązaną z nią notatkę i modyfikuję jej treść (np. dodaję nową atrakcję do odwiedzenia).
    - Ponownie generuję plan.
    - Nowa propozycja bardziej mi odpowiada, więc akceptuję ją, nadpisując poprzednią wersję.

### c. Ważne kryteria sukcesu i sposoby ich mierzenia

- **Cel długoterminowy 1:** 75% użytkowników generuje 3 lub więcej planów wycieczek na rok.
- **Cel długoterminowy 2:** 90% użytkowników ma dodane preferencje do konta.
- **Sposób mierzenia dla MVP:** Ze względu na zamkniętą grupę testową i brak mechanizmów analitycznych/feedbacku, sukces będzie mierzony jakościowo, poprzez obserwację i bezpośrednią rozmowę z testerami. Ilościowe mierzenie celów długoterminowych nie jest priorytetem na tym etapie.
  </prd_planning_summary>

<unresolved_issues>

1.  **Projekt interfejsu użytkownika (UI/UX):** Nie zdefiniowano wyglądu i działania kluczowych ekranów, takich jak listy notatek/planów, formularz tworzenia notatki, widok wygenerowanego planu oraz ekrany "pustego stanu".
2.  **Onboarding użytkownika:** Brak zdefiniowanego procesu wprowadzającego dla nowych użytkowników, który wyjaśniłby unikalny przepływ pracy w aplikacji (notatka -> generowanie -> akceptacja).
3.  **Obsługa przypadków brzegowych:** Nie określono, jak aplikacja ma się zachować w przypadku utraty połączenia, odświeżenia strony w trakcie generowania planu czy próby działania, gdy globalny budżet AI jest na wyczerpaniu.
4.  **Komunikacja z użytkownikiem:** Brak zdefiniowanych komunikatów, które będą wyświetlane użytkownikowi po wyczerpaniu globalnego budżetu AI.
5.  **Wybór technologii AI:** Nie podjęto decyzji dotyczącej konkretnego modelu lub dostawcy usług AI.
    </unresolved_issues>
    </conversation_summary>
