import type { APIRoute } from "astro";
import { ZodError } from "zod";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { forgotPasswordSchema } from "@/lib/validators/auth.validator";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/types";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    if (error) {
      console.error("Password reset error:", error);

      // For security reasons, we don't reveal if email exists or not
      // Always return success to prevent email enumeration attacks
    }

    // Always return success response (security best practice)
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

    console.error("Reset password error:", error);

    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Wystąpił błąd podczas wysyłania emaila z linkiem resetującym",
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
