# Specyfikacja Techniczna: System Autentykacji Użytkowników (v2.0)

## Przegląd

Dokument opisuje architekturę systemu autentykacji dla aplikacji Tripper, wykorzystującego Supabase Auth w połączeniu z Astro 5 w trybie SSR. System realizuje wymagania US-001 (Rejestracja), US-002 (Logowanie) oraz US-010 (Bezpieczny dostęp) z dokumentu PRD.

**Podejście:** Backend API Proxy Pattern - zgodnie z [oficjalną dokumentacją Astro + Supabase](https://docs.astro.build/en/guides/backend/supabase/)

**Kluczowe zasady:**

- Wszystkie operacje autentykacji przechodzą przez API routes (`/api/auth/*`)
- Server-side cookie management przez `@supabase/ssr`
- Komponenty React komunikują się z API routes (nie bezpośrednio z Supabase)
- Middleware zapewnia dostęp do Supabase client na każdym request

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Nowe Strony (Astro)

#### 1.1.1 `/src/pages/auth/login.astro`

**Odpowiedzialność:**

- Renderowanie strony logowania (SSR)
- Weryfikacja stanu sesji - jeśli użytkownik jest zalogowany, przekierowanie na `/` (dashboard)
- Obsługa URL query parameters dla komunikatów (np. `?message=session-expired`, `?error=invalid-credentials`)
- Renderowanie komponentu React `LoginForm` z dyrektywą `client:load`

**Struktura:**

```astro
---
// Server-side logic
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect("/");
}

const message = Astro.url.searchParams.get("message");
const error = Astro.url.searchParams.get("error");
---

<Layout title="Logowanie" showNavigation={false}>
  <LoginForm client:load message={message} error={error} />
</Layout>
```

**Props przekazywane do LoginForm:**

- `message?: string` - komunikat informacyjny (np. "Zarejestrowano pomyślnie")
- `error?: string` - kod błędu do wyświetlenia

#### 1.1.2 `/src/pages/auth/register.astro`

**Odpowiedzialność:**

- Renderowanie strony rejestracji (SSR)
- Weryfikacja stanu sesji - jeśli użytkownik jest zalogowany, przekierowanie na `/`
- Renderowanie komponentu React `RegisterForm` z dyrektywą `client:load`

**Struktura:**

```astro
---
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (session) {
  return Astro.redirect("/");
}
---

<Layout title="Rejestracja" showNavigation={false}>
  <RegisterForm client:load />
</Layout>
```

#### 1.1.3 `/src/pages/auth/forgot-password.astro`

**Odpowiedzialność:**

- Renderowanie strony resetowania hasła
- Renderowanie komponentu React `ForgotPasswordForm` z dyrektywą `client:load`

**Struktura:**

```astro
<Layout title="Resetowanie hasła" showNavigation={false}>
  <ForgotPasswordForm client:load />
</Layout>
```

#### 1.1.4 `/src/pages/auth/reset-password.astro`

**Odpowiedzialność:**

- Renderowanie formularza ustawienia nowego hasła (po kliknięciu w link z emaila)
- Walidacja tokenu resetowania po stronie serwera
- Renderowanie komponentu React `ResetPasswordForm` z dyrektywą `client:load`

**Struktura:**

```astro
---
// Walidacja tokenu z URL
const token = Astro.url.searchParams.get("token");
const type = Astro.url.searchParams.get("type");

if (!token || type !== "recovery") {
  return Astro.redirect("/auth/login?error=invalid-reset-link");
}
---

<Layout title="Nowe hasło" showNavigation={false}>
  <ResetPasswordForm client:load />
</Layout>
```

### 1.2 Komponenty React (Client-Side)

Wszystkie komponenty autentykacji znajdują się w `/src/components/auth/` i komunikują się z backend API routes.

#### 1.2.1 `LoginForm.tsx`

**Odpowiedzialność:**

- Zarządzanie stanem formularza (email, hasło)
- Walidacja front-endowa (format email, minimalna długość hasła)
- Wywołanie API endpoint `/api/auth/signin`
- Wyświetlanie komunikatów błędów i stanów ładowania
- Przekierowanie na `/` po pomyślnym zalogowaniu (przez window.location)
- Link do `/auth/register` i `/auth/forgot-password`

**Props:**

```typescript
interface LoginFormProps {
  message?: string;
  error?: string;
}
```

**Kluczowe funkcje:**

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  // Walidacja front-endowa
  const result = loginSchema.safeParse(formData);
  if (!result.success) {
    setError(result.error.errors[0].message);
    setLoading(false);
    return;
  }

  try {
    // Wywołanie API endpoint zamiast bezpośrednio Supabase
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error.message);
      return;
    }

    // Sukces - przekierowanie (backend ustawił cookies)
    window.location.href = "/";
  } catch (error) {
    setError("Problem z połączeniem. Spróbuj ponownie");
  } finally {
    setLoading(false);
  }
};
```

**Komunikaty błędów:**

- `INVALID_CREDENTIALS` - "Nieprawidłowy email lub hasło"
- `EMAIL_NOT_CONFIRMED` - "Potwierdź swój adres email, klikając w link wysłany na skrzynkę"
- `NETWORK_ERROR` - "Problem z połączeniem. Spróbuj ponownie"
- `GENERIC_ERROR` - "Wystąpił błąd. Spróbuj ponownie później"

**Używane komponenty UI:**

- `Card`, `CardHeader`, `CardContent`, `CardFooter` (shadcn/ui)
- `Input`, `Label` (shadcn/ui)
- `Button` (shadcn/ui)
- `Alert`, `AlertDescription` (shadcn/ui)

#### 1.2.2 `RegisterForm.tsx`

**Odpowiedzialność:**

- Zarządzanie stanem formularza (email, hasło, potwierdzenie hasła)
- Walidacja front-endowa (zgodność haseł, siła hasła)
- Wywołanie API endpoint `/api/auth/signup`
- Wyświetlanie komunikatu o konieczności potwierdzenia emaila
- Link do `/auth/login`

**Kluczowe funkcje:**

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const result = registerSchema.safeParse(formData);
  if (!result.success) {
    setError(result.error.errors[0].message);
    setLoading(false);
    return;
  }

  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error.message);
      return;
    }

    // Sukces - wyświetl komunikat o emailu
    setSuccess(true);
  } catch (error) {
    setError("Problem z połączeniem. Spróbuj ponownie");
  } finally {
    setLoading(false);
  }
};
```

