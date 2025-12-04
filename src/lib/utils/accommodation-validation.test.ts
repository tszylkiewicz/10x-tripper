/**
 * Unit tests for accommodation validation utilities
 */

import { describe, it, expect } from "vitest";
import {
  validateAccommodation,
  validateAccommodationRequired,
  isAccommodationValid,
  isValidUrl,
  validateDateRange,
} from "./accommodation-validation";
import type { AccommodationDto } from "../../types";

// Helper to create mock accommodation
function createMockAccommodation(overrides?: Partial<AccommodationDto>): AccommodationDto {
  return {
    name: "Hotel Marriott",
    address: "Main Street 123",
    check_in: "2025-06-01",
    check_out: "2025-06-03",
    ...overrides,
  };
}

describe("isValidUrl", () => {
  it("should accept valid HTTP URL", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("should accept valid HTTPS URL", () => {
    expect(isValidUrl("https://booking.com/hotel")).toBe(true);
  });

  it("should reject invalid URL", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("should accept URL with query parameters", () => {
    expect(isValidUrl("https://example.com?param=value")).toBe(true);
  });

  it("should accept URL with port", () => {
    expect(isValidUrl("http://localhost:3000")).toBe(true);
  });
});

describe("validateAccommodation", () => {
  describe("name validation", () => {
    it("should require name field", () => {
      const accommodation = createMockAccommodation({ name: "" });
      const errors = validateAccommodation(accommodation);
      expect(errors.name).toBe("Nazwa zakwaterowania jest wymagana");
    });

    it("should reject name with only whitespace", () => {
      const accommodation = createMockAccommodation({ name: "   " });
      const errors = validateAccommodation(accommodation);
      expect(errors.name).toBe("Nazwa zakwaterowania jest wymagana");
    });

    it("should accept valid name", () => {
      const accommodation = createMockAccommodation({ name: "Grand Hotel" });
      const errors = validateAccommodation(accommodation);
      expect(errors.name).toBeUndefined();
    });
  });

  describe("address validation", () => {
    it("should require address field", () => {
      const accommodation = createMockAccommodation({ address: "" });
      const errors = validateAccommodation(accommodation);
      expect(errors.address).toBe("Adres jest wymagany");
    });

    it("should reject address with only whitespace", () => {
      const accommodation = createMockAccommodation({ address: "   " });
      const errors = validateAccommodation(accommodation);
      expect(errors.address).toBe("Adres jest wymagany");
    });

    it("should accept valid address", () => {
      const accommodation = createMockAccommodation({ address: "123 Main St, Warsaw" });
      const errors = validateAccommodation(accommodation);
      expect(errors.address).toBeUndefined();
    });
  });

  describe("check-in validation", () => {
    it("should require check_in field", () => {
      const accommodation = createMockAccommodation({ check_in: "" });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_in).toBe("Data zameldowania jest wymagana");
    });

    it("should reject check_in with only whitespace", () => {
      const accommodation = createMockAccommodation({ check_in: "   " });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_in).toBe("Data zameldowania jest wymagana");
    });

    it("should accept valid check_in date", () => {
      const accommodation = createMockAccommodation({ check_in: "2025-06-01" });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_in).toBeUndefined();
    });
  });

  describe("check-out validation", () => {
    it("should require check_out field", () => {
      const accommodation = createMockAccommodation({ check_out: "" });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_out).toBe("Data wymeldowania jest wymagana");
    });

    it("should reject check_out before check_in", () => {
      const accommodation = createMockAccommodation({
        check_in: "2025-06-03",
        check_out: "2025-06-01",
      });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_out).toBe("Data wymeldowania musi być >= data zameldowania");
    });

    it("should accept check_out equal to check_in", () => {
      const accommodation = createMockAccommodation({
        check_in: "2025-06-01",
        check_out: "2025-06-01",
      });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_out).toBeUndefined();
    });

    it("should accept check_out after check_in", () => {
      const accommodation = createMockAccommodation({
        check_in: "2025-06-01",
        check_out: "2025-06-05",
      });
      const errors = validateAccommodation(accommodation);
      expect(errors.check_out).toBeUndefined();
    });
  });

  describe("estimated_cost validation", () => {
    it("should reject negative cost", () => {
      const accommodation = createMockAccommodation({ estimated_cost: -100 });
      const errors = validateAccommodation(accommodation);
      expect(errors.estimated_cost).toBe("Koszt musi być >= 0");
    });

    it("should accept zero cost", () => {
      const accommodation = createMockAccommodation({ estimated_cost: 0 });
      const errors = validateAccommodation(accommodation);
      expect(errors.estimated_cost).toBeUndefined();
    });

    it("should accept positive cost", () => {
      const accommodation = createMockAccommodation({ estimated_cost: 500 });
      const errors = validateAccommodation(accommodation);
      expect(errors.estimated_cost).toBeUndefined();
    });

    it("should accept undefined cost", () => {
      const accommodation = createMockAccommodation({ estimated_cost: undefined });
      const errors = validateAccommodation(accommodation);
      expect(errors.estimated_cost).toBeUndefined();
    });

    it("should accept decimal cost", () => {
      const accommodation = createMockAccommodation({ estimated_cost: 299.99 });
      const errors = validateAccommodation(accommodation);
      expect(errors.estimated_cost).toBeUndefined();
    });
  });

  describe("booking_url validation", () => {
    it("should reject invalid URL", () => {
      const accommodation = createMockAccommodation({ booking_url: "not-a-url" });
      const errors = validateAccommodation(accommodation);
      expect(errors.booking_url).toBe("Nieprawidłowy format URL");
    });

    it("should accept valid URL", () => {
      const accommodation = createMockAccommodation({
        booking_url: "https://booking.com/hotel-123",
      });
      const errors = validateAccommodation(accommodation);
      expect(errors.booking_url).toBeUndefined();
    });

    it("should accept undefined URL", () => {
      const accommodation = createMockAccommodation({ booking_url: undefined });
      const errors = validateAccommodation(accommodation);
      expect(errors.booking_url).toBeUndefined();
    });

    it("should accept empty string URL", () => {
      const accommodation = createMockAccommodation({ booking_url: "" });
      const errors = validateAccommodation(accommodation);
      expect(errors.booking_url).toBeUndefined();
    });
  });

  describe("multiple errors", () => {
    it("should return all validation errors", () => {
      const accommodation = createMockAccommodation({
        name: "",
        address: "",
        check_in: "",
        check_out: "",
      });
      const errors = validateAccommodation(accommodation);

      expect(Object.keys(errors)).toHaveLength(4);
      expect(errors.name).toBeDefined();
      expect(errors.address).toBeDefined();
      expect(errors.check_in).toBeDefined();
      expect(errors.check_out).toBeDefined();
    });

    it("should return empty object for valid accommodation", () => {
      const accommodation = createMockAccommodation();
      const errors = validateAccommodation(accommodation);
      expect(Object.keys(errors)).toHaveLength(0);
    });
  });
});

