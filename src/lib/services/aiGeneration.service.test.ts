import type { Mock } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ErrorWithMetadata } from "./aiGeneration.service";
import { buildMessages, generateTripPlan, messagesToPrompt, MODEL } from "./aiGeneration.service";
import type { GeneratePlanCommand, PlanDetailsDto } from "@/types.ts";

// Mock OpenRouterService
vi.mock("./openrouter", () => {
  const mockCompleteStructured = vi.fn();
  const mockGetConfig = vi.fn().mockReturnValue({ model: "openai/o3-mini" });

  return {
    OpenRouterService: class MockOpenRouterService {
      completeStructured = mockCompleteStructured;
      getConfig = mockGetConfig;
    },
    // Export for test access
    getMockCompleteStructured: () => mockCompleteStructured,
  };
});

// Type for mocked module
interface MockedOpenRouterModule {
  getMockCompleteStructured: () => Mock;
}

// Get access to mocks
const { getMockCompleteStructured } = (await import("./openrouter")) as unknown as MockedOpenRouterModule;
const mockCompleteStructured = getMockCompleteStructured();

describe("AI Generation Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("buildMessages", () => {
    it("should build messages with all required fields", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
      };

      const messages = buildMessages(command);

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[0].content).toContain("travel planning assistant");
      expect(messages[0].content).toContain("Polish language");
      expect(messages[1].role).toBe("user");
      expect(messages[1].content).toContain("Paris");
      expect(messages[1].content).toContain("2025-06-01");
      expect(messages[1].content).toContain("2025-06-03");
      expect(messages[1].content).toContain("2");
      expect(messages[1].content).toContain("medium");
    });

    it("should calculate correct trip duration in days", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "London",
        start_date: "2025-06-01",
        end_date: "2025-06-05",
        people_count: 1,
        budget_type: "low",
      };

      const messages = buildMessages(command);

      // Duration: June 1-5 = 5 days
      expect(messages[1].content).toContain("Duration: 5 days");
    });

    it("should handle same-day trip (1 day duration)", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-01",
        people_count: 2,
        budget_type: "medium",
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("Duration: 1 days");
    });

    it("should include transport preference when provided", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Berlin",
        start_date: "2025-07-01",
        end_date: "2025-07-03",
        people_count: 2,
        budget_type: "high",
        notes: {
          transport: "public transport only",
        },
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("User Preferences:");
      expect(messages[1].content).toContain("Transport: public transport only");
    });

    it("should include todo preference when provided", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Rome",
        start_date: "2025-08-01",
        end_date: "2025-08-05",
        people_count: 3,
        budget_type: "medium",
        notes: {
          todo: "visit museums, try local cuisine",
        },
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("Things to do: visit museums, try local cuisine");
    });

    it("should include avoid preference when provided", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Barcelona",
        start_date: "2025-09-01",
        end_date: "2025-09-03",
        people_count: 2,
        budget_type: "low",
        notes: {
          avoid: "crowded tourist spots",
        },
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("Things to avoid: crowded tourist spots");
    });

    it("should include all standard preferences together", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Tokyo",
        start_date: "2025-10-01",
        end_date: "2025-10-07",
        people_count: 2,
        budget_type: "high",
        notes: {
          transport: "trains and walking",
          todo: "temples, ramen shops, anime districts",
          avoid: "expensive hotels",
        },
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("Transport: trains and walking");
      expect(messages[1].content).toContain("Things to do: temples, ramen shops, anime districts");
      expect(messages[1].content).toContain("Things to avoid: expensive hotels");
    });

    it("should include custom dynamic preferences", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "New York",
        start_date: "2025-11-01",
        end_date: "2025-11-05",
        people_count: 4,
        budget_type: "medium",
        notes: {
          dietary_restrictions: "vegetarian",
          accessibility: "wheelchair accessible",
          interests: "art galleries, jazz clubs",
        },
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("dietary_restrictions: vegetarian");
      expect(messages[1].content).toContain("accessibility: wheelchair accessible");
      expect(messages[1].content).toContain("interests: art galleries, jazz clubs");
    });

    it("should not include User Preferences section when notes is undefined", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Madrid",
        start_date: "2025-05-01",
        end_date: "2025-05-03",
        people_count: 2,
        budget_type: "medium",
      };

      const messages = buildMessages(command);

      expect(messages[1].content).not.toContain("User Preferences:");
    });

    it("should include User Preferences section even when notes is empty object", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Vienna",
        start_date: "2025-04-01",
        end_date: "2025-04-03",
        people_count: 2,
        budget_type: "low",
        notes: {},
      };

      const messages = buildMessages(command);

      // Notes object exists, so "User Preferences:" is added
      expect(messages[1].content).toContain("User Preferences:");
    });

    it("should handle multi-line values in notes", () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Prague",
        start_date: "2025-03-01",
        end_date: "2025-03-05",
        people_count: 2,
        budget_type: "medium",
        notes: {
          todo: "Visit Old Town Square\nTry traditional Czech food\nExplore Prague Castle",
        },
      };

      const messages = buildMessages(command);

      expect(messages[1].content).toContain("Visit Old Town Square");
      expect(messages[1].content).toContain("Try traditional Czech food");
      expect(messages[1].content).toContain("Explore Prague Castle");
    });
  });

  describe("messagesToPrompt", () => {
    it("should convert single message to formatted string", () => {
      const messages = [{ role: "user" as const, content: "Hello" }];

      const result = messagesToPrompt(messages);

      expect(result).toBe("[user]: Hello");
    });

    it("should convert multiple messages with proper formatting", () => {
      const messages = [
        { role: "system" as const, content: "You are a helpful assistant" },
        { role: "user" as const, content: "Generate a plan" },
        { role: "assistant" as const, content: "Here is your plan" },
      ];

      const result = messagesToPrompt(messages);

      expect(result).toBe(
        "[system]: You are a helpful assistant\n\n[user]: Generate a plan\n\n[assistant]: Here is your plan",
      );
    });

    it("should handle empty messages array", () => {
      const messages: never[] = [];

      const result = messagesToPrompt(messages);

      expect(result).toBe("");
    });

    it("should handle messages with special characters", () => {
      const messages = [{ role: "user" as const, content: "Plan for 2-3 people, budget: $500-$1000" }];

      const result = messagesToPrompt(messages);

      expect(result).toBe("[user]: Plan for 2-3 people, budget: $500-$1000");
    });

    it("should preserve newlines in message content", () => {
      const messages = [
        {
          role: "user" as const,
          content: "Line 1\nLine 2\nLine 3",
        },
      ];

      const result = messagesToPrompt(messages);

      expect(result).toBe("[user]: Line 1\nLine 2\nLine 3");
    });
  });

  describe("generateTripPlan", () => {
    const mockPlanDetails: PlanDetailsDto = {
      days: [
        {
          day: 1,
          date: "2025-06-01",
          activities: [
            {
              time: "10:00",
              title: "Louvre Museum",
              description: "Visit the world-famous art museum",
              location: "Paris, France",
              estimated_cost: 15,
            },
          ],
        },
      ],
      accommodation: {
        name: "Hotel Paris",
        address: "123 Rue de Rivoli",
        check_in: "2025-06-01",
        check_out: "2025-06-03",
        estimated_cost: 200,
      },
      total_estimated_cost: 500,
      notes: "Great trip!",
    };

    it("should generate trip plan successfully", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Paris",
        start_date: "2025-06-01",
        end_date: "2025-06-03",
        people_count: 2,
        budget_type: "medium",
      };

      mockCompleteStructured.mockResolvedValueOnce(mockPlanDetails);

      const result = await generateTripPlan(command);

      expect(result.destination).toBe("Paris");
      expect(result.start_date).toBe("2025-06-01");
      expect(result.end_date).toBe("2025-06-03");
      expect(result.people_count).toBe(2);
      expect(result.budget_type).toBe("medium");
      expect(result.plan_details).toEqual(mockPlanDetails);
      expect(result.generation_id).toBe(""); // Set by API route
    });

    it("should call OpenRouter with correct messages", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "London",
        start_date: "2025-07-01",
        end_date: "2025-07-05",
        people_count: 1,
        budget_type: "low",
        notes: {
          transport: "tube only",
        },
      };

      mockCompleteStructured.mockResolvedValueOnce(mockPlanDetails);

      await generateTripPlan(command);

      expect(mockCompleteStructured).toHaveBeenCalledTimes(1);
      const callArgs = mockCompleteStructured.mock.calls[0][0];

      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe("system");
      expect(callArgs.messages[1].role).toBe("user");
      expect(callArgs.messages[1].content).toContain("London");
      expect(callArgs.messages[1].content).toContain("tube only");
    });

    it("should call OpenRouter with correct schema", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Berlin",
        start_date: "2025-08-01",
        end_date: "2025-08-03",
        people_count: 2,
        budget_type: "medium",
      };

      mockCompleteStructured.mockResolvedValueOnce(mockPlanDetails);

      await generateTripPlan(command);

      const callArgs = mockCompleteStructured.mock.calls[0][0];

      expect(callArgs.schema).toBeDefined();
      expect(callArgs.schema.name).toBe("trip-plan");
      expect(callArgs.schema.schema.type).toBe("object");
      expect(callArgs.schema.schema.properties.days).toBeDefined();
      expect(callArgs.schema.schema.properties.accommodation).toBeDefined();
      expect(callArgs.schema.schema.required).toEqual(["days", "accommodation", "total_estimated_cost", "notes"]);
    });

    it("should call OpenRouter with correct parameters", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Rome",
        start_date: "2025-09-01",
        end_date: "2025-09-05",
        people_count: 3,
        budget_type: "high",
      };

      mockCompleteStructured.mockResolvedValueOnce(mockPlanDetails);

      await generateTripPlan(command);

      const callArgs = mockCompleteStructured.mock.calls[0][0];

      expect(callArgs.temperature).toBe(0.8);
      expect(callArgs.maxTokens).toBe(4000);
      expect(callArgs.validator).toBeDefined();
    });

    it("should include validator function that validates with Zod", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Tokyo",
        start_date: "2025-10-01",
        end_date: "2025-10-03",
        people_count: 2,
        budget_type: "medium",
      };

      mockCompleteStructured.mockResolvedValueOnce(mockPlanDetails);

      await generateTripPlan(command);

      const callArgs = mockCompleteStructured.mock.calls[0][0];
      const validator = callArgs.validator;

      // Test valid data
      expect(() => validator(mockPlanDetails)).not.toThrow();

      // Test invalid data (completely invalid structure)
      expect(() => validator({ invalid: "data" })).toThrow();
    });

    it("should throw error with duration metadata on failure", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Madrid",
        start_date: "2025-05-01",
        end_date: "2025-05-03",
        people_count: 2,
        budget_type: "medium",
      };

      const originalError = new Error("API rate limit exceeded");
      mockCompleteStructured.mockRejectedValueOnce(originalError);

      const startTime = Date.now();
      try {
        await generateTripPlan(command);
        expect.fail("Should have thrown error");
      } catch (error) {
        const endTime = Date.now();
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("API rate limit exceeded");
        expect((error as ErrorWithMetadata).duration_ms).toBeDefined();
        expect((error as ErrorWithMetadata).duration_ms).toBeGreaterThanOrEqual(0);
        expect((error as ErrorWithMetadata).duration_ms).toBeLessThanOrEqual(endTime - startTime + 10); // Allow 10ms margin
      }
    });

    it("should preserve error name in enhanced error", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Vienna",
        start_date: "2025-04-01",
        end_date: "2025-04-03",
        people_count: 2,
        budget_type: "low",
      };

      const originalError = new Error("Timeout");
      originalError.name = "TimeoutError";
      mockCompleteStructured.mockRejectedValueOnce(originalError);

      try {
        await generateTripPlan(command);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect((error as Error).name).toBe("TimeoutError");
      }
    });

    it("should handle non-Error exceptions", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Prague",
        start_date: "2025-03-01",
        end_date: "2025-03-03",
        people_count: 2,
        budget_type: "medium",
      };

      mockCompleteStructured.mockRejectedValueOnce("String error");

      try {
        await generateTripPlan(command);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe("Unknown error");
        expect((error as Error).name).toBe("Error");
        expect((error as ErrorWithMetadata).duration_ms).toBeDefined();
      }
    });

    it("should return result with empty generation_id", async () => {
      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Amsterdam",
        start_date: "2025-06-15",
        end_date: "2025-06-20",
        people_count: 2,
        budget_type: "medium",
      };

      mockCompleteStructured.mockResolvedValueOnce(mockPlanDetails);

      const result = await generateTripPlan(command);

      // generation_id is set by the API route after logging
      expect(result.generation_id).toBe("");
    });

    it("should handle plan with minimal optional fields", async () => {
      const minimalPlanDetails: PlanDetailsDto = {
        days: [
          {
            day: 1,
            date: "2025-06-01",
            activities: [
              {
                time: "10:00",
                title: "Activity",
                description: "Description",
                location: "Location",
              },
            ],
          },
        ],
      };

      const command: GeneratePlanCommand = {
        user_id: "user-123",
        destination: "Minimal City",
        start_date: "2025-06-01",
        end_date: "2025-06-01",
        people_count: 1,
        budget_type: "low",
      };

      mockCompleteStructured.mockResolvedValueOnce(minimalPlanDetails);

      const result = await generateTripPlan(command);

      expect(result.plan_details).toEqual(minimalPlanDetails);
      expect(result.plan_details.accommodation).toBeUndefined();
      expect(result.plan_details.total_estimated_cost).toBeUndefined();
      expect(result.plan_details.notes).toBeUndefined();
    });
  });

  describe("MODEL export", () => {
    it("should export MODEL constant from OpenRouter config", () => {
      expect(MODEL).toBeDefined();
      expect(typeof MODEL).toBe("string");
      expect(MODEL).toBe("openai/o3-mini");
    });
  });
});