**Komunikaty:**

- Sukces: "Konto utworzone! Sprawdź email i kliknij w link aktywacyjny"
- `EMAIL_EXISTS` - "Ten adres email jest już zarejestrowany"
- `WEAK_PASSWORD` - "Hasło musi mieć min. 8 znaków, zawierać cyfrę i wielką literę"
- `PASSWORDS_MISMATCH` - "Hasła nie są identyczne"

#### 1.2.3 `ForgotPasswordForm.tsx`

**Odpowiedzialność:**

- Zarządzanie formularzem z polem email
- Wywołanie API endpoint `/api/auth/reset-password`
- Wyświetlanie komunikatu o wysłaniu emaila
- Link do `/auth/login`

**Kluczowe funkcje:**

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error.message);
      return;
    }

    setSuccess(true);
  } catch (error) {
    setError("Problem z połączeniem. Spróbuj ponownie");
  } finally {
    setLoading(false);
  }
};
```

#### 1.2.4 `ResetPasswordForm.tsx`

**Odpowiedzialność:**

- Zarządzanie formularzem z nowymi hasłami
- Wywołanie API endpoint `/api/auth/update-password`
- Przekierowanie na `/auth/login?message=password-reset-success` po sukcesie

**Kluczowe funkcje:**

```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: formData.newPassword,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error.message);
      return;
    }

    // Sukces - przekierowanie
    window.location.href = "/auth/login?message=password-reset-success";
  } catch (error) {
    setError("Problem z połączeniem. Spróbuj ponownie");
  } finally {
    setLoading(false);
  }
};
```

#### 1.2.5 `UserMenu.tsx` (Nowy komponent)

**Odpowiedzialność:**

- Wyświetlanie menu użytkownika w nawigacji (email, wylogowanie)
- Wywołanie API endpoint `/api/auth/signout`
- Przekierowanie na `/auth/login` po wylogowaniu

**Props:**

```typescript
interface UserMenuProps {
  userEmail: string;
}
```

**Kluczowe funkcje:**

```typescript
const handleSignOut = async () => {
  try {
    const response = await fetch("/api/auth/signout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/auth/login?message=logged-out";
    }
  } catch (error) {
    console.error("Sign out failed:", error);
  }
};
```

**Używane komponenty UI:**

- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` (shadcn/ui)
- `Button`

### 1.3 Modyfikacje Istniejących Stron

#### 1.3.1 Wszystkie chronione strony (`/`, `/preferences`, `/trip-plans/*`)

**Wymagane zmiany:**
Każda chroniona strona musi weryfikować sesję po stronie serwera i przekierowywać niezalogowanych użytkowników:

```astro
---
// Weryfikacja sesji (SSR)
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();

if (!session) {
  return Astro.redirect("/auth/login?error=session-required");
}

// Strona może teraz bezpiecznie używać session.user.id
const userId = session.user.id;
---
```

