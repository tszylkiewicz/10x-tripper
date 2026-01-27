/**
 * Tests for date calculation utilities
 */

import { describe, expect, it } from "vitest";
import {
  addDays,
  calculateDateRange,
  calculateDayDate,
  getLastDayDate,
  isValidDateRange,
  isWithinMaxDays,
} from "./date-calculations";

describe("calculateDateRange", () => {
  it("should calculate correct range for multi-day period", () => {
    expect(calculateDateRange("2025-02-01", "2025-02-05")).toBe(5);
    expect(calculateDateRange("2025-02-01", "2025-02-10")).toBe(10);
  });

  it("should return 1 for same day (inclusive)", () => {
    expect(calculateDateRange("2025-02-01", "2025-02-01")).toBe(1);
  });

  it("should handle month boundaries", () => {
    expect(calculateDateRange("2025-02-28", "2025-03-02")).toBe(3);
    expect(calculateDateRange("2025-01-30", "2025-02-02")).toBe(4);
  });

  it("should handle year boundaries", () => {
    expect(calculateDateRange("2024-12-30", "2025-01-02")).toBe(4);
  });

  it("should handle leap year February", () => {
    expect(calculateDateRange("2024-02-28", "2024-03-01")).toBe(3); // 2024 is leap year
    expect(calculateDateRange("2025-02-28", "2025-03-01")).toBe(2); // 2025 is not
  });

  it("should calculate exactly 30 days", () => {
    expect(calculateDateRange("2025-02-01", "2025-03-02")).toBe(30);
  });

  it("should calculate exactly 31 days", () => {
    expect(calculateDateRange("2025-02-01", "2025-03-03")).toBe(31);
  });
});

describe("addDays", () => {
  it("should add days correctly", () => {
    expect(addDays("2025-02-01", 5)).toBe("2025-02-06");
    expect(addDays("2025-02-01", 10)).toBe("2025-02-11");
  });

  it("should add 0 days (return same date)", () => {
    expect(addDays("2025-02-01", 0)).toBe("2025-02-01");
  });

  it("should subtract days with negative number", () => {
    expect(addDays("2025-02-05", -3)).toBe("2025-02-02");
    expect(addDays("2025-02-01", -1)).toBe("2025-01-31");
  });

  it("should handle month boundaries when adding", () => {
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(addDays("2025-01-31", 1)).toBe("2025-02-01");
  });

  it("should handle month boundaries when subtracting", () => {
    expect(addDays("2025-03-01", -1)).toBe("2025-02-28");
    expect(addDays("2025-02-01", -1)).toBe("2025-01-31");
  });

  it("should handle year boundaries", () => {
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(addDays("2025-01-01", -1)).toBe("2024-12-31");
  });

  it("should handle leap year February", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29"); // 2024 is leap year
    expect(addDays("2024-02-29", 1)).toBe("2024-03-01");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01"); // 2025 is not leap year
  });

  it("should format single-digit months and days with leading zeros", () => {
    expect(addDays("2025-01-05", 0)).toBe("2025-01-05");
    expect(addDays("2025-12-09", 0)).toBe("2025-12-09");
  });
});

describe("calculateDayDate", () => {
  it("should calculate day 1 as start date", () => {
    expect(calculateDayDate("2025-02-01", 1)).toBe("2025-02-01");
  });

  it("should calculate subsequent days correctly", () => {
    expect(calculateDayDate("2025-02-01", 2)).toBe("2025-02-02");
    expect(calculateDayDate("2025-02-01", 3)).toBe("2025-02-03");
    expect(calculateDayDate("2025-02-01", 5)).toBe("2025-02-05");
  });

  it("should handle month boundaries", () => {
    expect(calculateDayDate("2025-02-28", 2)).toBe("2025-03-01");
    expect(calculateDayDate("2025-01-31", 2)).toBe("2025-02-01");
  });

  it("should handle year boundaries", () => {
    expect(calculateDayDate("2024-12-31", 2)).toBe("2025-01-01");
  });

  it("should calculate day 30 correctly", () => {
    expect(calculateDayDate("2025-02-01", 30)).toBe("2025-03-02");
  });
});

describe("isWithinMaxDays", () => {
  it("should return true when within 30-day default limit", () => {
    expect(isWithinMaxDays("2025-02-01", "2025-02-15")).toBe(true); // 15 days
    expect(isWithinMaxDays("2025-02-01", "2025-03-02")).toBe(true); // 30 days exactly
  });

  it("should return false when exceeding 30-day default limit", () => {
    expect(isWithinMaxDays("2025-02-01", "2025-03-03")).toBe(false); // 31 days
    expect(isWithinMaxDays("2025-02-01", "2025-03-15")).toBe(false); // 43 days
  });

  it("should respect custom max days parameter", () => {
    expect(isWithinMaxDays("2025-02-01", "2025-02-08", 7)).toBe(false); // 8 days, max 7 -> false
    expect(isWithinMaxDays("2025-02-01", "2025-02-07", 7)).toBe(true); // 7 days, max 7 -> true
    expect(isWithinMaxDays("2025-02-01", "2025-02-06", 5)).toBe(false); // 6 days, max 5 -> false
  });

  it("should handle single day (1 day within any limit)", () => {
    expect(isWithinMaxDays("2025-02-01", "2025-02-01", 1)).toBe(true);
  });
});

