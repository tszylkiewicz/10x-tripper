import { describe, it, expect, vi, beforeEach } from "vitest";
import { TripPlanService } from "./tripPlan.service";
import { ValidationError } from "../../errors/validation.error";
import type { SupabaseClient } from "../../db/supabase.client";
import type { AcceptPlanCommand, DeleteTripPlanCommand, UpdatePlanCommand, PlanDetailsDto } from "../../types";

describe("TripPlanService", () => {
  let service: TripPlanService;
  let mockSupabase: any;

  const mockPlanDetails: PlanDetailsDto = {
    days: [
      {
        day: 1,
        date: "2025-06-01",
        activities: [
          {
            time: "10:00",
            title: "Museum Visit",
            description: "Visit the Louvre",
            location: "Paris, France",
          },
        ],
      },
    ],
    accommodation: {
      name: "Hotel Paris",
      address: "123 Rue de Rivoli",
      check_in: "2025-06-01",
      check_out: "2025-06-03",
    },
    total_estimated_cost: 1500,
    notes: "Test notes",
  };

  beforeEach(() => {
    // Create mock Supabase client with chainable methods
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    } as unknown as SupabaseClient;

    service = new TripPlanService(mockSupabase);

    // Clear logger.error spy
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  describe("getTripPlans", () => {
    it("should return all active trip plans sorted by start_date ASC", async () => {
      const mockData = [
        {
          id: "plan-1",
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
        },
        {
          id: "plan-2",
          destination: "London",
          start_date: "2025-07-01",
          end_date: "2025-07-05",
          people_count: 1,
          budget_type: "low",
          plan_details: mockPlanDetails,
        },
      ];

      (mockSupabase.order as any).mockResolvedValueOnce({
        data: mockData,
        error: null,
      });

      const result = await service.getTripPlans("user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("trip_plans");
      expect(mockSupabase.select).toHaveBeenCalledWith(
        "id, destination, start_date, end_date, people_count, budget_type, plan_details"
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(mockSupabase.is).toHaveBeenCalledWith("deleted_at", null);
      expect(mockSupabase.order).toHaveBeenCalledWith("start_date", { ascending: true });
      expect(result).toEqual(mockData);
    });

    it("should return empty array when user has no trip plans", async () => {
      (mockSupabase.order as any).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.getTripPlans("user-123");

      expect(result).toEqual([]);
    });

    it("should exclude soft-deleted plans", async () => {
      (mockSupabase.order as any).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await service.getTripPlans("user-123");

      expect(mockSupabase.is).toHaveBeenCalledWith("deleted_at", null);
    });

    it("should throw error when database operation fails", async () => {
      (mockSupabase.order as any).mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });

      await expect(service.getTripPlans("user-123")).rejects.toThrow("Failed to fetch trip plans");
    });
  });

  describe("getTripPlanById", () => {
    it("should return trip plan when found", async () => {
      const mockPlan = {
        id: "plan-1",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: mockPlanDetails,
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: mockPlan,
        error: null,
      });

      const result = await service.getTripPlanById("550e8400-e29b-41d4-a716-446655440000", "user-123");

      expect(mockSupabase.from).toHaveBeenCalledWith("trip_plans");
      expect(mockSupabase.select).toHaveBeenCalledWith(
        "id, destination, start_date, end_date, people_count, budget_type, plan_details"
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "550e8400-e29b-41d4-a716-446655440000");
      expect(mockSupabase.is).toHaveBeenCalledWith("deleted_at", null);
      expect(result).toEqual(mockPlan);
    });

    it("should throw error for invalid UUID format", async () => {
      await expect(service.getTripPlanById("invalid-uuid", "user-123")).rejects.toThrow("Invalid UUID format");
    });

    it("should return null when trip plan not found (PGRST116)", async () => {
      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const result = await service.getTripPlanById("550e8400-e29b-41d4-a716-446655440000", "user-123");

      expect(result).toBeNull();
    });

    it("should return null when trip plan is soft-deleted", async () => {
      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const result = await service.getTripPlanById("550e8400-e29b-41d4-a716-446655440000", "user-123");

      expect(result).toBeNull();
    });

    it("should throw error when database operation fails with non-PGRST116 error", async () => {
      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { code: "DB_ERROR", message: "Database connection failed" },
      });

      await expect(service.getTripPlanById("550e8400-e29b-41d4-a716-446655440000", "user-123")).rejects.toThrow();
    });
  });

  describe("deleteTripPlan", () => {
    it("should soft delete trip plan successfully", async () => {
      const command: DeleteTripPlanCommand = {
        id: "plan-1",
        user_id: "user-123",
      };

      (mockSupabase.select as any).mockResolvedValueOnce({
        data: [{ id: "plan-1" }],
        error: null,
      });

      const result = await service.deleteTripPlan(command);

      expect(mockSupabase.from).toHaveBeenCalledWith("trip_plans");
      expect(mockSupabase.update).toHaveBeenCalledWith({
        deleted_at: expect.any(String),
      });
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "plan-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(result).toBe(true);
    });

    it("should set deleted_at to current ISO timestamp", async () => {
      const command: DeleteTripPlanCommand = {
        id: "plan-1",
        user_id: "user-123",
      };

      const beforeTime = new Date().toISOString();

      (mockSupabase.select as any).mockResolvedValueOnce({
        data: [{ id: "plan-1" }],
        error: null,
      });

      await service.deleteTripPlan(command);

      const afterTime = new Date().toISOString();
      const updateCall = (mockSupabase.update as any).mock.calls[0][0];
      const deletedAt = updateCall.deleted_at;

      // Verify it's a valid ISO timestamp between before and after
      expect(deletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(deletedAt >= beforeTime).toBe(true);
      expect(deletedAt <= afterTime).toBe(true);
    });

    it("should return false when trip plan not found", async () => {
      const command: DeleteTripPlanCommand = {
        id: "non-existent",
        user_id: "user-123",
      };

      (mockSupabase.select as any).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.deleteTripPlan(command);

      expect(result).toBe(false);
    });

    it("should return false when trip plan belongs to different user", async () => {
      const command: DeleteTripPlanCommand = {
        id: "plan-1",
        user_id: "wrong-user",
      };

      (mockSupabase.select as any).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await service.deleteTripPlan(command);

      expect(result).toBe(false);
    });

    it("should throw error when database operation fails", async () => {
      const command: DeleteTripPlanCommand = {
        id: "plan-1",
        user_id: "user-123",
      };

      (mockSupabase.select as any).mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      });

      await expect(service.deleteTripPlan(command)).rejects.toThrow();
    });
  });

  describe("acceptPlan", () => {
    it("should accept and save a valid trip plan", async () => {
      const command: AcceptPlanCommand = {
        user_id: "user-123",
        generation_id: null,
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: mockPlanDetails,
        source: "ai",
      };

      const mockSaved = {
        id: "plan-1",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: mockPlanDetails,
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: mockSaved,
        error: null,
      });

      const result = await service.acceptPlan(command);

      expect(mockSupabase.from).toHaveBeenCalledWith("trip_plans");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: "user-123",
        generation_id: null,
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: expect.any(Object),
        source: "ai",
      });
      expect(result).toEqual(mockSaved);
    });

    it("should accept plan with generation_id", async () => {
      const command: AcceptPlanCommand = {
        user_id: "user-123",
        generation_id: "gen-uuid-123",
        destination: "London",
        start_date: "2025-07-01",
        end_date: "2025-07-05",
        people_count: 1,
        budget_type: "high",
        plan_details: mockPlanDetails,
        source: "ai",
      };

      // Mock generation_id verification
      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { id: "gen-uuid-123" },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "plan-2", ...command },
          error: null,
        });

      const result = await service.acceptPlan(command);

      expect(result).toBeDefined();
      expect(result.destination).toBe("London");
    });

    it("should accept plan with source 'ai-edited'", async () => {
      const command: AcceptPlanCommand = {
        user_id: "user-123",
        generation_id: null,
        destination: "Berlin",
        start_date: "2025-08-01",
        end_date: "2025-08-05",
        people_count: 3,
        budget_type: "low",
        plan_details: mockPlanDetails,
        source: "ai-edited",
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: { id: "plan-3", ...command },
        error: null,
      });

      const result = await service.acceptPlan(command);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          source: "ai-edited",
        })
      );
      expect(result).toBeDefined();
    });

    describe("validation - date rules", () => {
      it("should reject when end_date is before start_date", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-05",
          end_date: "2025-06-01",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("End date must be on or after start date");
      });

      it("should accept when end_date equals start_date (same day trip)", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-01",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        (mockSupabase.single as any).mockResolvedValueOnce({
          data: { id: "plan-same-day", ...command },
          error: null,
        });

        const result = await service.acceptPlan(command);

        expect(result).toBeDefined();
      });
    });

    describe("validation - people_count", () => {
      it("should reject people_count of 0", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 0,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("People count must be at least 1");
      });

      it("should reject negative people_count", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: -1,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("People count must be at least 1");
      });

      it("should accept people_count of 1", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 1,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        (mockSupabase.single as any).mockResolvedValueOnce({
          data: { id: "plan-solo", ...command },
          error: null,
        });

        const result = await service.acceptPlan(command);

        expect(result).toBeDefined();
      });
    });

    describe("validation - plan_details", () => {
      it("should reject empty plan_details", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: {} as PlanDetailsDto,
          source: "ai",
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("Plan details cannot be empty");
      });

      it("should reject plan_details without days array", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: { days: [] } as PlanDetailsDto,
          source: "ai",
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("Plan must contain at least one day");
      });

      it("should reject plan_details with empty days array", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: { days: [] } as PlanDetailsDto,
          source: "ai",
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("Plan must contain at least one day");
      });
    });

    describe("validation - source", () => {
      it("should reject invalid source value", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: null,
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "manual" as any,
        };

        await expect(service.acceptPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.acceptPlan(command)).rejects.toThrow("Source must be either 'ai' or 'ai-edited'");
      });
    });

    describe("validation - generation_id verification", () => {
      it("should throw ValidationError when generation_id does not exist", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: "non-existent-gen",
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        // Mock the verification call to return not found
        (mockSupabase.single as any).mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "No rows returned" },
        });

        try {
          await service.acceptPlan(command);
          expect.fail("Should have thrown ValidationError");
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toBe(
            "The provided generation_id does not exist or does not belong to you"
          );
        }
      });

      it("should throw ValidationError when generation_id belongs to different user", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: "gen-other-user",
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        // Mock the verification call to return not found (RLS filters it out)
        (mockSupabase.single as any).mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "No rows returned" },
        });

        try {
          await service.acceptPlan(command);
          expect.fail("Should have thrown ValidationError");
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toBe(
            "The provided generation_id does not exist or does not belong to you"
          );
        }
      });

      it("should verify generation_id in plan_generations table", async () => {
        const command: AcceptPlanCommand = {
          user_id: "user-123",
          generation_id: "gen-verify",
          destination: "Paris",
          start_date: "2025-06-01",
          end_date: "2025-06-03",
          people_count: 2,
          budget_type: "medium",
          plan_details: mockPlanDetails,
          source: "ai",
        };

        (mockSupabase.single as any)
          .mockResolvedValueOnce({
            data: { id: "gen-verify" },
            error: null,
          })
          .mockResolvedValueOnce({
            data: { id: "plan-verified", ...command },
            error: null,
          });

        await service.acceptPlan(command);

        // Verify the first call was to plan_generations
        expect(mockSupabase.from).toHaveBeenNthCalledWith(1, "plan_generations");
        expect(mockSupabase.eq).toHaveBeenCalledWith("id", "gen-verify");
        expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
      });
    });

    it("should throw error when database insert fails", async () => {
      const command: AcceptPlanCommand = {
        user_id: "user-123",
        generation_id: null,
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
        plan_details: mockPlanDetails,
        source: "ai",
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { message: "Database insert failed", code: "DB_ERROR" },
      });

      await expect(service.acceptPlan(command)).rejects.toThrow();
    });
  });

  describe("updateTripPlan", () => {
    it("should update all fields except plan_details", async () => {
      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        destination: "New Destination",
        start_date: "2025-07-01",
        end_date: "2025-07-05",
        people_count: 3,
        budget_type: "high",
      };

      // Mock getTripPlanForUpdate
      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...command, plan_details: mockPlanDetails },
          error: null,
        });

      const result = await service.updateTripPlan(command);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        destination: "New Destination",
        start_date: "2025-07-01",
        end_date: "2025-07-05",
        people_count: 3,
        budget_type: "high",
      });
      expect(result).toBeDefined();
      expect(result?.destination).toBe("New Destination");
    });

    it("should update only destination", async () => {
      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        destination: "Updated Destination",
      };

      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "plan-1", destination: "Updated Destination" },
          error: null,
        });

      const result = await service.updateTripPlan(command);

      expect(mockSupabase.update).toHaveBeenCalledWith({
        destination: "Updated Destination",
      });
      expect(result).toBeDefined();
    });

    it("should update plan_details and change source from 'ai' to 'ai-edited'", async () => {
      const newPlanDetails: PlanDetailsDto = {
        days: [
          {
            day: 1,
            date: "2025-06-01",
            activities: [
              {
                time: "11:00",
                title: "Modified Activity",
                description: "Updated description",
                location: "New Location",
              },
            ],
          },
        ],
      };

      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        plan_details: newPlanDetails,
      };

      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "plan-1", plan_details: newPlanDetails },
          error: null,
        });

      await service.updateTripPlan(command);

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          plan_details: newPlanDetails,
          source: "ai-edited",
        })
      );
    });

    it("should NOT change source when plan_details updated but source was already 'ai-edited'", async () => {
      const newPlanDetails: PlanDetailsDto = {
        days: [
          {
            day: 1,
            date: "2025-06-01",
            activities: [
              {
                time: "12:00",
                title: "Another Update",
                description: "Description",
                location: "Location",
              },
            ],
          },
        ],
      };

      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        plan_details: newPlanDetails,
      };

      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai-edited", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: "plan-1", plan_details: newPlanDetails },
          error: null,
        });

      await service.updateTripPlan(command);

      const updateCall = (mockSupabase.update as any).mock.calls[0][0];
      expect(updateCall.source).toBeUndefined();
    });

    it("should NOT change source when updating fields other than plan_details", async () => {
      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        destination: "New Destination",
        people_count: 5,
      };

      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...command },
          error: null,
        });

      await service.updateTripPlan(command);

      const updateCall = (mockSupabase.update as any).mock.calls[0][0];
      expect(updateCall.source).toBeUndefined();
    });

    describe("validation", () => {
      it("should reject update with no fields", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("At least one field must be provided for update");
      });

      it("should reject empty destination", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          destination: "   ",
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("Destination cannot be empty");
      });

      it("should reject when end_date is before start_date", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          start_date: "2025-06-05",
          end_date: "2025-06-01",
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("End date must be on or after start date");
      });

      it("should reject people_count less than 1", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          people_count: 0,
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("People count must be a positive integer (>= 1)");
      });

      it("should reject non-integer people_count", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          people_count: 2.5,
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("People count must be a positive integer (>= 1)");
      });

      it("should reject empty budget_type", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          budget_type: "   ",
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("Budget type cannot be empty");
      });

      it("should reject plan_details without days", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          plan_details: { days: [] } as PlanDetailsDto,
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("Plan details must contain at least one day");
      });

      it("should reject plan_details with day that has no activities", async () => {
        const command: UpdatePlanCommand = {
          id: "plan-1",
          user_id: "user-123",
          plan_details: {
            days: [
              {
                day: 1,
                date: "2025-06-01",
                activities: [],
              },
            ],
          },
        };

        await expect(service.updateTripPlan(command)).rejects.toThrow(ValidationError);
        await expect(service.updateTripPlan(command)).rejects.toThrow("Day 1 must have at least one activity");
      });
    });

    it("should return null when trip plan not found", async () => {
      const command: UpdatePlanCommand = {
        id: "non-existent",
        user_id: "user-123",
        destination: "New Destination",
      };

      (mockSupabase.single as any).mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows returned" },
      });

      const result = await service.updateTripPlan(command);

      expect(result).toBeNull();
    });

    it("should return null when database update operation fails with PGRST116", async () => {
      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        destination: "Updated",
      };

      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "PGRST116", message: "No rows returned" },
        });

      const result = await service.updateTripPlan(command);

      expect(result).toBeNull();
    });

    it("should throw error when database update fails with non-PGRST116 error", async () => {
      const command: UpdatePlanCommand = {
        id: "plan-1",
        user_id: "user-123",
        destination: "Updated",
      };

      (mockSupabase.single as any)
        .mockResolvedValueOnce({
          data: { source: "ai", plan_details: mockPlanDetails },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { code: "DB_ERROR", message: "Database connection failed" },
        });

      await expect(service.updateTripPlan(command)).rejects.toThrow();
    });
  });
});
