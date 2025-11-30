import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { registerSchema } from "@/lib/validators/auth.validator";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Create new user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        // Email confirmation required - user will receive confirmation email
        emailRedirectTo: `${new URL(request.url).origin}/login?message=email-confirmed`,
      },
    });

    if (error) {
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

    // Check if email confirmation is required
    const requiresConfirmation = data.user && !data.session;

    const successResponse: ApiSuccessResponse<{
      user_id: string;
      email: string;
      requires_confirmation: boolean;
    }> = {
      data: {
        user_id: data.user?.id || "",
        email: data.user?.email || "",
        requires_confirmation: requiresConfirmation,
      },
    };

    return new Response(JSON.stringify(successResponse), {
      status: 201,
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
  if (supabaseError.includes("User already registered")) return "USER_EXISTS";
  if (supabaseError.includes("email") && supabaseError.includes("invalid"))
    return "INVALID_EMAIL";
  if (supabaseError.includes("password") && supabaseError.includes("weak"))
    return "WEAK_PASSWORD";
  return "AUTH_ERROR";
}

function mapAuthErrorMessage(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    "User already registered": "Użytkownik z tym adresem email już istnieje",
    "invalid email": "Nieprawidłowy format adresu email",
    "weak password": "Hasło jest zbyt słabe",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (supabaseError.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  return "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.";
}