describe("getLastDayDate", () => {
  it("should get last day date for single day trip", () => {
    expect(getLastDayDate("2025-02-01", 1)).toBe("2025-02-01");
  });

  it("should get last day date for multi-day trip", () => {
    expect(getLastDayDate("2025-02-01", 5)).toBe("2025-02-05");
    expect(getLastDayDate("2025-02-01", 10)).toBe("2025-02-10");
  });

  it("should handle month boundaries", () => {
    expect(getLastDayDate("2025-02-28", 3)).toBe("2025-03-02");
    expect(getLastDayDate("2025-01-30", 5)).toBe("2025-02-03");
  });

  it("should get last day date for 30-day trip", () => {
    expect(getLastDayDate("2025-02-01", 30)).toBe("2025-03-02");
  });
});

describe("isValidDateRange", () => {
  it("should return true when end date is after start date", () => {
    expect(isValidDateRange("2025-02-01", "2025-02-05")).toBe(true);
    expect(isValidDateRange("2025-02-01", "2025-03-01")).toBe(true);
  });

  it("should return true when end date equals start date", () => {
    expect(isValidDateRange("2025-02-01", "2025-02-01")).toBe(true);
  });

  it("should return false when end date is before start date", () => {
    expect(isValidDateRange("2025-02-05", "2025-02-01")).toBe(false);
    expect(isValidDateRange("2025-03-01", "2025-02-01")).toBe(false);
  });

  it("should handle year boundaries", () => {
    expect(isValidDateRange("2024-12-31", "2025-01-01")).toBe(true);
    expect(isValidDateRange("2025-01-01", "2024-12-31")).toBe(false);
  });
});

/**
 * Integration tests - Real-world scenarios from PRD
 */
describe("Integration: Real-world trip planning scenarios", () => {
  it("Scenario: 5-day trip with dates 1-6 Feb (1 free day)", () => {
    const startDate = "2025-02-01";
    const endDate = "2025-02-06";
    const dayCount = 5;

    const dateRange = calculateDateRange(startDate, endDate);
    expect(dateRange).toBe(6); // 6 days available

    const lastDayInPlan = calculateDayDate(startDate, dayCount);
    expect(lastDayInPlan).toBe("2025-02-05"); // Day 5 ends on Feb 5

    expect(dateRange > dayCount).toBe(true); // Room for 1 more day
  });

  it("Scenario: Adding day 6 to 5-day plan (within range, no extend)", () => {
    const startDate = "2025-02-01";
    const endDate = "2025-02-06";
    const newDayCount = 6;

    const dateRange = calculateDateRange(startDate, endDate);
    expect(newDayCount <= dateRange).toBe(true); // Should fit without extending

    const newDayDate = calculateDayDate(startDate, newDayCount);
    expect(newDayDate).toBe("2025-02-06"); // Day 6 on Feb 6
  });

  it("Scenario: Adding day 7 to 6-day plan (exceeds range, needs extend)", () => {
    const startDate = "2025-02-01";
    const endDate = "2025-02-06";
    const newDayCount = 7;

    const dateRange = calculateDateRange(startDate, endDate);
    expect(newDayCount > dateRange).toBe(true); // Exceeds range

    // Need to extend end_date
    const newEndDate = addDays(endDate, 1);
    expect(newEndDate).toBe("2025-02-07");

    const newDateRange = calculateDateRange(startDate, newEndDate);
    expect(newDateRange).toBe(7); // Now fits
  });

  it("Scenario: 30-day trip at the limit", () => {
    const startDate = "2025-02-01";
    const endDate = "2025-03-02";

    const dateRange = calculateDateRange(startDate, endDate);
    expect(dateRange).toBe(30);

    expect(isWithinMaxDays(startDate, endDate, 30)).toBe(true);
  });

  it("Scenario: Trying to add day 31 (blocked)", () => {
    const startDate = "2025-02-01";
    const endDate = "2025-03-02"; // 30 days

    const dateRange = calculateDateRange(startDate, endDate);
    expect(dateRange).toBe(30);

    // If we extend for day 31
    const newEndDate = addDays(endDate, 1);
    const newDateRange = calculateDateRange(startDate, newEndDate);
    expect(newDateRange).toBe(31);

    expect(isWithinMaxDays(startDate, newEndDate, 30)).toBe(false); // Should be blocked
  });

  it("Scenario: Deleting day 4 from 5-day plan (end_date unchanged)", () => {
    const startDate = "2025-02-01";
    const endDate = "2025-02-05";
    const daysAfterDelete = 4;

    const dateRange = calculateDateRange(startDate, endDate);
    expect(dateRange).toBe(5);

    // After deletion, plan has 4 days but date range is still 5
    expect(daysAfterDelete < dateRange).toBe(true); // One free day now
  });
});
