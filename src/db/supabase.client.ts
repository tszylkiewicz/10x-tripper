import { createClient } from "@supabase/supabase-js";
import { type CookieOptionsWithName, createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

const a = import.meta.env.SUPABASE_URL ?? process.env.SUPABASE_URL;
const b = import.meta.env.OPENROUTER_MODEL ?? process.env.OPENROUTER_MODEL;
const c = import.meta.env.PUBLIC_ENV_NAME ?? process.env.PUBLIC_ENV_NAME;

const supabaseUrl = import.meta.env.SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY ?? process.env.SUPABASE_KEY;

try {
  createClient<Database>(supabaseUrl, supabaseAnonKey);
} catch {
  throw new Error(`SUPABASE_URL ${a}, OPENROUTER_MODEL ${b}, PUBLIC_ENV_NAME ${c}`);
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

// Cookie options for Supabase SSR
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

// Helper function to parse cookie header
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Creates a Supabase server instance with SSR support for authentication
 * Uses @supabase/ssr for proper cookie management in Astro
 *
 * @param context - Object containing headers and cookies from Astro request
 * @returns Supabase server client with auth session support
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
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
