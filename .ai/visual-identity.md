# Identyfikacja Wizualna - Tripper

Dokument definiuje spójną identyfikację wizualną aplikacji Tripper. Wszystkie elementy interfejsu powinny być zgodne z
poniższymi wytycznymi.

---

## 1. Logo

> **Status:** Opracowane (v1.0)

### 1.1 Koncepcja

Logo Tripper to abstrakcyjna fuzja **plecaka podróżnego** i **pinezki mapy**, z wewnętrzną zakrzywioną ścieżką
symbolizującą wielodniowe podróże i plany generowane przez AI. Mały akcent w kolorze Warm Sand reprezentuje "osiągnięty
cel" - moment dotarcia do destynacji oraz symbolizuje słońce jako zwiastun dobrej pogody w trakcie podróży.

**Dlaczego ta koncepcja działa:**

- Subtelnie komunikuje podróże + planowanie bez dosłowności
- Zaokrąglona geometria i miękkie narożniki = przyjazna osobowość spójna z fontem Nunito
- Czysta, nowoczesna sylwetka = wiarygodność SaaS/AI
- Silny kształt ikony = doskonały dla favicon, ikony aplikacji i awatarów

### 1.2 Wersje logo

#### A. Logo główne (poziome)

| Cecha              | Opis                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| **Zastosowanie**   | Nagłówek strony, landing page, materiały marketingowe, dokumentacja         |
| **Struktura**      | Symbol (plecak + pinezka + ścieżka) + wordmark "Tripper"                    |
| **Kolor symbolu**  | Deep Teal + Light Teal + akcent Sand                                        |
| **Kolor wordmark** | Deep Teal `#0D9488`                                                         |
| **Tło**            | Podstawowe: białe `#FFFFFF`, działa też na ciemnym tle (wersja inwertowana) |

#### B. Logo symboliczne (tylko ikona)

| Cecha              | Opis                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------- |
| **Zastosowanie**   | Ikona aplikacji, favicon, awatary social media, małe elementy UI                                         |
| **Zasady**         | Zawsze używaj kompletnego symbolu, nigdy nie przycinaj wewnętrznych elementów (pinezka, ścieżka, kropka) |
| **Pozycjonowanie** | Preferuj wyśrodkowanie wewnątrz kontenerów                                                               |

#### C. Formaty plików

| Format            | Zastosowanie                                   |
| ----------------- | ---------------------------------------------- |
| SVG               | Master (web, skalowanie, narzędzia projektowe) |
| PNG (1x, 2x, 3x)  | UI, marketing, szybkie użycie                  |
| PNG (transparent) | Nakładki, prezentacje                          |

### 1.3 Użycie kolorów w logo

| Kolor         | Hex       | Zastosowanie w logo              |
| ------------- | --------- | -------------------------------- |
| Deep Teal     | `#0D9488` | Główny kolor marki, wordmark     |
| Primary Dark  | `#0F766E` | Głębia ikony, cienie             |
| Primary Light | `#5EEAD4` | Podświetlenie ścieżki, ruch      |
| Warm Sand     | `#F59E0B` | Tylko akcent (kropka destynacji) |

**Zasady:**

- Odcienie turkusu stanowią **90-95%** logo
- Warm Sand **nigdy nie dominuje**
- Nie wprowadzaj gradientów
- Nie zmieniaj kolorów logo poza zdefiniowaną paletą

### 1.4 Strefa ochronna

Aby zapewnić czytelność i wpływ wizualny:

- Zdefiniuj **X = wysokość pinezki mapy** w symbolu
- Zachowaj **minimalną strefę ochronną = X** po wszystkich stronach
- Żaden tekst, elementy UI ani krawędzie nie mogą wchodzić w tę strefę

Dotyczy zarówno logo głównego, jak i samego symbolu.

### 1.5 Minimalne rozmiary

#### Symbol (tylko ikona)

| Zastosowanie    | Minimalny rozmiar |
| --------------- | ----------------- |
| Favicon         | 16×16 px          |
| Ikona UI        | 24×24 px          |
| Ikona aplikacji | 48×48 px i więcej |

#### Pełne logo (ikona + wordmark)

| Zastosowanie | Minimalna szerokość |
| ------------ | ------------------- |
| Web          | 120 px              |
| Druk         | 30 mm               |

