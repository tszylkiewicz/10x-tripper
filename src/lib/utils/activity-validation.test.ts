/**
 * Unit tests for activity validation utilities
 */

import { describe, it, expect } from "vitest";
import {
  validateActivity,
  validateActivityRequired,
  isActivityValid,
  type ValidationErrors,
} from "./activity-validation";
import type { ActivityDto } from "../../types";

// Helper to create mock activity
function createMockActivity(overrides?: Partial<ActivityDto>): ActivityDto {
  return {
    time: "10:00",
    title: "Museum Visit",
    description: "Visit the museum",
    location: "Downtown",
    ...overrides,
  };
}

describe("validateActivity", () => {
  describe("time validation", () => {
    it("should require time field", () => {
      const activity = createMockActivity({ time: "" });
      const errors = validateActivity(activity);
      expect(errors.time).toBe("Godzina jest wymagana");
    });

    it("should reject time with only whitespace", () => {
      const activity = createMockActivity({ time: "   " });
      const errors = validateActivity(activity);
      expect(errors.time).toBe("Godzina jest wymagana");
    });

    it("should validate time format HH:MM", () => {
      const activity = createMockActivity({ time: "2599" }); // Invalid format - no colon
      const errors = validateActivity(activity);
      expect(errors.time).toBe("Nieprawidłowy format (HH:MM)");
    });

    it("should accept valid time format", () => {
      const activity = createMockActivity({ time: "14:30" });
      const errors = validateActivity(activity);
      expect(errors.time).toBeUndefined();
    });

    it("should accept edge case times 00:00 and 23:59", () => {
      const activity1 = createMockActivity({ time: "00:00" });
      const errors1 = validateActivity(activity1);
      expect(errors1.time).toBeUndefined();

      const activity2 = createMockActivity({ time: "23:59" });
      const errors2 = validateActivity(activity2);
      expect(errors2.time).toBeUndefined();
    });

    it("should reject time without colon", () => {
      const activity = createMockActivity({ time: "1030" });
      const errors = validateActivity(activity);
      expect(errors.time).toBe("Nieprawidłowy format (HH:MM)");
    });
  });

  describe("title validation", () => {
    it("should require title field", () => {
      const activity = createMockActivity({ title: "" });
      const errors = validateActivity(activity);
      expect(errors.title).toBe("Tytuł jest wymagany");
    });

    it("should reject title with only whitespace", () => {
      const activity = createMockActivity({ title: "   " });
      const errors = validateActivity(activity);
      expect(errors.title).toBe("Tytuł jest wymagany");
    });

    it("should enforce max length of 200 characters", () => {
      const activity = createMockActivity({ title: "A".repeat(201) });
      const errors = validateActivity(activity);
      expect(errors.title).toBe("Tytuł może mieć max 200 znaków");
    });

    it("should accept title at exactly 200 characters", () => {
      const activity = createMockActivity({ title: "A".repeat(200) });
      const errors = validateActivity(activity);
      expect(errors.title).toBeUndefined();
    });

    it("should accept title with special characters", () => {
      const activity = createMockActivity({ title: "Café & Bäckerei <special>" });
      const errors = validateActivity(activity);
      expect(errors.title).toBeUndefined();
    });
  });

  describe("description validation", () => {
    it("should require description field", () => {
      const activity = createMockActivity({ description: "" });
      const errors = validateActivity(activity);
      expect(errors.description).toBe("Opis jest wymagany");
    });

    it("should reject description with only whitespace", () => {
      const activity = createMockActivity({ description: "   " });
      const errors = validateActivity(activity);
      expect(errors.description).toBe("Opis jest wymagany");
    });

    it("should accept valid description", () => {
      const activity = createMockActivity({ description: "Valid description" });
      const errors = validateActivity(activity);
      expect(errors.description).toBeUndefined();
    });
  });

  describe("location validation", () => {
    it("should require location field", () => {
      const activity = createMockActivity({ location: "" });
      const errors = validateActivity(activity);
      expect(errors.location).toBe("Lokalizacja jest wymagana");
    });

    it("should reject location with only whitespace", () => {
      const activity = createMockActivity({ location: "   " });
      const errors = validateActivity(activity);
      expect(errors.location).toBe("Lokalizacja jest wymagana");
    });

    it("should accept valid location", () => {
      const activity = createMockActivity({ location: "Main Street 123" });
      const errors = validateActivity(activity);
      expect(errors.location).toBeUndefined();
    });
  });

  describe("estimated_cost validation", () => {
    it("should reject negative cost", () => {
      const activity = createMockActivity({ estimated_cost: -10 });
      const errors = validateActivity(activity);
      expect(errors.estimated_cost).toBe("Koszt musi być >= 0");
    });

    it("should accept zero cost", () => {
      const activity = createMockActivity({ estimated_cost: 0 });
      const errors = validateActivity(activity);
      expect(errors.estimated_cost).toBeUndefined();
    });

    it("should accept positive cost", () => {
      const activity = createMockActivity({ estimated_cost: 50 });
      const errors = validateActivity(activity);
      expect(errors.estimated_cost).toBeUndefined();
    });

    it("should accept undefined cost", () => {
      const activity = createMockActivity({ estimated_cost: undefined });
      const errors = validateActivity(activity);
      expect(errors.estimated_cost).toBeUndefined();
    });

    it("should accept decimal cost", () => {
      const activity = createMockActivity({ estimated_cost: 49.99 });
      const errors = validateActivity(activity);
      expect(errors.estimated_cost).toBeUndefined();
    });
  });

  describe("multiple errors", () => {
    it("should return all validation errors", () => {
      const activity = createMockActivity({
        time: "",
        title: "",
        description: "",
        location: "",
      });
      const errors = validateActivity(activity);

      expect(Object.keys(errors)).toHaveLength(4);
      expect(errors.time).toBeDefined();
      expect(errors.title).toBeDefined();
      expect(errors.description).toBeDefined();
      expect(errors.location).toBeDefined();
    });

    it("should return empty object for valid activity", () => {
      const activity = createMockActivity();
      const errors = validateActivity(activity);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

describe("validateActivityRequired", () => {
  it("should validate only required fields", () => {
    const activity = createMockActivity({
      time: "",
      title: "",
      estimated_cost: -10, // This should NOT trigger error in required-only validation
    });
    const errors = validateActivityRequired(activity);

    expect(errors.time).toBeDefined();
    expect(errors.title).toBeDefined();
    expect(errors.estimated_cost).toBeUndefined(); // Optional field not validated
  });

  it("should return empty object when all required fields are present", () => {
    const activity = createMockActivity();
    const errors = validateActivityRequired(activity);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe("isActivityValid", () => {
  it("should return true for valid activity", () => {
    const activity = createMockActivity();
    expect(isActivityValid(activity)).toBe(true);
  });

  it("should return false for invalid activity", () => {
    const activity = createMockActivity({ title: "" });
    expect(isActivityValid(activity)).toBe(false);
  });

  it("should return false when multiple fields are invalid", () => {
    const activity = createMockActivity({
      time: "",
      title: "",
      estimated_cost: -5,
    });
    expect(isActivityValid(activity)).toBe(false);
  });
});
