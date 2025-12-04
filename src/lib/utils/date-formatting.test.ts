/**
 * Unit tests for date formatting utilities
 */

import { describe, it, expect } from "vitest";
import { formatDate, formatAccommodationDate, formatDateRange } from "./date-formatting";

describe("formatDate", () => {
  it("should format valid ISO date to Polish locale with weekday", () => {
    const result = formatDate("2025-06-01");
    expect(result).toMatch(/czerwca/i); // Polish genitive case
    expect(result).toMatch(/1/);
  });

  it("should format date with custom options", () => {
    const result = formatDate("2025-06-01", { year: "numeric" });
    expect(result).toMatch(/2025/);
  });

  it("should return original string for invalid date", () => {
    const invalidDate = "invalid-date";
    const result = formatDate(invalidDate);
    expect(result).toBe(invalidDate);
  });

  it("should handle empty string gracefully", () => {
    const result = formatDate("");
    expect(result).toBe("");
  });

  it("should format different months correctly", () => {
    const january = formatDate("2025-01-15");
    expect(january).toMatch(/stycznia/i);

    const december = formatDate("2025-12-25");
    expect(december).toMatch(/grudnia/i);
  });

  it("should include weekday in default format", () => {
    // 2025-06-02 is Monday
    const result = formatDate("2025-06-02");
    expect(result).toMatch(/poniedziałek/i);
  });
});

describe("formatAccommodationDate", () => {
  it("should format date without weekday", () => {
    const result = formatAccommodationDate("2025-06-01");
    expect(result).toMatch(/czerwca 2025/i);
    expect(result).toMatch(/1/);
  });

  it("should include year in format", () => {
    const result = formatAccommodationDate("2025-06-15");
    expect(result).toMatch(/2025/);
  });

  it("should handle invalid date gracefully", () => {
    const invalidDate = "not-a-date";
    const result = formatAccommodationDate(invalidDate);
    expect(result).toBe(invalidDate);
  });
});

describe("formatDateRange", () => {
  it("should format date range with separator", () => {
    const result = formatDateRange("2025-06-01", "2025-06-03");
    expect(result).toContain("-");
    expect(result).toMatch(/czerwca 2025/i);
  });

  it("should handle same start and end dates", () => {
    const result = formatDateRange("2025-06-01", "2025-06-01");
    expect(result).toContain("1 czerwca 2025");
  });

  it("should handle dates in different months", () => {
    const result = formatDateRange("2025-06-01", "2025-07-01");
    expect(result).toMatch(/czerwca/i);
    expect(result).toMatch(/lipca/i);
  });

  it("should handle dates in different years", () => {
    const result = formatDateRange("2025-12-25", "2026-01-05");
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/2026/);
  });

  it("should handle invalid dates gracefully", () => {
    const result = formatDateRange("invalid", "2025-06-01");
    expect(result).toContain("invalid");
  });
});