> Poniżej tych rozmiarów używaj **tylko symbolu**.

### 1.6 Eksporty favicon i ikony aplikacji

#### Favicon

| Rozmiar    | Format |
| ---------- | ------ |
| 16×16      | PNG    |
| 32×32      | PNG    |
| 48×48      | PNG    |
| Skalowalny | SVG    |

**Wytyczne:** Symbol wyśrodkowany, bez usuwania paddingu.

### 1.7 Dozwolone i niedozwolone użycia

#### ✅ Dozwolone

- Używaj tylko zatwierdzonych kolorów
- Zachowuj proporcje
- Używaj samego symbolu, gdy przestrzeń jest ograniczona
- Zachowuj strefę ochronną

#### ❌ Niedozwolone

- Rozciąganie lub ściskanie logo
- Dodawanie cieni, obramowań lub efektów
- Zmiana kolorów
- Umieszczanie na tle o niskim kontraście
- Przycinanie wewnętrznych elementów symbolu
- Używanie logo poniżej minimalnych rozmiarów

---

## 2. Paleta kolorów

### 2.1 Ocean Explorer

Paleta inspirowana morzem i niebem, wywołująca poczucie przygody i podróży. Stonowane odcienie turkusu budują zaufanie,
a ciepły akcent piasku dodaje energii.

### 2.2 Kolory główne

| Rola          | Nazwa      | Hex       | RGB            | Użycie                        |
| ------------- | ---------- | --------- | -------------- | ----------------------------- |
| Primary       | Deep Teal  | `#0D9488` | `13, 148, 136` | Przyciski, linki, CTA         |
| Primary Dark  | Dark Teal  | `#0F766E` | `15, 118, 110` | Stany hover, aktywne elementy |
| Primary Light | Light Teal | `#5EEAD4` | `94, 234, 212` | Tła wyróżnień, ikony          |

### 2.3 Kolory akcentowe

| Rola            | Nazwa      | Hex       | RGB             | Użycie                       |
| --------------- | ---------- | --------- | --------------- | ---------------------------- |
| Secondary       | Warm Sand  | `#F59E0B` | `245, 158, 11`  | Akcenty, wyróżnienia, badge  |
| Secondary Dark  | Dark Sand  | `#D97706` | `217, 119, 6`   | Stany hover akcentów         |
| Secondary Light | Light Sand | `#FDE68A` | `253, 230, 138` | Tła ostrzeżeń, podświetlenia |

### 2.4 Kolory neutralne

| Rola        | Nazwa       | Hex       | RGB             | Użycie                    |
| ----------- | ----------- | --------- | --------------- | ------------------------- |
| Background  | Off White   | `#FAFAF9` | `250, 250, 249` | Tło strony                |
| Surface     | White       | `#FFFFFF` | `255, 255, 255` | Karty, modale, formularze |
| Border      | Light Gray  | `#E2E8F0` | `226, 232, 240` | Obramowania, separatory   |
| Border Dark | Medium Gray | `#CBD5E1` | `203, 213, 225` | Aktywne obramowania       |

### 2.5 Kolory tekstu

| Rola           | Nazwa      | Hex       | RGB             | Użycie                         |
| -------------- | ---------- | --------- | --------------- | ------------------------------ |
| Text Primary   | Slate      | `#1E293B` | `30, 41, 59`    | Nagłówki, tekst główny         |
| Text Secondary | Gray       | `#64748B` | `100, 116, 139` | Podpisy, etykiety, placeholder |
| Text Muted     | Light Gray | `#94A3B8` | `148, 163, 184` | Wyłączone elementy, hinty      |
| Text Inverse   | White      | `#FFFFFF` | `255, 255, 255` | Tekst na ciemnym tle           |

### 2.6 Kolory semantyczne

| Rola          | Nazwa       | Hex       | RGB             | Użycie                  |
| ------------- | ----------- | --------- | --------------- | ----------------------- |
| Success       | Green       | `#22C55E` | `34, 197, 94`   | Potwierdzenia, sukces   |
| Success Light | Light Green | `#DCFCE7` | `220, 252, 231` | Tło komunikatów sukcesu |
| Error         | Red         | `#EF4444` | `239, 68, 68`   | Błędy, walidacja        |
| Error Light   | Light Red   | `#FEE2E2` | `254, 226, 226` | Tło komunikatów błędów  |
| Warning       | Amber       | `#F59E0B` | `245, 158, 11`  | Ostrzeżenia             |
| Warning Light | Light Amber | `#FEF3C7` | `254, 243, 199` | Tło ostrzeżeń           |
| Info          | Blue        | `#3B82F6` | `59, 130, 246`  | Informacje              |
| Info Light    | Light Blue  | `#DBEAFE` | `219, 234, 254` | Tło informacji          |

