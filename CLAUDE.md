# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tripper is an AI-powered trip planning application that converts user notes into detailed travel itineraries. Built with Astro 5 (SSR mode), React 19, TypeScript 5, Tailwind 4, and Supabase backend.

## Commands

```bash
npm run dev          # Start development server on port 3000
npm run dev:e2e      # Start dev server in test mode
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run db:migrate   # Run Supabase migrations
npm test             # Run unit tests with Vitest
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests with Playwright
```

## Architecture

### Core Architecture Principles

1. **Astro SSR Mode**: The app uses `output: "server"` (not static/hybrid). All pages are server-rendered.
2. **Middleware-based Auth**: Authentication is handled in `src/middleware/index.ts`, which injects Supabase client into `context.locals.supabase`.
3. **Service Layer Pattern**: Business logic lives in `src/lib/services/`, API routes are thin wrappers that validate input and call services.
4. **Command/DTO Pattern**: API requests use Command objects (include `user_id`), services return DTOs. All types in `src/types.ts` are derived from database schema.
5. **Hybrid Feature-based Organization**: Domain features (preferences, trip-plans, auth, dashboard, landing) live in `src/features/` with co-located components, hooks, and types. Shared UI primitives live in `src/components/ui/`. Feature flags system is in `src/feature-flags/`.

### Directory Structure

```
src/
├── features/                    (Domain features with co-located code)
│   ├── preferences/             (User preferences feature)
│   │   ├── components/          (PreferencesView, PreferenceCard, etc.)
│   │   ├── hooks/               (usePreferences, usePreferenceForm, etc.)
│   │   └── types.ts             (Feature-specific types)
│   ├── trip-plans/              (Trip planning feature)
│   │   ├── create/              (Trip plan creation flow)
│   │   │   ├── hooks/           (useTripPlanGeneration, usePlanEditor, etc.)
│   │   │   └── *.tsx            (CreateTripPlanContent, TripPlanForm, etc.)
│   │   ├── details/             (Trip plan details/editing)
│   │   │   └── *.tsx            (TripPlanDetailsView, TripPlanHeader, etc.)
│   │   └── shared/              (Shared trip-plan components)
│   │       └── *.tsx            (ActivityCard, DayCard, etc.)
│   ├── auth/                    (Authentication forms)
│   │   └── *.tsx                (LoginForm, RegisterForm, etc.)
│   ├── dashboard/               (Dashboard feature)
│   │   └── *.tsx                (DashboardContent, PlansList, PlanCard, etc.)
│   └── landing/                 (Landing page sections)
│       └── *.astro              (HeroSection, BenefitsSection, etc.)
├── components/                  (Shared components only)
│   ├── ui/                      (Shadcn/ui primitives - Button, Input, etc.)
│   ├── navigation/              (Global navigation - NavbarContent, etc.)
│   └── hooks/                   (Shared hooks)
├── feature-flags/               (Feature flags system)
│   ├── guards/                  (apiGuard, pageGuard)
│   ├── react/                   (useFeatureFlag hook)
│   └── *.ts                     (config, featureFlags, types)
├── pages/                       (Astro pages and API routes)
│   └── api/                     (REST API endpoints - use uppercase GET, POST, etc.)
├── lib/                         (Business logic and utilities)
│   ├── services/                (Business logic - tripPlan.service.ts, etc.)
│   ├── validators/              (Zod validation schemas)
│   ├── constants/               (Application constants)
│   └── utils/                   (Utility functions)
├── db/                          (Supabase client and types)
│   ├── supabase.client.ts       (Creates Supabase SSR client)
│   └── database.types.ts        (Generated types from Supabase schema)
├── layouts/                     (Astro layouts)
├── middleware/                  (Astro middleware - auth, etc.)
├── errors/                      (Custom error classes)
└── types.ts                     (API DTOs and Command models)
```

**Key principles:**

- **Domain features** (`src/features/*`): Co-locate components, hooks, and types for specific features
- **Shared components** (`src/components/*`): UI primitives and global navigation
- **Feature flags** (`src/feature-flags/`): Feature toggle system (formerly `src/features/`)

