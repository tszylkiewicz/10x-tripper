/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

// Cloudflare environment variables
interface CloudflareEnv {
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  OPENROUTER_API_KEY: string;
  OPENROUTER_MODEL?: string;
  PUBLIC_APP_URL?: string;
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
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly PUBLIC_ENV_NAME?: "local" | "integration" | "prod";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