### 2.7 Tryb ciemny (Dark Mode)

> **Status:** Do opracowania w przyszłych wersjach

| Rola            | Nazwa      | Hex       | Użycie        |
| --------------- | ---------- | --------- | ------------- |
| Background Dark | Dark Slate | `#0F172A` | Tło strony    |
| Surface Dark    | Slate      | `#1E293B` | Karty, modale |
| Border Dark     | Gray       | `#334155` | Obramowania   |

### 2.8 Zasady stosowania kolorów

1. **Kontrast** - zachowaj minimalny współczynnik kontrastu 4.5:1 dla tekstu (WCAG AA)
2. **Hierarchia** - używaj Primary dla głównych akcji, Secondary dla wyróżnień
3. **Spójność** - jeden kolor semantyczny = jedno znaczenie w całej aplikacji
4. **Oszczędność** - nie używaj więcej niż 3 kolorów na jednym ekranie (poza neutralnymi)

---

## 3. Typografia

### 3.1 Rodzina fontów

| Rola     | Font                  | Źródło       | Użycie                          |
| -------- | --------------------- | ------------ | ------------------------------- |
| Główny   | Nunito                | Google Fonts | Wszystkie elementy UI           |
| Kod      | JetBrains Mono        | Google Fonts | Fragmenty kodu, dane techniczne |
| Fallback | system-ui, sans-serif | System       | Gdy font główny niedostępny     |

**Nunito** - zaokrąglona, przyjazna czcionka sans-serif idealnie pasująca do charakteru aplikacji podróżniczej. Miękkie
końcówki liter kojarzą się z relaksem i przygodą, harmonizując z paletą Ocean Explorer.

**Implementacja CSS:**

```css
font-family:
  "Nunito",
  system-ui,
  -apple-system,
  sans-serif;
```

**Import Google Fonts:**

```html
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

### 3.2 Skala typograficzna

Skala oparta na współczynniku 1.25 (Major Third), zoptymalizowana dla mobile-first.

| Nazwa | Rozmiar         | Line Height | Letter Spacing | Użycie                     |
| ----- | --------------- | ----------- | -------------- | -------------------------- |
| xs    | 12px / 0.75rem  | 1.5 (18px)  | 0.01em         | Hinty, etykiety pomocnicze |
| sm    | 14px / 0.875rem | 1.5 (21px)  | 0              | Podpisy, małe etykiety     |
| base  | 16px / 1rem     | 1.6 (26px)  | 0              | Tekst główny, paragrafy    |
| lg    | 18px / 1.125rem | 1.5 (27px)  | -0.01em        | Większy tekst, lead        |
| xl    | 20px / 1.25rem  | 1.4 (28px)  | -0.01em        | Małe nagłówki              |
| 2xl   | 24px / 1.5rem   | 1.35 (32px) | -0.02em        | Nagłówki sekcji            |
| 3xl   | 30px / 1.875rem | 1.3 (39px)  | -0.02em        | Nagłówki stron             |
| 4xl   | 36px / 2.25rem  | 1.2 (43px)  | -0.02em        | Duże nagłówki              |
| 5xl   | 48px / 3rem     | 1.1 (53px)  | -0.03em        | Hero, tytuły główne        |

### 3.3 Style nagłówków

| Element | Rozmiar     | Waga           | Kolor                    | Margines dolny |
| ------- | ----------- | -------------- | ------------------------ | -------------- |
| H1      | 4xl (36px)  | Bold (700)     | Text Primary `#1E293B`   | 24px           |
| H2      | 3xl (30px)  | Bold (700)     | Text Primary `#1E293B`   | 20px           |
| H3      | 2xl (24px)  | SemiBold (600) | Text Primary `#1E293B`   | 16px           |
| H4      | xl (20px)   | SemiBold (600) | Text Primary `#1E293B`   | 12px           |
| H5      | lg (18px)   | Medium (500)   | Text Primary `#1E293B`   | 8px            |
| H6      | base (16px) | Medium (500)   | Text Secondary `#64748B` | 8px            |

