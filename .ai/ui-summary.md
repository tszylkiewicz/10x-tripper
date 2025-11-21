<conversation_summary>
<decisions>
Strona główna: dashboard z listą planów i przyciskiem „Utwórz plan”.
Nawigacja do szczegółów planu: kliknięcie w kartę na liście.
Generowanie planu: jednolity loader (bez progresu) widoczny do otrzymania 200/201.
Edycja planu: modal (slide-over na mobile, 80 % szer. na desktop, max-width 1024 px) z obsługą drag & drop dni/aktywności.
Potwierdzenie porzucenia edycji: dialog „Odrzuć zmiany?”.
Nowy plan: osobny route /trip-plans/new.
Plan details: pełnoekranowa podstrona /trip-plans/:id.
Autentykacja: publiczne /login, /register, /forgot-password (+ /account/change-password); wykorzystanie @supabase/auth-helpers-react.
Auto-logout: timer wywołujący supabase.auth.signOut() minutę przed expires_at.
Zarządzanie stanem: useState/useReducer + UserContext z metodą refresh().
API: wspólny hook useApi (get, post, patch) z automatycznym tokenem i obsługą błędów.
Interakcje UI: toast provider (FIFO, max 3) + Radix Dialog, AlertDialog, Toast.
Responsywność: Mobile-First Tailwind CSS; dark mode w MVP.
Dostępność: brak wsparcia klawiatury dla DnD w MVP.
Bezpieczeństwo: klient nie pokazuje skasowanych planów; backend filtruje deleted_at.
Strony błędów: proste /404 i /500 z przyciskiem „Powrót do strony głównej”.
Preferencje: edycja na osobnym route, potwierdzenie delete w AlertDialog.
Cache danych: brak SWR/React-Query w MVP.
Testy: Playwright E2E dla kluczowych flow.
Język UI: tylko PL w MVP.
</decisions>
<matched_recommendations>
Stworzenie top-level navbar z dwiema zakładkami „Plany” i „Preferencje”.
Użycie Tailwind dark: klas i zapisu wyboru w localStorage.
Implementacja globalnego AuthGate z spinnerem startowym (supabase.auth.getSession()).
Wykorzystanie Zod do walidacji danych formularzy (plan, preferencje).
Zastosowanie Radix komponentów dla dialogów, modalów i toastów (dostępność + focus trap).
Loader przy zapisie planu: przycisk ze spinnerem blokujący kolejne kliknięcia.
Brak lokalnego cache w MVP; odświeżanie danych po każdej modyfikacji.
Użycie Tailwind Typography i tailwind-contrast w CI do weryfikacji kontrastu.
Infinite scroll + paginacja i lazy loading listy planów – planowane po MVP.
Playwright w GitHub Actions jako część pipeline’u CI – planowane po MVP.
</matched_recommendations>
<ui_architecture_planning_summary>
Aplikacja będzie zbudowana w Astro 5 + React 19 z Tailwind 4 i komponentami Shadcn/Radix. Publiczne widoki (/login, /register, /forgot-password) korzystają z minimalistycznego layoutu. Po zalogowaniu użytkownik trafia na dashboard z listą planów i przyciskiem „Utwórz plan”. Lista plans renderuje karty; kliknięcie otwiera pełnoekranową stronę szczegółów planu.
Tworzenie nowego planu odbywa się na trasie /trip-plans/new. Po wysłaniu formularza pojawia się globalny loader aż do odpowiedzi API. Na sukces użytkownik przechodzi do modalu edytora planu, gdzie może przeciągać dni i aktywności. Modal jest slide-over na mobile i oknem 80 % szerokości na desktopie. Zamknięcie lub usunięcie zawartości wymaga potwierdzenia przez AlertDialog.
Preferencje mają analogiczny układ: lista i osobne widoki tworzenia/edycji. Wszystkie żądania do API przechodzą przez hook useApi doklejający token Supabase i wywołujący toast z odpowiednim statusem. Stany globalne (użytkownik, preferencje, plany) są trzymane w UserContext; po każdej operacji zakończonej sukcesem wywoływana jest metoda refresh().
Responsywność opiera się na Mobile-First Tailwind CSS; dark mode obsługiwany od MVP. Komponent AuthGate renderuje spinner do czasu potwierdzenia sesji. Loader w przyciskiem zapisu chroni przed duplikowaniem żądań. Dostępność zapewniają Radix komponenty; specyficzne wsparcie klawiatury dla DnD zostanie dodane po MVP. Bezpieczeństwo: soft-delete i filtrowanie deleted_at po stronie backendu, auto-logout tuż przed wygaśnięciem tokenu.
Testy E2E (Playwright) obejmą login, generowanie planu, akceptację i edycję. Pipeline CI zweryfikuje kontrast kolorów oraz uruchomi testy Playwright.
</ui_architecture_planning_summary>
<unresolved_issues>
Mechanizm obsługi timeoutu generowania (≥ 180 s) i błędu 429 – obecnie odłożone, wymaga planu na późniejsze etapy.
Brak autosave szkicu planu w localStorage – decyzja o ewentualnej implementacji po MVP.
Potencjalna przyszła internacjonalizacja (i18n) – należy określić moment wprowadzenia.
Brak wsparcia klawiatury w drag & drop – do rozważenia dla dostępności po MVP.
Strategia cache/paginacji dla listy planów – do zdefiniowania przed przekroczeniem 20 rekordów.
</unresolved_issues>
</conversation_summary>