**Lista stron do modyfikacji:**

- `/src/pages/index.astro` (Dashboard)
- `/src/pages/preferences.astro`
- `/src/pages/trip-plans/new.astro`
- `/src/pages/trip-plans/[id].astro`

#### 1.3.2 `/src/components/navigation/AppNavigation.astro`

**Wymagane zmiany:**

- Dodanie warunkowego renderowania na podstawie stanu sesji
- Wyświetlanie `UserMenu` dla zalogowanych użytkowników
- Wyświetlanie przycisków "Zaloguj" / "Zarejestruj" dla niezalogowanych

**Struktura:**

```astro
---
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
const currentPath = Astro.url.pathname;
---

<nav>
  <div class="logo">Tripper</div>

  {
    session ? (
      <>
        <a href="/" class:list={[currentPath === "/" && "active"]}>
          Dashboard
        </a>
        <a href="/preferences" class:list={[currentPath === "/preferences" && "active"]}>
          Preferencje
        </a>
        <UserMenu client:load userEmail={session.user.email} />
      </>
    ) : (
      <>
        <a href="/auth/login">Zaloguj</a>
        <a href="/auth/register">Zarejestruj</a>
      </>
    )
  }
</nav>
```

### 1.4 Walidacja i Komunikaty Błędów

**Wspólne reguły walidacji front-endowej:**

1. **Email:**
   - Format: regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
   - Komunikat: "Nieprawidłowy format adresu email"

2. **Hasło (logowanie):**
   - Min. długość: 6 znaków
   - Komunikat: "Hasło musi mieć minimum 6 znaków"

3. **Hasło (rejestracja/reset):**
   - Min. długość: 8 znaków
   - Wymaga: co najmniej 1 cyfra, 1 wielka litera
   - Komunikat: "Hasło musi mieć min. 8 znaków, zawierać cyfrę i wielką literę"

4. **Potwierdzenie hasła:**
   - Musi być identyczne z hasłem
   - Komunikat: "Hasła nie są identyczne"

### 1.5 Scenariusze Użytkownika

#### Scenariusz 1: Rejestracja nowego użytkownika

1. Użytkownik wchodzi na `/auth/register`
2. Wypełnia formularz (email, hasło, potwierdzenie hasła)
3. Kliknięcie "Zarejestruj się" wywołuje `POST /api/auth/signup`
4. Backend wywołuje `supabase.auth.signUp()` i wysyła email z linkiem
5. Wyświetlany komunikat: "Sprawdź email i kliknij w link aktywacyjny"
6. Użytkownik klika w link w emailu → przekierowanie na `/auth/login?message=email-confirmed`
7. Użytkownik loguje się

#### Scenariusz 2: Logowanie

1. Użytkownik wchodzi na `/auth/login`
2. Wypełnia formularz (email, hasło)
3. Kliknięcie "Zaloguj się" wywołuje `POST /api/auth/signin`
4. Backend wywołuje `supabase.auth.signInWithPassword()` i ustawia cookies
5. Po sukcesie: przekierowanie na `/` (dashboard)
6. Po błędzie: wyświetlenie komunikatu błędu

#### Scenariusz 3: Odzyskiwanie hasła

1. Użytkownik wchodzi na `/auth/forgot-password`
2. Podaje email
3. Kliknięcie "Wyślij link" wywołuje `POST /api/auth/reset-password`
4. Backend wywołuje `supabase.auth.resetPasswordForEmail()`
5. Wyświetlany komunikat: "Link wysłany na email"
6. Użytkownik klika w link w emailu → przekierowanie na `/auth/reset-password?token=...&type=recovery`
7. Użytkownik ustawia nowe hasło i wywołuje `POST /api/auth/update-password`
8. Po sukcesie: przekierowanie na `/auth/login?message=password-reset-success`

#### Scenariusz 4: Wylogowanie

1. Zalogowany użytkownik klika "Wyloguj się" w `UserMenu`
2. Wywołanie `POST /api/auth/signout`
3. Backend wywołuje `supabase.auth.signOut()` i usuwa cookies
4. Przekierowanie na `/auth/login?message=logged-out`

#### Scenariusz 5: Próba dostępu do chronionej strony bez sesji

1. Niezalogowany użytkownik próbuje wejść na `/` lub `/preferences`
2. SSR weryfikuje sesję (brak sesji)
3. Przekierowanie na `/auth/login?error=session-required`
4. Wyświetlany komunikat: "Musisz być zalogowany, aby uzyskać dostęp"

---

## 2. LOGIKA BACKENDOWA

### 2.1 Middleware

#### `/src/middleware/index.ts`