**Wersje mobile (< 768px):**

| Element | Rozmiar mobile |
| ------- | -------------- |
| H1      | 3xl (30px)     |
| H2      | 2xl (24px)     |
| H3      | xl (20px)      |
| H4      | lg (18px)      |

### 3.4 Style tekstu

| Styl       | Rozmiar     | Waga          | Kolor                    | Użycie                     |
| ---------- | ----------- | ------------- | ------------------------ | -------------------------- |
| Body       | base (16px) | Regular (400) | Text Primary `#1E293B`   | Tekst główny, opisy        |
| Body Small | sm (14px)   | Regular (400) | Text Primary `#1E293B`   | Treść pomocnicza           |
| Lead       | lg (18px)   | Regular (400) | Text Secondary `#64748B` | Wprowadzenia, streszczenia |
| Caption    | xs (12px)   | Regular (400) | Text Secondary `#64748B` | Podpisy pod obrazami       |
| Label      | sm (14px)   | Medium (500)  | Text Primary `#1E293B`   | Etykiety formularzy        |
| Helper     | xs (12px)   | Regular (400) | Text Muted `#94A3B8`     | Tekst pomocniczy, hinty    |
| Link       | inherit     | Medium (500)  | Primary `#0D9488`        | Linki w tekście            |
| Link Hover | inherit     | Medium (500)  | Primary Dark `#0F766E`   | Stan hover linków          |

### 3.5 Wagi fontów

| Waga     | Wartość | Użycie                      |
| -------- | ------- | --------------------------- |
| Regular  | 400     | Tekst główny, paragrafy     |
| Medium   | 500     | Etykiety, linki, akcenty    |
| SemiBold | 600     | Nagłówki H3-H5, przyciski   |
| Bold     | 700     | Nagłówki H1-H2, wyróżnienia |

### 3.6 Zasady stosowania typografii

1. **Czytelność** - minimalny rozmiar tekstu to 12px (xs), dla głównej treści 16px (base)
2. **Hierarchia** - używaj maksymalnie 3 poziomów hierarchii na jednym ekranie
3. **Kontrast** - tekst musi spełniać WCAG AA (4.5:1 dla normalnego, 3:1 dla dużego)
4. **Spójność** - używaj tylko zdefiniowanych stylów, nie twórz własnych kombinacji
5. **Mobile-first** - nagłówki skalują się w dół na mniejszych ekranach
6. **Odstępy** - używaj line-height z tabeli, nie modyfikuj arbitralnie

---

## 6. Komponenty UI

> **Status:** Opracowane (v1.0)

Aplikacja wykorzystuje bibliotekę **Shadcn/ui** (bazującą na Radix UI) z Tailwind CSS. Poniższe wytyczne definiują jak komponenty powinny być stylowane zgodnie z paletą Ocean Explorer.

### 6.1 Mapowanie kolorów na tokeny CSS

Tokeny CSS używane w komponentach mapują się na paletę Ocean Explorer:

| Token CSS              | Kolor Ocean Explorer | Hex       | Zastosowanie                              |
| ---------------------- | -------------------- | --------- | ----------------------------------------- |
| `--primary`            | Deep Teal            | `#0D9488` | Główne przyciski, linki, CTA              |
| `--primary-foreground` | White                | `#FFFFFF` | Tekst na przyciskach primary              |
| `--secondary`          | Light Gray           | `#F1F5F9` | Przyciski secondary, tła akcentów         |
| `--accent`             | Light Gray           | `#F1F5F9` | Hover na elementach UI, tła interaktywne  |
| `--destructive`        | Red                  | `#EF4444` | Przyciski usuwania, błędy                 |
| `--muted`              | Light Gray           | `#F1F5F9` | Tła wyłączonych elementów                 |
| `--muted-foreground`   | Gray                 | `#64748B` | Tekst pomocniczy, placeholder             |
| `--background`         | Off White            | `#FAFAF9` | Tło strony                                |
| `--card`               | White                | `#FFFFFF` | Tło kart, modali, formularzy              |
| `--border`             | Light Gray           | `#E2E8F0` | Obramowania elementów                     |
| `--input`              | Light Gray           | `#E2E8F0` | Obramowania pól formularzy                |
| `--ring`               | Deep Teal            | `#0D9488` | Focus ring (50% opacity)                  |

