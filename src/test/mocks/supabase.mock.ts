import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Mock Supabase client for testing
 * Provides commonly used methods with vi.fn() mocks
 */
export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  return {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    } as any,
  };
};

/**
 * Mock successful query response
 */
export const mockSuccessResponse = <T>(data: T) => ({
  data,
  error: null,
});

/**
 * Mock error response
 */
export const mockErrorResponse = (message: string) => ({
  data: null,
  error: { message },
});