**Zadania:**

1. Utworzenie klienta Supabase dla każdego żądania używając `createSupabaseServerInstance`
2. Weryfikacja autentykacji użytkownika przez `auth.getUser()`
3. Ustawienie `context.locals.user` dla zalogowanych użytkowników
4. Przekierowanie niezalogowanych użytkowników na stronę logowania (poza PUBLIC_PATHS)

**WAŻNE:** Używamy TYLKO `getAll` i `setAll` dla zarządzania cookies (zgodnie z najlepszymi praktykami @supabase/ssr).

**Implementacja:**

```typescript
import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Ścieżki publiczne - strony auth i API endpoints
const PUBLIC_PATHS = [
  // Strony Astro
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  // API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Pomiń weryfikację auth dla ścieżek publicznych
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // Utwórz klienta Supabase z obsługą cookies
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // WAŻNE: Zawsze pobieraj użytkownika przed innymi operacjami
  // Używamy getUser() zamiast getSession() dla bezpieczeństwa
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Ustaw dane użytkownika w locals
    locals.user = {
      email: user.email!,
      id: user.id,
    };
  } else if (!PUBLIC_PATHS.includes(url.pathname)) {
    // Przekieruj na login dla chronionych tras
    return redirect("/auth/login");
  }

  return next();
});
```

**Modyfikacja typów:**
`/src/env.d.ts`:

```typescript
declare global {
  namespace App {
    interface Locals {
      user?: {
        email: string;
        id: string;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}
```

**Nowa funkcja w `/src/db/supabase.client.ts`:**

```typescript
import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { Database } from "./database.types.ts";

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};
```

### 2.2 API Endpoints

Wszystkie endpointy autentykacji znajdują się w `/src/pages/api/auth/`

#### 2.2.1 `POST /api/auth/signup` - Rejestracja

**Plik:** `/src/pages/api/auth/signup.ts`

**Odpowiedzialność:**

- Walidacja danych wejściowych (email, hasło)
- Wywołanie `supabase.auth.signUp()`
- Obsługa błędów (duplikat email, słabe hasło)
- Zwrócenie odpowiedzi sukcesu lub błędu

**Implementacja:**

```typescript
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate with Zod
    const validatedData = signupSchema.parse(body);

    // 3. Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // 4. Call Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        emailRedirectTo: `${new URL(request.url).origin}/auth/login?message=email-confirmed`,
      },
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      const errorResponse: ApiErrorResponse = {
        error: {
          code: mapAuthErrorCode(error.message),
          message: mapAuthErrorMessage(error.message),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Success response
    const successResponse: ApiSuccessResponse<{ user_id: string }> = {
      data: { user_id: data.user?.id || "" },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors[0].message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generic error
    console.error("Signup error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas rejestracji",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function mapAuthErrorCode(supabaseError: string): string {
  if (supabaseError.includes("User already registered")) return "EMAIL_EXISTS";
  if (supabaseError.includes("Password")) return "WEAK_PASSWORD";
  return "AUTH_ERROR";
}

function mapAuthErrorMessage(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "Ten adres email jest już zarejestrowany",
    "Password should be at least 6 characters": "Hasło musi mieć minimum 6 znaków",
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (supabaseError.includes(key)) return value;
  }

  return "Wystąpił błąd podczas rejestracji";
}
```

#### 2.2.2 `POST /api/auth/signin` - Logowanie

**Plik:** `/src/pages/api/auth/signin.ts`

**Odpowiedzialność:**

- Walidacja danych wejściowych (email, hasło)
- Wywołanie `supabase.auth.signInWithPassword()`
- Ustawienie cookies z tokenami (automatycznie przez `@supabase/ssr`)
- Zwrócenie odpowiedzi sukcesu lub błędu

**Implementacja:**

```typescript
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

const signinSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Parse and validate
    const body = await request.json();
    const validatedData = signinSchema.parse(body);

    // 2. Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // 3. Call Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: mapAuthErrorCode(error.message),
          message: mapAuthErrorMessage(error.message),
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Cookies are automatically set by @supabase/ssr

    // 5. Success response
    const successResponse: ApiSuccessResponse<{ user_id: string; email: string }> = {
      data: {
        user_id: data.user.id,
        email: data.user.email || "",
      },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors[0].message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Signin error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas logowania",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function mapAuthErrorCode(supabaseError: string): string {
  if (supabaseError.includes("Invalid login credentials")) return "INVALID_CREDENTIALS";
  if (supabaseError.includes("Email not confirmed")) return "EMAIL_NOT_CONFIRMED";
  return "AUTH_ERROR";
}

function mapAuthErrorMessage(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "Nieprawidłowy email lub hasło",
    "Email not confirmed": "Potwierdź swój adres email, klikając w link wysłany na skrzynkę",
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (supabaseError.includes(key)) return value;
  }

  return "Wystąpił błąd podczas logowania";
}
```

