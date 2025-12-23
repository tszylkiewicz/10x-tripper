import type { Mock } from "vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserPreferencesService } from "./userPreferences.service";
import { ValidationError } from "@/errors/validation.error.ts";
import type { SupabaseClient } from "@/db/supabase.client.ts";
import type { CreatePreferenceCommand, DeletePreferenceCommand, UpdatePreferenceCommand } from "@/types.ts";

describe("UserPreferencesService", () => {
  let service: UserPreferencesService;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    // Create mock Supabase client with chainable methods
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    } as unknown as SupabaseClient;

    service = new UserPreferencesService(mockSupabase);
  });

  describe("getPreferences", () => {
    it("should return all user preferences sorted by created_at DESC", async () => {
      const mockData = [
        { id: "1", name: "Vacation", people_count: 2, budget_type: "medium" },
        { id: "2", name: "Business", people_count: 1, budget_type: "high" },
      ];

      (mockSupabase.order as Mock).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await service.getPreferences("user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.select).toHaveBeenCalledWith("id, name, people_count, budget_type");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockSupabase.order).toHaveBeenCalledWith("created_at", { ascending: false });
      expect(result).toEqual(mockData);
    });

    it("should return empty array when user has no preferences", async () => {
      (mockSupabase.order as Mock).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.getPreferences("user-123");

      expect(result).toEqual([]);
    });

    it("should throw error when database operation fails", async () => {
      (mockSupabase.order as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });

      await expect(service.getPreferences("user-123")).rejects.toThrow("Failed to fetch preferences");
    });
  });

  describe("createPreference", () => {
    it("should create a new preference with all fields", async () => {
      const command: CreatePreferenceCommand = {
        user_id: "user-123",
        name: "Summer Vacation",
        people_count: 4,
        budget_type: "high",
      };

      const mockCreated = {
        id: "pref-1",
        name: "Summer Vacation",
        people_count: 4,
        budget_type: "high",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockCreated,
        error: null,
      });

      const result = await service.createPreference(command);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Summer Vacation",
        people_count: 4,
        budget_type: "high",
      });
      expect(result).toEqual(mockCreated);
    });

    it("should create preference with only required fields", async () => {
      const command: CreatePreferenceCommand = {
        user_id: "user-123",
        name: "Minimal Preference",
      };

      const mockCreated = {
        id: "pref-2",
        name: "Minimal Preference",
        people_count: null,
        budget_type: null,
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockCreated,
        error: null,
      });

      const result = await service.createPreference(command);

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        name: "Minimal Preference",
        people_count: undefined,
        budget_type: undefined,
      });
      expect(result).toEqual(mockCreated);
    });

    describe("validation", () => {
      it("should reject empty name", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "",
        };

        await expect(service.createPreference(command)).rejects.toThrow(ValidationError);
        await expect(service.createPreference(command)).rejects.toThrow("Name is required");
      });

      it("should reject whitespace-only name", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "   ",
        };

        await expect(service.createPreference(command)).rejects.toThrow(ValidationError);
        await expect(service.createPreference(command)).rejects.toThrow("Name is required");
      });

      it("should reject name longer than 256 characters", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "a".repeat(257),
        };

        await expect(service.createPreference(command)).rejects.toThrow(ValidationError);
        await expect(service.createPreference(command)).rejects.toThrow("Name must not exceed 256 characters");
      });

      it("should accept name with exactly 256 characters", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "a".repeat(256),
        };

        const mockCreated = {
          id: "pref-3",
          name: "a".repeat(256),
          people_count: null,
          budget_type: null,
        };

        (mockSupabase.single as Mock).mockResolvedValueOnce({
          data: mockCreated,
          error: null,
        });

        const result = await service.createPreference(command);

        expect(result).toEqual(mockCreated);
      });

      it("should reject zero people_count", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "Invalid Count",
          people_count: 0,
        };

        await expect(service.createPreference(command)).rejects.toThrow(ValidationError);
        await expect(service.createPreference(command)).rejects.toThrow(
          "People count must be a positive integer (>= 1)"
        );
      });

      it("should reject negative people_count", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "Negative Count",
          people_count: -5,
        };

        await expect(service.createPreference(command)).rejects.toThrow(ValidationError);
        await expect(service.createPreference(command)).rejects.toThrow(
          "People count must be a positive integer (>= 1)"
        );
      });

      it("should reject non-integer people_count", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "Decimal Count",
          people_count: 2.5,
        };

        await expect(service.createPreference(command)).rejects.toThrow(ValidationError);
        await expect(service.createPreference(command)).rejects.toThrow(
          "People count must be a positive integer (>= 1)"
        );
      });

      it("should accept people_count of 1", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "Solo Trip",
          people_count: 1,
        };

        const mockCreated = {
          id: "pref-4",
          name: "Solo Trip",
          people_count: 1,
          budget_type: null,
        };

        (mockSupabase.single as Mock).mockResolvedValueOnce({
          data: mockCreated,
          error: null,
        });

        const result = await service.createPreference(command);

        expect(result).toEqual(mockCreated);
      });

      it("should accept null people_count", async () => {
        const command: CreatePreferenceCommand = {
          user_id: "user-123",
          name: "Null Count",
          people_count: null,
        };

        const mockCreated = {
          id: "pref-5",
          name: "Null Count",
          people_count: null,
          budget_type: null,
        };

        (mockSupabase.single as Mock).mockResolvedValueOnce({
          data: mockCreated,
          error: null,
        });

        const result = await service.createPreference(command);

        expect(result).toEqual(mockCreated);
      });
    });

    it("should throw database error when insert fails", async () => {
      const command: CreatePreferenceCommand = {
        user_id: "user-123",
        name: "Test",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Unique constraint violation", code: "23505" },
      });

      await expect(service.createPreference(command)).rejects.toThrow();
    });
  });

  describe("getPreferenceById", () => {
    it("should return preference when found", async () => {
      const mockPreference = {
        id: "pref-1",
        name: "Vacation",
        people_count: 2,
        budget_type: "medium",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockPreference,
        error: null,
      });

      const result = await service.getPreferenceById("pref-1", "user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.select).toHaveBeenCalledWith("id, name, people_count, budget_type");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "pref-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(result).toEqual(mockPreference);
    });

    it("should return null when preference not found (PGRST116)", async () => {
      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const result = await service.getPreferenceById("non-existent", "user-123");

      expect(result).toBeNull();
    });

    it("should return null when preference belongs to different user", async () => {
      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const result = await service.getPreferenceById("pref-1", "wrong-user");

      expect(result).toBeNull();
    });

    it("should throw error when database operation fails with non-PGRST116 error", async () => {
      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: null,
        error: { code: "DB_ERROR", message: "Database connection failed" },
      });

      await expect(service.getPreferenceById("pref-1", "user-123")).rejects.toThrow();
    });
  });

  describe("updatePreference", () => {
    it("should update all fields", async () => {
      const command: UpdatePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
        name: "Updated Name",
        people_count: 5,
        budget_type: "luxury",
      };

      const mockUpdated = {
        id: "pref-1",
        name: "Updated Name",
        people_count: 5,
        budget_type: "luxury",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await service.updatePreference(command);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.update).toHaveBeenCalledWith({
        name: "Updated Name",
        people_count: 5,
        budget_type: "luxury",
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "pref-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(result).toEqual(mockUpdated);
    });

    it("should update only name", async () => {
      const command: UpdatePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
        name: "New Name Only",
      };

      const mockUpdated = {
        id: "pref-1",
        name: "New Name Only",
        people_count: 2,
        budget_type: "medium",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await service.updatePreference(command);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        name: "New Name Only",
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should update only people_count", async () => {
      const command: UpdatePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
        people_count: 3,
      };

      const mockUpdated = {
        id: "pref-1",
        name: "Existing Name",
        people_count: 3,
        budget_type: "medium",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await service.updatePreference(command);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        people_count: 3,
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should update only budget_type", async () => {
      const command: UpdatePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
        budget_type: "low",
      };

      const mockUpdated = {
        id: "pref-1",
        name: "Existing Name",
        people_count: 2,
        budget_type: "low",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await service.updatePreference(command);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        budget_type: "low",
      });
      expect(result).toEqual(mockUpdated);
    });

    it("should set people_count to null", async () => {
      const command: UpdatePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
        people_count: null,
      };

      const mockUpdated = {
        id: "pref-1",
        name: "Existing Name",
        people_count: null,
        budget_type: "medium",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      });

      const result = await service.updatePreference(command);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        people_count: null,
      });
      expect(result).toEqual(mockUpdated);
    });

    describe("validation", () => {
      it("should reject update with no fields", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow(
          "At least one field must be provided for update"
        );
      });

      it("should reject empty name", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
          name: "",
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow("Name cannot be empty");
      });

      it("should reject whitespace-only name", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
          name: "   ",
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow("Name cannot be empty");
      });

      it("should reject name longer than 256 characters", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
          name: "a".repeat(257),
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow("Name must not exceed 256 characters");
      });

      it("should reject invalid people_count (zero)", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
          people_count: 0,
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow(
          "People count must be a positive integer (>= 1)"
        );
      });

      it("should reject invalid people_count (negative)", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
          people_count: -1,
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow(
          "People count must be a positive integer (>= 1)"
        );
      });

      it("should reject non-integer people_count", async () => {
        const command: UpdatePreferenceCommand = {
          id: "pref-1",
          user_id: "user-123",
          people_count: 3.14,
        };

        await expect(service.updatePreference(command)).rejects.toThrow(ValidationError);
        await expect(service.updatePreference(command)).rejects.toThrow(
          "People count must be a positive integer (>= 1)"
        );
      });
    });

    it("should return null when preference not found (PGRST116)", async () => {
      const command: UpdatePreferenceCommand = {
        id: "non-existent",
        user_id: "user-123",
        name: "New Name",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const result = await service.updatePreference(command);

      expect(result).toBeNull();
    });

    it("should throw error when database operation fails with non-PGRST116 error", async () => {
      const command: UpdatePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
        name: "Updated",
      };

      (mockSupabase.single as Mock).mockResolvedValueOnce({
        data: null,
        error: { code: "DB_ERROR", message: "Database connection failed" },
      });

      await expect(service.updatePreference(command)).rejects.toThrow();
    });
  });

  describe("deletePreference", () => {
    it("should delete preference successfully", async () => {
      const command: DeletePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
      };

      (mockSupabase.select as Mock).mockResolvedValueOnce({
        data: [{ id: "pref-1" }],
        error: null,
      });

      const result = await service.deletePreference(command);

      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "pref-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(result).toBe(true);
    });

    it("should return false when preference not found", async () => {
      const command: DeletePreferenceCommand = {
        id: "non-existent",
        user_id: "user-123",
      };

      (mockSupabase.select as Mock).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.deletePreference(command);

      expect(result).toBe(false);
    });

    it("should return false when preference belongs to different user", async () => {
      const command: DeletePreferenceCommand = {
        id: "pref-1",
        user_id: "wrong-user",
      };

      (mockSupabase.select as Mock).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.deletePreference(command);

      expect(result).toBe(false);
    });

    it("should throw error when database operation fails", async () => {
      const command: DeletePreferenceCommand = {
        id: "pref-1",
        user_id: "user-123",
      };

      (mockSupabase.select as Mock).mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });

      await expect(service.deletePreference(command)).rejects.toThrow("Failed to delete preference");
    });
  });
});
