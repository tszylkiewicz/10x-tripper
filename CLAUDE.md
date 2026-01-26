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
5. **Feature-based Organization**: Features like `preferences/` contain their own components and hooks. Shared components live in `components/ui/`.

### Directory Structure

- `src/pages/` - Astro pages and API routes
  - `src/pages/api/` - REST API endpoints (use uppercase `GET`, `POST`, etc.)
  - All API routes must use `export const prerender = false`
- `src/lib/services/` - Business logic services (e.g., `tripPlan.service.ts`, `userPreferences.service.ts`, `aiGeneration.service.ts`)
- `src/lib/validators/` - Zod validation schemas for API input
- `src/lib/constants/` - Application constants (e.g., transport/activity options)
- `src/lib/utils/` - Utility functions
- `src/db/` - Supabase client and generated database types
  - `src/db/supabase.client.ts` - Creates Supabase SSR client
  - `src/db/database.types.ts` - Generated types from Supabase schema
- `src/types.ts` - All API DTOs and Command models (derived from database types)
- `src/components/ui/` - Shadcn/ui components
- `src/preferences/` - User preferences feature module (components + hooks)
- `src/components/trip-plans/` - Trip plan feature components
  - `create/` - Trip plan creation flow components
  - `details/` - Trip plan details/editing components
  - `shared/` - Shared components (ActivityCard, etc.)
- `src/components/dashboard/` - Dashboard components
- `src/components/landing/` - Landing page components
- `src/components/auth/` - Authentication components
- `src/middleware/index.ts` - Astro middleware (injects Supabase client, handles auth)
- `src/errors/` - Custom error classes (ValidationError, DuplicateError, etc.)
- `src/features/` - Feature flags system
- `src/layouts/` - Astro layouts

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
