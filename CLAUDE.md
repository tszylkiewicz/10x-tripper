# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tripper is an AI-powered trip planning application that converts user notes into detailed travel itineraries. Built with Astro 5 (SSR mode), React 19, TypeScript 5, Tailwind 4, and Supabase backend.

## Commands

```bash
npm run dev          # Start development server on port 3000
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run db:migrate   # Run Supabase migrations
```

## Architecture

### Directory Structure

- `src/pages/` - Astro pages and API routes
- `src/pages/api/` - REST API endpoints (use uppercase `GET`, `POST`, etc.)
- `src/lib/services/` - Business logic services (e.g., `tripPlan.service.ts`, `userPreferences.service.ts`)
- `src/lib/validators/` - Zod validation schemas
- `src/db/` - Supabase client and generated database types
- `src/types.ts` - Shared DTOs and Command models for API layer
- `src/components/ui/` - Shadcn/ui components
- `src/preferences/` - User preferences feature module (components + hooks)
- `src/components/dashboard/` - Trip plans dashboard components
- `src/middleware/index.ts` - Astro middleware (injects Supabase client)
- `src/errors/` - Custom error classes

### API Pattern

API endpoints follow a consistent pattern:

1. Validate input with Zod schemas from `src/lib/validators/`
2. Call service methods from `src/lib/services/`
3. Services accept Command objects (include `user_id`) and return DTOs
4. Use `export const prerender = false` for all API routes

### Database Access

- **Always use** `context.locals.supabase` in Astro routes - not direct imports
- Use `SupabaseClient` type from `src/db/supabase.client.ts`
- Database types are generated in `src/db/database.types.ts`
- RLS policies enforce user ownership - queries filter by `user_id`

### Type System

- `src/types.ts` contains all API DTOs derived from database types
- DTOs use `Pick<>` to explicitly expose only safe fields
- Command models include `user_id` for authorization
- `PlanDetailsDto` is the typed structure for JSONB `plan_details` field

### Frontend

- Use `.astro` for static content, React only for interactivity
- React components use `client:*` directives for hydration
- Custom hooks live in feature directories (e.g., `src/preferences/hooks/`)
- Path alias: `@/*` maps to `./src/*`

## Key Conventions

- Never use `"use client"` - this is Astro, not Next.js
- Soft-delete for trip_plans (set `deleted_at`, trigger sets `deleted_by`)
- Validate all API input with Zod before processing
- Error handling: use early returns and guard clauses
- Services throw custom errors (`ValidationError`, `DuplicateError`)

## Database Schema (Main Tables)

- `user_preferences` - User's travel preference templates
- `trip_plans` - Saved trip plans with JSONB `plan_details`
- `plan_generations` - AI generation analytics/tracking
- `plan_generation_error_logs` - Failed generation logs