#### 2.2.3 `POST /api/auth/signout` - Wylogowanie

**Plik:** `/src/pages/api/auth/signout.ts`

**Implementacja:**

```typescript
import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Call Supabase signOut (automatically removes cookies)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Signout error:", error);
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "SIGNOUT_ERROR",
          message: "Wystąpił błąd podczas wylogowywania",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const successResponse: ApiSuccessResponse<{ success: boolean }> = {
      data: { success: true },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Signout error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas wylogowywania",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

#### 2.2.4 `POST /api/auth/reset-password` - Żądanie resetu hasła

**Plik:** `/src/pages/api/auth/reset-password.ts`

**Implementacja:**

```typescript
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

const resetPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    if (error) {
      console.error("Reset password error:", error);
      // Note: Supabase doesn't reveal if email exists for security
      // We still return success to avoid email enumeration
    }

    const successResponse: ApiSuccessResponse<{ success: boolean }> = {
      data: { success: true },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors[0].message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Reset password error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas wysyłania linku resetującego",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

#### 2.2.5 `POST /api/auth/update-password` - Aktualizacja hasła

**Plik:** `/src/pages/api/auth/update-password.ts`

**Implementacja:**

```typescript
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = updatePasswordSchema.parse(body);

    // Create Supabase client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Update password (user must be authenticated via recovery token)
    const { error } = await supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (error) {
      console.error("Update password error:", error);
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "UPDATE_PASSWORD_ERROR",
          message: "Wystąpił błąd podczas aktualizacji hasła",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const successResponse: ApiSuccessResponse<{ success: boolean }> = {
      data: { success: true },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors[0].message,
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Update password error:", error);
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas aktualizacji hasła",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### 2.3 Modyfikacja Istniejących API Endpoints

**Wszystkie istniejące endpointy wymagają modyfikacji:**

- Usunięcie hardcoded `userId` placeholder
- Pobranie `userId` z sesji: `context.locals.supabase.auth.getSession()`
- Zwrócenie błędu 401 jeśli sesja nie istnieje

**Przykład modyfikacji (`/src/pages/api/user/preferences.ts`):**

**PRZED:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  // TODO: Get user_id from authenticated session
  const userId = "20eaee6f-d503-41d9-8ce9-4219f2c06533";

  const preferencesService = new UserPreferencesService(locals.supabase);
  const preferences = await preferencesService.getPreferences(userId);
  // ...
};
```

**PO:**

```typescript
import { requireAuth } from "@/lib/utils/auth.utils";

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get userId from session
    const userId = await requireAuth(locals.supabase);

    const preferencesService = new UserPreferencesService(locals.supabase);
    const preferences = await preferencesService.getPreferences(userId);
    // ... rest of the code
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return createUnauthorizedResponse();
    }
    // ... other error handling
  }
};
```

**Lista endpointów do modyfikacji:**

- `GET /api/user/preferences`
- `POST /api/user/preferences`
- `GET /api/user/preferences/[id]`
- `PUT /api/user/preferences/[id]`
- `DELETE /api/user/preferences/[id]`
- `GET /api/trip-plans`
- `POST /api/trip-plans`
- `GET /api/trip-plans/[id]`
- `PATCH /api/trip-plans/[id]`
- `DELETE /api/trip-plans/[id]`
- `POST /api/trip-plans/generate`

### 2.4 Walidatory Zod

Walidatory są używane zarówno w komponentach React (client-side) jak i w API routes (server-side).

**Plik:** `/src/lib/validators/auth.validator.ts`

```typescript
import { z } from "zod";

const emailSchema = z.string().email("Nieprawidłowy format adresu email");

const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
  .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę");

// Login (używany tylko client-side dla walidacji przed wysłaniem)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Register (używany zarówno client-side jak i server-side)
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Register with confirmation (tylko client-side)
export const registerWithConfirmSchema = registerSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

// Forgot Password
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset Password
export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

// Reset Password with confirmation (tylko client-side)
export const resetPasswordWithConfirmSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });
```

### 2.5 Obsługa Błędów i Helpery

#### 2.5.1 Nowa klasa błędów: `/src/errors/auth.error.ts`

```typescript
/**
 * AuthenticationError
 *
 * Custom error class for authentication-related failures.
 * Used when session is missing, expired, or invalid.
 */
export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}
```

#### 2.5.2 Helper functions: `/src/lib/utils/auth.utils.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { ApiErrorResponse } from "@/types";
import { AuthenticationError } from "@/errors/auth.error";

/**
 * Weryfikuje czy sesja istnieje i zwraca userId lub rzuca wyjątek
 */
export async function requireAuth(supabase: SupabaseClient<Database>): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new AuthenticationError();
  }

  return session.user.id;
}

