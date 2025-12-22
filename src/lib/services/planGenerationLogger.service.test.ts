import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculatePromptHash, logGenerationSuccess, logGenerationError } from "./planGenerationLogger.service";
import type { SupabaseClient } from "../../db/supabase.client";

describe("PlanGenerationLogger Service", () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Create mock Supabase client with chainable methods
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    } as unknown as SupabaseClient;

    // Clear logger.error spy
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("calculatePromptHash", () => {
    it("should calculate SHA-256 hash of a simple string", async () => {
      const prompt = "Hello, World!";
      const hash = await calculatePromptHash(prompt);

      expect(hash).toBe("dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f");
      expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it("should produce different hashes for different inputs", async () => {
      const hash1 = await calculatePromptHash("Test 1");
      const hash2 = await calculatePromptHash("Test 2");

      expect(hash1).not.toBe(hash2);
    });

    it("should produce same hash for identical inputs (deterministic)", async () => {
      const prompt = "Consistent input";
      const hash1 = await calculatePromptHash(prompt);
      const hash2 = await calculatePromptHash(prompt);

      expect(hash1).toBe(hash2);
    });

    it("should handle empty string", async () => {
      const hash = await calculatePromptHash("");

      expect(hash).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
      expect(hash).toHaveLength(64);
    });

    it("should handle multi-line strings", async () => {
      const prompt = "Line 1\nLine 2\nLine 3";
      const hash = await calculatePromptHash(prompt);

      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe("string");
    });

    it("should handle special characters and unicode", async () => {
      const prompt = "Special: !@#$%^&*() Unicode: 你好世界 🚀";
      const hash = await calculatePromptHash(prompt);

      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe("string");
    });

    it("should handle very long strings", async () => {
      const longPrompt = "a".repeat(10000);
      const hash = await calculatePromptHash(longPrompt);

      expect(hash).toHaveLength(64);
      expect(typeof hash).toBe("string");
    });

    it("should pad hex values correctly (ensure leading zeros)", async () => {
      // This tests that the padding logic works for bytes that would be < 0x10
      const prompt = "test padding";
      const hash = await calculatePromptHash(prompt);

      // Verify it's valid hex (no invalid characters)
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });
  });

  describe("logGenerationSuccess", () => {
    it("should log successful generation and return generation ID", async () => {
      const params = {
        user_id: "user-123",
        model: "openai/o3-mini",
        prompt: "Generate a trip to Paris",
        duration_ms: 5000,
      };

      const mockGenerationId = "gen-uuid-123";

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: mockGenerationId },
        error: null,
      });

      const result = await logGenerationSuccess(mockSupabase, params);

      expect(mockSupabase.from).toHaveBeenCalledWith("plan_generations");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        model: "openai/o3-mini",
        source_text_hash: expect.any(String),
        source_text_length: params.prompt.length,
        duration_ms: 5000,
      });
      expect(mockSupabase.select).toHaveBeenCalledWith("id");
      expect(result).toBe(mockGenerationId);
    });

    it("should calculate and store correct prompt hash", async () => {
      const params = {
        user_id: "user-456",
        model: "anthropic/claude-3-sonnet",
        prompt: "Hello, World!",
        duration_ms: 3000,
      };

      const expectedHash = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "gen-uuid-456" },
        error: null,
      });

      await logGenerationSuccess(mockSupabase, params);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          source_text_hash: expectedHash,
        })
      );
    });

    it("should store correct source_text_length", async () => {
      const testPrompt = "This is a test prompt";
      const params = {
        user_id: "user-789",
        model: "openai/gpt-4",
        prompt: testPrompt,
        duration_ms: 2500,
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "gen-uuid-789" },
        error: null,
      });

      await logGenerationSuccess(mockSupabase, params);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          source_text_length: testPrompt.length,
        })
      );
    });

    it("should handle empty prompt (edge case)", async () => {
      const params = {
        user_id: "user-empty",
        model: "openai/o3-mini",
        prompt: "",
        duration_ms: 1000,
      };

      const expectedHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "gen-empty" },
        error: null,
      });

      const result = await logGenerationSuccess(mockSupabase, params);

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: "user-empty",
        model: "openai/o3-mini",
        source_text_hash: expectedHash,
        source_text_length: 0,
        duration_ms: 1000,
      });
      expect(result).toBe("gen-empty");
    });

    it("should handle very long prompts", async () => {
      const longPrompt = "a".repeat(5000);
      const params = {
        user_id: "user-long",
        model: "openai/o3-mini",
        prompt: longPrompt,
        duration_ms: 10000,
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "gen-long" },
        error: null,
      });

      const result = await logGenerationSuccess(mockSupabase, params);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          source_text_length: 5000,
          source_text_hash: expect.any(String),
        })
      );
      expect(result).toBe("gen-long");
    });

    it("should throw error when database insert fails", async () => {
      const params = {
        user_id: "user-fail",
        model: "openai/o3-mini",
        prompt: "Test",
        duration_ms: 1000,
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });

      await expect(logGenerationSuccess(mockSupabase, params)).rejects.toThrow("Failed to log generation");
    });

    it("should log error to console when database insert fails", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      const params = {
        user_id: "user-fail",
        model: "openai/o3-mini",
        prompt: "Test",
        duration_ms: 1000,
      };

      const dbError = { message: "Database connection failed", code: "DB_ERROR" };
      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: dbError,
      });

      await expect(logGenerationSuccess(mockSupabase, params)).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to log generation success:", dbError);
    });

    it("should handle duration_ms of 0", async () => {
      const params = {
        user_id: "user-instant",
        model: "openai/o3-mini",
        prompt: "Quick response",
        duration_ms: 0,
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "gen-instant" },
        error: null,
      });

      const result = await logGenerationSuccess(mockSupabase, params);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_ms: 0,
        })
      );
      expect(result).toBe("gen-instant");
    });
  });

  describe("logGenerationError", () => {
    it("should log generation error with all parameters", async () => {
      const params = {
        user_id: "user-error",
        model: "openai/o3-mini",
        prompt: "Failed generation",
        duration_ms: 2000,
        error_message: "API rate limit exceeded",
        error_code: "RATE_LIMIT",
      };

      (mockSupabase.from as any).mockReturnValue({
        insert: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      await logGenerationError(mockSupabase, params);

      expect(mockSupabase.from).toHaveBeenCalledWith("plan_generation_error_logs");
    });

    it("should calculate and store correct prompt hash", async () => {
      const params = {
        user_id: "user-error-2",
        model: "anthropic/claude-3-sonnet",
        prompt: "Hello, World!",
        duration_ms: 1500,
        error_message: "Validation failed",
        error_code: "VALIDATION_ERROR",
      };

      const expectedHash = "dffd6021bb2bd5b0af676290809ec3a53191dd81c7f70a4b28688a362182986f";

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          source_text_hash: expectedHash,
        })
      );
    });

    it("should store all error parameters correctly", async () => {
      const params = {
        user_id: "user-error-3",
        model: "openai/gpt-4",
        prompt: "Test prompt",
        duration_ms: 3500,
        error_message: "Timeout occurred",
        error_code: "TIMEOUT",
      };

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(insertMock).toHaveBeenCalledWith({
        user_id: "user-error-3",
        model: "openai/gpt-4",
        source_text_hash: expect.any(String),
        source_text_length: "Test prompt".length,
        duration_ms: 3500,
        error_message: "Timeout occurred",
        error_code: "TIMEOUT",
      });
    });

    it("should set error_code to null when not provided", async () => {
      const params = {
        user_id: "user-no-code",
        model: "openai/o3-mini",
        prompt: "Test",
        duration_ms: 1000,
        error_message: "Unknown error",
      };

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error_code: null,
        })
      );
    });

    it("should NOT throw when database insert fails (silent failure)", async () => {
      const params = {
        user_id: "user-fail",
        model: "openai/o3-mini",
        prompt: "Test",
        duration_ms: 1000,
        error_message: "Original error",
        error_code: "ORIGINAL_ERROR",
      };

      const insertMock = vi.fn().mockResolvedValue({
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      // Should NOT throw - this is the critical behavior
      await expect(logGenerationError(mockSupabase, params)).resolves.toBeUndefined();
    });

    it("should log to console when database insert fails (cascading error prevention)", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error");
      const params = {
        user_id: "user-cascade",
        model: "openai/o3-mini",
        prompt: "Test",
        duration_ms: 1000,
        error_message: "Original error",
      };

      const dbError = { message: "Database connection failed", code: "DB_ERROR" };
      const insertMock = vi.fn().mockResolvedValue({
        error: dbError,
      });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to log generation error:", dbError);
    });

    it("should handle empty prompt in error logging", async () => {
      const params = {
        user_id: "user-empty-error",
        model: "openai/o3-mini",
        prompt: "",
        duration_ms: 500,
        error_message: "Prompt was empty",
        error_code: "EMPTY_PROMPT",
      };

      const expectedHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          source_text_hash: expectedHash,
          source_text_length: 0,
        })
      );
    });

    it("should handle very long error messages", async () => {
      const longErrorMessage = "Error: " + "x".repeat(1000);
      const params = {
        user_id: "user-long-error",
        model: "openai/o3-mini",
        prompt: "Test",
        duration_ms: 1000,
        error_message: longErrorMessage,
        error_code: "LONG_ERROR",
      };

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error_message: longErrorMessage,
        })
      );
    });

    it("should handle duration_ms of 0 in error logging", async () => {
      const params = {
        user_id: "user-instant-fail",
        model: "openai/o3-mini",
        prompt: "Instant failure",
        duration_ms: 0,
        error_message: "Immediate validation failure",
        error_code: "VALIDATION_ERROR",
      };

      const insertMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertMock,
      });

      await logGenerationError(mockSupabase, params);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_ms: 0,
        })
      );
    });
  });

  describe("hash consistency between success and error logging", () => {
    it("should produce same hash for same prompt in both success and error logs", async () => {
      const prompt = "Consistent test prompt";
      let successHash: string;
      let errorHash: string;

      // Log success - capture the insert call
      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "gen-123" },
        error: null,
      });

      await logGenerationSuccess(mockSupabase, {
        user_id: "user-1",
        model: "test-model",
        prompt,
        duration_ms: 1000,
      });

      // Extract hash from the first insert call
      const successInsertCall = (mockSupabase.insert as any).mock.calls[0][0];
      successHash = successInsertCall.source_text_hash;

      // Reset mocks
      vi.clearAllMocks();

      // Re-initialize mockSupabase for error logging
      mockSupabase = {
        from: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn(),
      } as unknown as SupabaseClient;

      // Log error
      const insertErrorMock = vi.fn().mockResolvedValue({ error: null });
      (mockSupabase.from as any).mockReturnValue({
        insert: insertErrorMock,
      });

      await logGenerationError(mockSupabase, {
        user_id: "user-1",
        model: "test-model",
        prompt,
        duration_ms: 1000,
        error_message: "Test error",
      });

      errorHash = insertErrorMock.mock.calls[0][0].source_text_hash;

      expect(successHash).toBe(errorHash);
    });
  });
});
