/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

// Cloudflare runtime environment variables
// These are available at runtime via context.locals.runtime.env
// Set these in Cloudflare Pages dashboard: Settings → Environment variables
interface CloudflareEnv {
  // Server-side secrets (never exposed to client)
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL: string;

  // Public variables (can be accessed on client-side)
  PUBLIC_APP_URL?: string;
  PUBLIC_ENV_NAME?: string;
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        email: string;
        id: string;
      };
      runtime: {
        env: CloudflareEnv;
        cf: CfProperties;
        ctx: ExecutionContext;
      };
    }
  }
}

// Cloudflare-specific runtime context types
interface CfProperties {
  colo?: string;
  country?: string;
  city?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Build-time environment variables (from import.meta.env)
// These are baked into the bundle during build
// For Cloudflare Pages SSR, prefer runtime.env over import.meta.env for secrets
interface ImportMetaEnv {
  // Public variables (available on both client and server)
  readonly PUBLIC_APP_URL?: string;
  readonly PUBLIC_ENV_NAME?: "local" | "integration" | "prod";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