/**
 * Tworzy standardową odpowiedź 401
 */
export function createUnauthorizedResponse(): Response {
  const errorResponse: ApiErrorResponse = {
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

---

## 3. SYSTEM AUTENTYKACJI

### 3.1 Integracja Supabase Auth z Astro

#### 3.1.1 Architektura Sesji

**Flow sesji:**

```
1. LOGOWANIE
   User fills form → POST /api/auth/signin → supabase.auth.signInWithPassword()
                                          ↓
                                   Returns tokens
                                          ↓
                           @supabase/ssr sets httpOnly cookies
                                          ↓
                                   Frontend redirects to /

2. WERYFIKACJA SESJI (każdy request)
   Request → Middleware creates Supabase client from cookies
                                          ↓
                          supabase.auth.getSession()
                                          ↓
                      Returns session (or null)
                                          ↓
                    Available in Astro.locals.supabase

3. ODŚWIEŻANIE TOKENÓW
   Request → Middleware → getSession() checks token expiry
                                          ↓
                        Auto-refreshes if needed
                                          ↓
                      Updates cookies automatically

4. WYLOGOWANIE
   User clicks logout → POST /api/auth/signout → supabase.auth.signOut()
                                               ↓
                                        Removes cookies
                                               ↓
                                    Frontend redirects to /auth/login
```

#### 3.1.2 Konfiguracja Supabase

**Zmienne środowiskowe (`.env`):**

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

**Konfiguracja Supabase Auth Dashboard:**

1. **Site URL:** `http://localhost:3000` (dev), `https://tripper.app` (prod)
2. **Redirect URLs:**
   - `http://localhost:3000/auth/login?message=email-confirmed`
   - `http://localhost:3000/auth/reset-password`
   - `https://tripper.app/auth/login?message=email-confirmed`
   - `https://tripper.app/auth/reset-password`
3. **Email Templates:**
   - **Confirm signup:** Link do `/auth/login?message=email-confirmed`
   - **Reset password:** Link do `/auth/reset-password`
4. **Email Auth:** Włączone
5. **Email Confirmation:** Wymagane (double opt-in)

#### 3.1.3 Row Level Security (RLS)

**Aktualna sytuacja:**
Baza danych już posiada policies RLS oparte na `auth.uid()`:

```sql
-- Przykład z user_preferences
create policy "user_preferences_select_own" on user_preferences
  for select using (user_id = auth.uid());
```

**Jak to działa:**

1. Middleware tworzy klienta Supabase z cookies zawierającymi tokeny
2. `@supabase/ssr` automatycznie ustawia `auth.uid()` na podstawie tokenów z cookies
3. Policies RLS filtrują zapytania SQL po `user_id = auth.uid()`
4. Użytkownik widzi tylko swoje dane - bez dodatkowej logiki w aplikacji

**Brak zmian w policies:**
RLS policies są już prawidłowo skonfigurowane i będą działać automatycznie po wdrożeniu autentykacji.

### 3.2 Bezpieczeństwo

#### 3.2.1 Ochrona przed atakami

**CSRF Protection:**

- Cookies używają `SameSite=Lax` (ustawiane automatycznie przez `@supabase/ssr`)
- Tokeny są automatycznie walidowane przy każdym żądaniu

**XSS Protection:**

- Wszystkie komponenty React używają JSX (automatyczne escapowanie)
- Brak `dangerouslySetInnerHTML`
- httpOnly cookies (niedostępne dla JavaScript)

**Rate Limiting:**

- Supabase Auth ma wbudowane rate limiting na endpointy `/auth/*`
- Domyślnie: 30 requests/hour na IP dla `/auth/v1/signup`
- Dodatkowo można dodać własny rate limiting w API routes

**SQL Injection:**

- Supabase SDK używa prepared statements
- RLS policies działają na poziomie bazy danych
- Walidacja Zod przed wszystkimi operacjami

#### 3.2.2 Sesje i Tokeny

**Zarządzanie przez @supabase/ssr:**

- Access token i refresh token przechowywane w httpOnly cookies
- Automatyczne odświeżanie tokenów przed wygaśnięciem
- Bezpieczne przekazywanie tokenów między requests

**Cookie settings (automatyczne):**

```typescript
{
  httpOnly: true,      // Niedostępne dla JavaScript
  secure: true,        // Tylko HTTPS (production)
  sameSite: 'lax',     // CSRF protection
  path: '/',
}
```

### 3.3 Email Templates

#### 3.3.1 Confirmation Email (Potwierdzenie rejestracji)

**Temat:** Potwierdź swoje konto w Tripper

**Treść:**

```
Witaj!

Dziękujemy za rejestrację w Tripper. Kliknij w poniższy link, aby aktywować swoje konto:

{{ .ConfirmationURL }}

Jeśli nie rejestrowałeś się w Tripper, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół Tripper
```

**Link:** `{{ .ConfirmationURL }}` → `/auth/login?message=email-confirmed`

#### 3.3.2 Password Recovery Email (Resetowanie hasła)

**Temat:** Zresetuj hasło w Tripper

**Treść:**

```
Witaj!

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Tripper.

Kliknij w poniższy link, aby ustawić nowe hasło:

{{ .ConfirmationURL }}

Link wygasa po 24 godzinach.

Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół Tripper
```

**Link:** `{{ .ConfirmationURL }}` → `/auth/reset-password?token=...&type=recovery`

---

## 4. MIGRACJE BAZY DANYCH

### 4.1 Wymagane Zmiany

**Brak nowych migracji:**
Schemat bazy danych już posiada:

- Referencje do `auth.users(id)` w kolumnach `user_id`
- RLS policies oparte na `auth.uid()`
- Indeksy na `user_id`

**Status:** ✅ Baza danych jest gotowa na autentykację - brak wymaganych zmian.

---

## 5. ZALEŻNOŚCI I PAKIETY

### 5.1 Nowe Zależności NPM

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1"
  }
}
```

**Instalacja:**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 5.2 Shadcn/ui Components

Komponenty do dodania:

```bash
npx shadcn-ui@latest add dropdown-menu
```

**Status istniejących komponentów:**

- ✅ `Card`, `Input`, `Label`, `Button`, `Alert`
- ❌ `DropdownMenu` (do dodania)

---

## 6. STRUKTURA PLIKÓW

### 6.1 Nowe Pliki

```
src/
├── pages/
│   ├── auth/
│   │   ├── login.astro                    # Strona logowania
│   │   ├── register.astro                 # Strona rejestracji
│   │   ├── forgot-password.astro          # Strona resetowania hasła
│   │   └── reset-password.astro           # Strona nowego hasła
│   │
│   └── api/
│       └── auth/
│           ├── signup.ts                  # POST - rejestracja
│           ├── signin.ts                  # POST - logowanie
│           ├── signout.ts                 # POST - wylogowanie
│           ├── reset-password.ts          # POST - żądanie resetu
│           └── update-password.ts         # POST - aktualizacja hasła
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                  # Formularz logowania
│   │   ├── RegisterForm.tsx               # Formularz rejestracji
│   │   ├── ForgotPasswordForm.tsx         # Formularz resetu hasła
│   │   ├── ResetPasswordForm.tsx          # Formularz nowego hasła
│   │   └── UserMenu.tsx                   # Menu użytkownika
│   │
│   └── ui/
│       └── dropdown-menu.tsx              # Nowy komponent
│
├── lib/
│   ├── validators/
│   │   └── auth.validator.ts              # Walidatory Zod
│   │
│   └── utils/
│       └── auth.utils.ts                  # Helpery
│
└── errors/
    └── auth.error.ts                      # AuthenticationError