### 6.2 Przyciski

#### Warianty

| Wariant       | Tło                  | Tekst               | Obramowanie          | Zastosowanie              |
| ------------- | -------------------- | ------------------- | -------------------- | ------------------------- |
| `default`     | Deep Teal `#0D9488`  | White `#FFFFFF`     | Brak                 | Główne akcje (CTA)        |
| `secondary`   | Light Gray `#F1F5F9` | Slate `#1E293B`     | Brak                 | Akcje drugorzędne         |
| `outline`     | Transparent          | Slate `#1E293B`     | Light Gray `#E2E8F0` | Akcje alternatywne        |
| `ghost`       | Transparent          | Slate `#1E293B`     | Brak                 | Akcje minimalistyczne     |
| `destructive` | Red `#EF4444`        | White `#FFFFFF`     | Brak                 | Akcje usuwania/anulowania |
| `link`        | Transparent          | Deep Teal `#0D9488` | Brak                 | Linki w tekście           |

#### Rozmiary

| Rozmiar   | Wysokość | Padding (px/py) | Font        | Zastosowanie           |
| --------- | -------- | --------------- | ----------- | ---------------------- |
| `sm`      | 32px     | 12px / 0        | 14px Medium | Kompaktowe akcje       |
| `default` | 36px     | 16px / 8px      | 14px Medium | Standardowe przyciski  |
| `lg`      | 40px     | 24px / 8px      | 16px Medium | Wyróżnione akcje       |
| `icon`    | 36px     | 0 (kwadrat)     | -           | Przyciski z samą ikoną |

#### Stany

| Stan       | Zmiana wizualna                                         |
| ---------- | ------------------------------------------------------- |
| `hover`    | Tło ciemniejsze o 10% (Dark Teal `#0F766E` dla primary) |
| `focus`    | Ring 3px w kolorze primary z 50% opacity                |
| `disabled` | Opacity 50%, cursor not-allowed                         |
| `loading`  | Spinner animowany, tekst przyciemiony                   |

#### System dwupoziomowych stanów hover (Outline variant)

Przyciski `variant="outline"` używają dwóch różnych wzorców hover w zależności od kontekstu:

**Poziom 1: Akcje kluczowe (Primary CTAs w kartach)**
- Transformacja do wypełnionego przycisku
- Stosowane dla głównych akcji użytkownika
- Przykłady:
  ```tsx
  // Primary action
  className="hover:bg-primary hover:text-primary-foreground"
  // Destructive action
  className="hover:bg-destructive hover:text-destructive-foreground"
  ```
- Użycie: "Zobacz szczegóły", "Edytuj", "Utwórz plan", "Usuń" (w kartach)

