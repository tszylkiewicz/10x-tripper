import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { resetPasswordSchema } from "@/lib/validators/auth.validator";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Verify user has valid session from reset token
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INVALID_TOKEN",
          message: "Link resetujący hasło jest nieprawidłowy lub wygasł",
        },
      };

      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: validatedData.password,
    });

    if (error) {
      console.error("Update password error:", error);

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

    const successResponse: ApiSuccessResponse<{ success: boolean }> = {
      data: {
        success: true,
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

    console.error("Update password error:", error);

    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas zmiany hasła",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

function mapAuthErrorCode(supabaseError: string): string {
  if (supabaseError.includes("password") && supabaseError.includes("weak")) return "WEAK_PASSWORD";
  if (supabaseError.includes("same password")) return "SAME_PASSWORD";
  return "AUTH_ERROR";
}

function mapAuthErrorMessage(supabaseError: string): string {
  const errorMap: Record<string, string> = {
    "weak password": "Hasło jest zbyt słabe",
    "same password": "Nowe hasło musi być inne niż poprzednie",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (supabaseError.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  return "Wystąpił błąd podczas zmiany hasła. Spróbuj ponownie.";
}