```

### 6.2 Pliki do Modyfikacji

```
src/
├── middleware/
│   └── index.ts                           # createServerClient z @supabase/ssr
│
├── env.d.ts                               # Aktualizacja Locals interface
│
├── pages/
│   ├── index.astro                        # Weryfikacja sesji
│   ├── preferences.astro                  # Weryfikacja sesji
│   └── trip-plans/
│       ├── new.astro                      # Weryfikacja sesji
│       └── [id].astro                     # Weryfikacja sesji
│
├── pages/api/
│   ├── user/preferences.ts                # Użycie requireAuth()
│   ├── user/preferences/[id].ts           # Użycie requireAuth()
│   ├── trip-plans/index.ts                # Użycie requireAuth()
│   ├── trip-plans/[id].ts                 # Użycie requireAuth()
│   └── trip-plans/generate.ts             # Użycie requireAuth()
│
└── components/navigation/
    └── AppNavigation.astro                # UserMenu i conditional rendering
```

---

## 7. WDROŻENIE

### 7.1 Kolejność Implementacji

**Faza 1: Infrastruktura Backend**

1. ✅ Instalacja pakietów (`npm install @supabase/ssr @supabase/supabase-js`)
2. ✅ Modyfikacja middleware (createServerClient, cookies)
3. ✅ Aktualizacja `env.d.ts`
4. ✅ Dodanie zmiennych środowiskowych (`.env`)
5. ✅ Utworzenie walidatorów (`auth.validator.ts`)
6. ✅ Utworzenie error class (`auth.error.ts`)
7. ✅ Utworzenie utils (`auth.utils.ts`)

**Faza 2: API Endpoints**

1. ✅ Utworzenie `/api/auth/signup.ts`
2. ✅ Utworzenie `/api/auth/signin.ts`
3. ✅ Utworzenie `/api/auth/signout.ts`
4. ✅ Utworzenie `/api/auth/reset-password.ts`
5. ✅ Utworzenie `/api/auth/update-password.ts`
6. ✅ Testowanie endpoints z Postman/curl

**Faza 3: Komponenty Frontend**

1. ✅ Dodanie `DropdownMenu` (shadcn/ui)
2. ✅ Utworzenie `UserMenu.tsx`
3. ✅ Utworzenie `LoginForm.tsx`
4. ✅ Utworzenie `RegisterForm.tsx`
5. ✅ Utworzenie `ForgotPasswordForm.tsx`
6. ✅ Utworzenie `ResetPasswordForm.tsx`

**Faza 4: Strony Auth**

1. ✅ Utworzenie `auth/login.astro`
2. ✅ Utworzenie `auth/register.astro`
3. ✅ Utworzenie `auth/forgot-password.astro`
4. ✅ Utworzenie `auth/reset-password.astro`

**Faza 5: Ochrona Stron i API**

1. ✅ Modyfikacja `AppNavigation.astro`
2. ✅ Dodanie weryfikacji sesji do `index.astro`
3. ✅ Dodanie weryfikacji sesji do `preferences.astro`
4. ✅ Dodanie weryfikacji sesji do `trip-plans/*.astro`
5. ✅ Modyfikacja wszystkich API endpoints (requireAuth)

**Faza 6: Konfiguracja Supabase**

1. ✅ Konfiguracja Site URL i Redirect URLs
2. ✅ Dostosowanie email templates
3. ✅ Włączenie email confirmation

**Faza 7: Testy**

1. ✅ Testy manualne wszystkich scenariuszy
2. ✅ Weryfikacja RLS policies
3. ✅ Testowanie na mobile/desktop

### 7.2 Checklist Weryfikacji

**Rejestracja (US-001):**

- [ ] Formularz przyjmuje email i hasło
- [ ] Walidacja działa (email, siła hasła)
- [ ] Email z linkiem aktywacyjnym zostaje wysłany
- [ ] Komunikat o potwierdzeniu wyświetla się
- [ ] Błędne dane zwracają komunikat
- [ ] Duplikat email zwraca odpowiedni komunikat

**Logowanie (US-002):**

- [ ] Formularz przyjmuje email i hasło
- [ ] Po sukcesie przekierowanie na `/`
- [ ] Cookies są ustawione
- [ ] Niepoprawne dane wyświetlają błąd
- [ ] Niepotwierdzony email wyświetla komunikat

**Bezpieczny dostęp (US-010):**

- [ ] Próba dostępu bez sesji przekierowuje
- [ ] API zwraca 401 bez sesji
- [ ] RLS policies filtrują dane
- [ ] Zalogowany widzi tylko swoje dane

**Resetowanie hasła:**

- [ ] Email zostaje wysłany
- [ ] Link przekierowuje na właściwą stronę
- [ ] Nowe hasło zostaje zapisane
- [ ] Przekierowanie po sukcesie działa

**Sesje:**

- [ ] Tokeny w cookies
- [ ] Automatyczne odświeżanie
- [ ] Wylogowanie usuwa cookies

---

## 8. PODSUMOWANIE

### 8.1 Kluczowe Komponenty

1. **Middleware** - tworzy Supabase client z cookies, odświeża sesję
2. **API Routes** - obsługują wszystkie operacje auth (signup, signin, signout, reset)
3. **React Forms** - komunikują się z API routes, nie bezpośrednio z Supabase
4. **Protected Pages** - weryfikują sesję w SSR, przekierowują jeśli brak
5. **RLS Policies** - automatycznie filtrują dane po `user_id`

### 8.2 Zgodność z Wymaganiami PRD

**US-001 (Rejestracja):** ✅
**US-002 (Logowanie):** ✅
**US-010 (Bezpieczny dostęp):** ✅

### 8.3 Następne Kroki

1. Implementacja zgodnie z fazami w sekcji 7.1
2. Konfiguracja Supabase Dashboard
3. Testy każdej fazy
4. Deployment na staging
5. Testy end-to-end
6. Production release