### Import Path Conventions

Use TypeScript path aliases for clean imports:

**Feature-specific aliases:**

```typescript
// Preferences feature
import { PreferencesView } from "@preferences/components/PreferencesView";
import { usePreferences } from "@preferences/hooks/usePreferences";

// Trip plans feature
import { CreateTripPlanContent } from "@trip-plans/create";
import { TripPlanDetailsView } from "@trip-plans/details/TripPlanDetailsView";
import { ActivityCard } from "@trip-plans/shared/ActivityCard";

// Auth feature
import { LoginForm } from "@auth/LoginForm";

// Dashboard feature
import { DashboardContent } from "@dashboard/DashboardContent";

// Landing feature
import LandingPage from "@landing/LandingPage.astro";
```

**Shared resource aliases:**

```typescript
// Shared components
import { Button } from "@components/ui/button";
import { NavbarContent } from "@components/navigation/NavbarContent";

// Feature flags
import { useFeatureFlag } from "@feature-flags";
import { guardFeature } from "@feature-flags";

// Libraries and utilities
import { TripPlanService } from "@lib/services/tripPlan.service";
import { cn } from "@lib/utils";

// Layouts and pages
import Layout from "@layouts/Layout.astro";
```

**When to use relative imports:**

- Within the same feature directory (e.g., `./hooks/useTripPlanGeneration` from a component in the same feature)
- For sibling files in the same directory
- In Astro pages importing from parent directories (e.g., `../../features/dashboard/DashboardContent`)

### API Pattern (Critical)

All API endpoints follow this pattern:

1. **Parse request body** (for POST/PUT)

   ```typescript
   let body: unknown;
   try {
     body = await request.json();
   } catch {
     return new Response(JSON.stringify({ error: { code: "INVALID_JSON", message: "..." } }), { status: 400 });
   }
   ```

2. **Validate with Zod** from `src/lib/validators/`

   ```typescript
   import { someSchema } from "@/lib/validators/something.validator.ts";
   const validatedData = someSchema.parse(body);
   ```

3. **Verify authentication** using `requireAuth()` from `@/lib/auth.utils.ts`

   ```typescript
   const userId = await requireAuth(locals.supabase);
   ```

4. **Build Command object** (includes `user_id`)

   ```typescript
   const command: SomeCommand = { ...validatedData, user_id: userId };
   ```

5. **Call service method**

   ```typescript
   const service = new SomeService(locals.supabase);
   const result = await service.someMethod(command);
   ```

6. **Return typed response** (ApiSuccessResponse<T> or ApiErrorResponse)

   ```typescript
   const successResponse: ApiSuccessResponse<ResultDto> = { data: result };
   return new Response(JSON.stringify(successResponse), { status: 200 });
   ```

7. **Handle errors** - Catch ValidationError, AuthenticationError, database errors

**Example**: See `src/pages/api/trip-plans/index.ts` for complete pattern.

### Database Access (Critical)

- **ALWAYS use** `context.locals.supabase` in Astro routes - NEVER import `supabaseClient` directly
- The middleware injects Supabase SSR client with cookie support
- Use `SupabaseClient<Database>` type from `src/db/supabase.client.ts`, NOT from `@supabase/supabase-js`
- RLS policies enforce user ownership - services filter by `user_id`
- Soft-delete pattern: Set `deleted_at` timestamp (trigger sets `deleted_by`)

**Creating Supabase client in services:**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types.ts";

export class MyService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async someMethod(userId: string) {
    const { data, error } = await this.supabase
      .from("table_name")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);
  }
}
```

### Type System

- `src/types.ts` contains ALL API DTOs and Command models
- DTOs use `Pick<Tables<"table_name">, "field1" | "field2">` to explicitly expose only safe fields
- Command models extend DTOs with `user_id` for authorization
- `PlanDetailsDto` is the typed structure for JSONB `plan_details` field in trip_plans table
- All types are derived from `src/db/database.types.ts` (generated from Supabase schema)

**Key type patterns:**

```typescript
// DTO - what API returns
export type TripPlanDto = Pick<Tables<"trip_plans">, "id" | "destination" | "start_date" | ...>;