**Poziom 2: Akcje pomocnicze (domyślny hover)**
- Subtelna zmiana tła na `--accent` (#F1F5F9)
- Stosowane dla akcji drugorzędnych
- Przykłady: przyciski Cancel, akcje formularzy, nawigacja
- Użycie: Wariant outline bez dodatkowych klas hover

**Zasada stosowania:**
- Jeśli akcja jest głównym celem karty/sekcji → użyj poziomu 1
- Jeśli akcja jest pomocnicza lub anulująca → użyj poziomu 2 (domyślny)

#### Ikony w przyciskach

- Rozmiar ikon: 16px (`size-4`)
- Odstęp ikona-tekst: 8px (`gap-2`)
- Ikony dziedziczą kolor tekstu przycisku

### 6.3 Formularze

#### Input (pole tekstowe)

| Właściwość    | Wartość                                   |
| ------------- | ----------------------------------------- |
| Wysokość      | 36px (`h-9`)                              |
| Border        | 1px Light Gray `#E2E8F0`                  |
| Border radius | 6px (`rounded-md`)                        |
| Tło           | White `#FFFFFF`                           |
| Tekst         | Slate `#1E293B`, 16px Regular             |
| Placeholder   | Gray `#64748B`                            |
| Padding       | 12px horizontal                           |
| Focus         | Border Deep Teal, ring 3px primary/50     |
| Error         | Border Red `#EF4444`, ring destructive/50 |
| Disabled      | Tło `#F1F5F9`, opacity 50%                |

#### Textarea

| Właściwość      | Wartość                      |
| --------------- | ---------------------------- |
| Min-height      | 64px (4 linie)               |
| Auto-expand     | Tak (`field-sizing-content`) |
| Pozostałe style | Jak Input                    |

#### Select (dropdown)

| Właściwość    | Wartość                                  |
| ------------- | ---------------------------------------- |
| Trigger       | Style jak Input + ikona ChevronDown      |
| Content       | White tło, border, shadow-md, rounded-md |
| Item hover    | Accent background `#F1F5F9`              |
| Item selected | CheckIcon po lewej stronie               |
| Animacja      | Fade + slide-down                        |

#### Checkbox

| Właściwość    | Wartość                                  |
| ------------- | ---------------------------------------- |
| Rozmiar       | 16px × 16px (`size-4`)                   |
| Border        | 1px Light Gray `#E2E8F0`                 |
| Border radius | 4px (`rounded-sm`)                       |
| Checked       | Tło Deep Teal `#0D9488`, CheckIcon biały |
| Focus         | Ring 3px primary/50                      |

#### Label

| Właściwość | Wartość                                      |
| ---------- | -------------------------------------------- |
| Font       | 14px Medium (`text-sm font-medium`)          |
| Kolor      | Slate `#1E293B`                              |
| Odstęp     | 8px poniżej labela (`mb-2`)                  |
| Required   | Gwiazdka `*` w kolorze Red `#EF4444` (opcja) |

#### Komunikaty walidacji

| Typ     | Kolor tekstu    | Ikona         | Tło (Alert)           |
| ------- | --------------- | ------------- | --------------------- |
| Error   | Red `#EF4444`   | AlertCircle   | Light Red `#FEE2E2`   |
| Success | Green `#22C55E` | CheckCircle   | Light Green `#DCFCE7` |
| Info    | Blue `#3B82F6`  | Info          | Light Blue `#DBEAFE`  |
| Warning | Amber `#F59E0B` | AlertTriangle | Light Amber `#FEF3C7` |

### 6.4 Karty

#### Podstawowa karta

| Właściwość    | Wartość                                  |
| ------------- | ---------------------------------------- |
| Tło           | White `#FFFFFF`                          |
| Border        | 1px Light Gray `#E2E8F0`                 |
| Border radius | 12px (`rounded-xl`)                      |
| Shadow        | `shadow-sm` (0 1px 2px rgba(0,0,0,0.05)) |
| Padding       | 24px (`p-6`)                             |

#### Struktura karty

```
┌─────────────────────────────────────────┐
│ CardHeader (px-6, gap-2)                │
│   CardTitle (font-semibold, leading-none)│
│   CardDescription (text-sm, muted)      │
│   CardAction (prawy górny róg, opcja)   │
├─────────────────────────────────────────┤
│ CardContent (px-6, py-0)                │
│   Treść karty                           │
├─────────────────────────────────────────┤
│ CardFooter (px-6, pt-0)                 │
│   Akcje (przyciski)                     │
└─────────────────────────────────────────┘
```

#### Stany kart

| Stan            | Zmiana wizualna                            |
| --------------- | ------------------------------------------ |
| Default         | Shadow-sm                                  |
| Hover           | Shadow-lg, cursor-pointer (karty klikalne) |
| Active/Selected | Border Deep Teal `#0D9488`                 |
| Disabled        | Opacity 60%, pointer-events none           |

### 6.5 Nawigacja

#### Navbar

| Właściwość | Wartość                         |
| ---------- | ------------------------------- |
| Wysokość   | 64px (`h-16`)                   |
| Tło        | White `#FFFFFF`                 |
| Border     | 1px bottom Light Gray `#E2E8F0` |
| Position   | Sticky top-0, z-index 40        |
| Padding    | 16px horizontal (`px-4`)        |

#### Logo w navbar

| Właściwość | Wartość                                   |
| ---------- | ----------------------------------------- |
| Ikona      | MapPin, 24px, Deep Teal `#0D9488`         |
| Tekst      | "Tripper", 20px Bold, Deep Teal `#0D9488` |
| Odstęp     | 8px między ikoną a tekstem                |

#### Link nawigacyjny

| Stan    | Tło              | Tekst           | Font         |
| ------- | ---------------- | --------------- | ------------ |
| Default | Transparent      | Gray `#64748B`  | 14px Regular |
| Hover   | Accent `#F1F5F9` | Slate `#1E293B` | 14px Regular |
| Active  | Accent `#F1F5F9` | Slate `#1E293B` | 14px Medium  |

#### Menu użytkownika

| Właściwość  | Wartość                                  |
| ----------- | ---------------------------------------- |
| Trigger     | Ikona User + email (ukryty na mobile)    |
| Dropdown    | White tło, border, shadow-lg, rounded-md |
| Item hover  | Accent background                        |
| Logout item | Tekst destructive, ikona LogOut          |

### 6.6 Dialogi i modale

#### Dialog

| Właściwość | Wartość                                |
| ---------- | -------------------------------------- |
| Overlay    | Black 50% opacity (`bg-black/50`)      |
| Content    | White tło, rounded-lg, max-width 512px |
| Padding    | 24px (`p-6`)                           |
| Shadow     | shadow-lg                              |
| Animacja   | Fade-in + zoom-in (scale 95% → 100%)   |

#### Alert Dialog (potwierdzenie)

| Element       | Styl                               |
| ------------- | ---------------------------------- |
| Title         | 18px SemiBold, Slate               |
| Description   | 14px Regular, Gray `#64748B`       |
| Cancel button | Outline variant                    |
| Action button | Destructive variant (dla usuwania) |

#### Sheet (sidebar)

| Właściwość | Wartość                               |
| ---------- | ------------------------------------- |
| Width      | 75% ekranu, max 384px (`sm:max-w-sm`) |
| Tło        | White `#FFFFFF`                       |
| Overlay    | Black 80% opacity                     |
| Animacja   | Slide-in z prawej/lewej strony        |

### 6.7 Alerty i badge

#### Alert

| Wariant     | Tło                   | Border               | Ikona kolor     |
| ----------- | --------------------- | -------------------- | --------------- |
| Default     | Card `#FFFFFF`        | Light Gray `#E2E8F0` | Slate `#1E293B` |
| Destructive | Card `#FFFFFF`        | Light Gray `#E2E8F0` | Red `#EF4444`   |
| Success     | Light Green `#DCFCE7` | Green `#22C55E`      | Green `#22C55E` |
| Warning     | Light Amber `#FEF3C7` | Amber `#F59E0B`      | Amber `#F59E0B` |
| Info        | Light Blue `#DBEAFE`  | Blue `#3B82F6`       | Blue `#3B82F6`  |

#### Badge

| Wariant     | Tło                  | Tekst           | Zastosowanie         |
| ----------- | -------------------- | --------------- | -------------------- |
| Default     | Deep Teal `#0D9488`  | White `#FFFFFF` | Główne tagi          |
| Secondary   | Light Gray `#F1F5F9` | Slate `#1E293B` | Tagi drugorzędne     |
| Outline     | Transparent          | Slate `#1E293B` | Minimalistyczne tagi |
| Destructive | Red `#EF4444`        | White `#FFFFFF` | Ostrzeżenia, błędy   |

**Styl badge:**

- Border radius: pełny (`rounded-full`)
- Padding: 4px 10px
- Font: 12px Medium

### 6.8 Stany aplikacji

#### Loading (ładowanie)

| Element      | Styl                                |
| ------------ | ----------------------------------- |
| Spinner      | Border 4px, Deep Teal `#0D9488`     |
| Rozmiar małe | 32px (`size-8`) - dashboard         |
| Rozmiar duże | 40px (`size-10`) - pełnoekranowe    |
| Animacja     | Rotate 360° ciągła (`animate-spin`) |
| Tekst        | 14px Regular, Gray `#64748B`        |
| Layout       | Wycentrowany, padding 48px vertical |

#### Empty State (brak danych)

| Element  | Styl                                   |
| -------- | -------------------------------------- |
| Ikona    | 48px, Gray `#64748B`, w kółku muted    |
| Nagłówek | 18px SemiBold, Slate `#1E293B`         |
| Opis     | 14px Regular, Gray `#64748B`, max-w-sm |
| CTA      | Primary button                         |
| Layout   | Wycentrowany, padding 48px vertical    |

#### Error State (błąd)

| Element      | Styl                             |
| ------------ | -------------------------------- |
| Ikona        | AlertCircle, 48px, Red `#EF4444` |
| Tło ikony    | Light Red 10% opacity            |
| Komunikat    | 14px Regular, Slate `#1E293B`    |
| Retry button | Outline variant                  |

### 6.9 Ikony

#### Biblioteka

Aplikacja używa **Lucide React** jako biblioteki ikon.

#### Rozmiary

| Kontekst       | Rozmiar | Klasa       |
| -------------- | ------- | ----------- |
| W tekście      | 12px    | `size-3`    |
| Badge          | 12px    | `size-3`    |
| Button small   | 14px    | `size-3.5`  |
| Button default | 16px    | `size-4`    |
| Nav/Menu       | 20px    | `size-5`    |
| Empty/Error    | 32-48px | `size-8/10` |

#### Kolor ikon

- Ikony dziedziczą kolor tekstu (`currentColor`)
- Ikony semantyczne używają odpowiednich kolorów:
  - Success: Green `#22C55E`
  - Error: Red `#EF4444`
  - Warning: Amber `#F59E0B`
  - Info: Blue `#3B82F6`

### 6.10 Odstępy i layout

#### System odstępów

Aplikacja używa systemu odstępów opartego na wielokrotnościach 4px:

| Token | Wartość | Zastosowanie                          |
| ----- | ------- | ------------------------------------- |
| `1`   | 4px     | Minimalne odstępy (gap w badge)       |
| `2`   | 8px     | Odstępy w przyciskach, między ikonami |
| `3`   | 12px    | Padding inputów horizontal            |
| `4`   | 16px    | Standardowe odstępy między elementami |
| `6`   | 24px    | Padding kart, sekcji                  |
| `8`   | 32px    | Większe odstępy między sekcjami       |
| `12`  | 48px    | Padding stanów (loading, empty)       |
| `16`  | 64px    | Duże odstępy między sekcjami strony   |

#### Border radius

| Token          | Wartość | Zastosowanie                |
| -------------- | ------- | --------------------------- |
| `rounded-sm`   | 4px     | Checkbox                    |
| `rounded-md`   | 6px     | Inputy, przyciski, dropdown |
| `rounded-lg`   | 8px     | Dialogi, alerty             |
| `rounded-xl`   | 12px    | Karty                       |
| `rounded-full` | 9999px  | Badge, awatary              |

#### Cienie

| Token       | Wartość                     | Zastosowanie        |
| ----------- | --------------------------- | ------------------- |
| `shadow-sm` | 0 1px 2px rgba(0,0,0,0.05)  | Karty default       |
| `shadow-md` | 0 4px 6px rgba(0,0,0,0.1)   | Dropdown, popover   |
| `shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) | Karty hover, modale |

### 6.11 Responsywność

#### Breakpointy

| Breakpoint | Wartość | Zastosowanie     |
| ---------- | ------- | ---------------- |
| `sm`       | 640px   | Mobile → Tablet  |
| `md`       | 768px   | Tablet → Desktop |
| `lg`       | 1024px  | Desktop szeroki  |

#### Wzorce responsywne

1. **Navbar**: Menu hamburger na mobile, pełne menu na `sm`+
2. **Karty**: Full-width na mobile, grid na `sm`+
3. **Formularze**: Single column na mobile, multi-column na `md`+
4. **Dialogi**: Full-width na mobile, max-w na `sm`+
5. **Typografia**: Nagłówki skalują się w dół na mobile

---

## Historia zmian

| Data       | Autor | Opis zmiany                                                            |
| ---------- | ----- | ---------------------------------------------------------------------- |
| 2025-01-21 | -     | Utworzenie dokumentu, definicja palety Ocean Explorer                  |
| 2026-01-21 | -     | Dodanie sekcji typografii - font Nunito                                |
| 2026-01-21 | -     | Opracowanie sekcji logo - koncepcja, wersje, zasady użycia             |
| 2026-01-21 | -     | Opracowanie sekcji UI - przyciski, formularze, karty, nawigacja        |
| 2026-01-25 | -     | Poprawka: zmiana koloru `--accent` z Off White na Light Gray (#F1F5F9)           |
| 2026-01-25 | -     | Dodanie dokumentacji systemu dwupoziomowych stanów hover dla przycisków outline |
