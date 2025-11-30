/**
 * Zod Validation Schemas for Authentication
 *
 * These schemas validate incoming request data for auth endpoints.
 * Error messages are in Polish as they are user-facing.
 */

import { z } from "zod";

// Common email schema used across all auth forms
const emailSchema = z.string().email("Nieprawidłowy format adresu email");

// Password schema for registration and password reset (strong requirements)
const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
  .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę");

/**
 * Schema for login form validation
 * Used in: LoginForm.tsx (client-side), POST /api/auth/login (server-side)
 *
 * Validates email format and ensures password is not empty.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for registration form validation
 * Used in: RegisterForm.tsx (client-side), POST /api/auth/signup (server-side)
 *
 * Validates email and strong password requirements.
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Schema for registration form with password confirmation
 * Used in: RegisterForm.tsx (client-side only)
 *
 * Extends registerSchema to ensure password confirmation matches.
 */
export const registerWithConfirmSchema = registerSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type RegisterWithConfirmInput = z.infer<typeof registerWithConfirmSchema>;

/**
 * Schema for forgot password form validation
 * Used in: ForgotPasswordForm.tsx, POST /api/auth/reset-password
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema for reset password form validation
 * Used in: ResetPasswordForm.tsx, POST /api/auth/update-password
 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for reset password form with confirmation
 * Used in: ResetPasswordForm.tsx (client-side only)
 */
export const resetPasswordWithConfirmSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type ResetPasswordWithConfirmInput = z.infer<typeof resetPasswordWithConfirmSchema>;