describe("validateAccommodationRequired", () => {
  it("should validate only required fields", () => {
    const accommodation = createMockAccommodation({
      name: "",
      estimated_cost: -100, // Should NOT trigger error in required-only validation
      booking_url: "invalid-url", // Should NOT trigger error
    });
    const errors = validateAccommodationRequired(accommodation);

    expect(errors.name).toBeDefined();
    expect(errors.estimated_cost).toBeUndefined();
    expect(errors.booking_url).toBeUndefined();
  });

  it("should return empty object when all required fields are present", () => {
    const accommodation = createMockAccommodation();
    const errors = validateAccommodationRequired(accommodation);
    expect(Object.keys(errors)).toHaveLength(0);
  });
});

describe("isAccommodationValid", () => {
  it("should return true for valid accommodation", () => {
    const accommodation = createMockAccommodation();
    expect(isAccommodationValid(accommodation)).toBe(true);
  });

  it("should return false for invalid accommodation", () => {
    const accommodation = createMockAccommodation({ name: "" });
    expect(isAccommodationValid(accommodation)).toBe(false);
  });

  it("should return false when multiple fields are invalid", () => {
    const accommodation = createMockAccommodation({
      name: "",
      address: "",
      estimated_cost: -50,
    });
    expect(isAccommodationValid(accommodation)).toBe(false);
  });
});

describe("validateDateRange", () => {
  it("should return error when check_out is before check_in", () => {
    const error = validateDateRange("2025-06-03", "2025-06-01");
    expect(error).toBe("Data wymeldowania musi być >= data zameldowania");
  });

  it("should return null when check_out equals check_in", () => {
    const error = validateDateRange("2025-06-01", "2025-06-01");
    expect(error).toBeNull();
  });

  it("should return null when check_out is after check_in", () => {
    const error = validateDateRange("2025-06-01", "2025-06-05");
    expect(error).toBeNull();
  });

  it("should return null when check_in is empty", () => {
    const error = validateDateRange("", "2025-06-05");
    expect(error).toBeNull();
  });

  it("should return null when check_out is empty", () => {
    const error = validateDateRange("2025-06-01", "");
    expect(error).toBeNull();
  });

  it("should return null when both dates are empty", () => {
    const error = validateDateRange("", "");
    expect(error).toBeNull();
  });
});