// Command - what service accepts (includes user_id)
export interface AcceptPlanCommand extends AcceptTripPlanDto {
  user_id: string;
}

// JSONB structure
export interface PlanDetailsDto {
  days: DayDto[];
  notes?: string;
  total_estimated_cost?: number;
}
```

### Frontend

- **Never use `"use client"`** - this is Astro, not Next.js
- Use `.astro` for static content/layouts, React only for interactivity
- React components use `client:*` directives for hydration:
  - `client:load` - Load component JS immediately
  - `client:visible` - Load when component enters viewport
  - `client:idle` - Load when browser is idle
  - `client:only="react"` - Only render on client (SSR skip)
- Custom hooks live in feature directories (e.g., `src/preferences/hooks/`)
- Path alias: `@/*` maps to `./src/*`
- Styling: Use Tailwind 4 utility classes, leverage responsive variants (`sm:`, `md:`, etc.)

### Error Handling

1. **Custom error classes** in `src/errors/`:
   - `ValidationError` - Business/format validation failures (has optional `field` property)
   - `DuplicateError` - Unique constraint violations
   - `AuthenticationError` - Auth failures

2. **Service layer** throws custom errors:

   ```typescript
   if (invalid) {
     throw new ValidationError("Message", "field_name");
   }
   ```

3. **API routes** catch and convert to error responses:

   ```typescript
   catch (error) {
     if (error instanceof ValidationError) {
       return new Response(JSON.stringify({
         error: { code: "VALIDATION_ERROR", message: error.message, details: { [error.field]: error.message } }
       }), { status: 400 });
     }
   }
   ```

4. **Early returns and guard clauses** - Handle errors/edge cases at function start, happy path last

## Key Conventions

### General

- Use feedback from linters to improve code when making changes
- Use early returns for error conditions to avoid deeply nested if statements
- Implement proper error logging with `logger` from `@/lib/utils/logger.ts`
- Handle authentication errors by checking `error.name === "AuthenticationError"`

### Astro-specific

- Never use `"use client"` - this is Astro, not Next.js
- All API routes must use `export const prerender = false`
- Use uppercase HTTP method names: `export const GET: APIRoute`, `export const POST: APIRoute`
- Extract business logic into services in `src/lib/services/`
- Use `context.locals.supabase` for database access (injected by middleware)

### Database

- Soft-delete for trip_plans: Set `deleted_at`, trigger sets `deleted_by`
- Always exclude soft-deleted records: `.is("deleted_at", null)`
- RLS policies enforce user ownership - queries filter by `user_id`

### Validation

- Validate all API input with Zod before processing
- Zod schemas live in `src/lib/validators/`
- Services may throw ValidationError for business rules not covered by Zod

### AI Generation

- AI generation uses OpenRouter API via `aiGeneration.service.ts`
- Generation results are tracked in `plan_generations` table
- Errors logged in `plan_generation_error_logs` table
- Plan source is `"ai"` when unmodified, `"ai-edited"` when modified before/after acceptance

## Database Schema (Main Tables)

- `user_preferences` - User's travel preference templates (name, budget, transport, activities)
- `trip_plans` - Saved trip plans with JSONB `plan_details` field
  - Soft-delete: `deleted_at`, `deleted_by`
  - Source: `"ai"` or `"ai-edited"`
- `plan_generations` - AI generation analytics/tracking
- `plan_generation_error_logs` - Failed generation logs

## Testing

- Unit tests: Vitest (run with `npm test`)
- E2E tests: Playwright (run with `npm run test:e2e`)
- Test setup in `src/test/setup.ts`
- Test utilities in `src/test/utils/test-utils.tsx`

## Deployment

- Platform: Cloudflare Pages
- Adapter: `@astrojs/cloudflare` (configured in `astro.config.mjs`)
- Build command: `npm run build`
- Output directory: `dist`
- Required environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`
  - `PUBLIC_APP_URL`
  - `PUBLIC_ENV_NAME`
