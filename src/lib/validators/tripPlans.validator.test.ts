/**
 * Tests for trip plan validators
 * Focus on 30-day limit validation
 */

import { describe, it, expect } from "vitest";
import { acceptTripPlanSchema, generateTripPlanSchema, updateTripPlanSchema } from "./tripPlans.validator";
import { MAX_DAYS_PER_PLAN } from "../utils/trip-plan-constants";

describe("generateTripPlanSchema - 30-day validation", () => {
  const validBaseData = {
    destination: "Paris",
    start_date: "2026-03-01",
    end_date: "2026-03-05",
    people_count: 2,
    budget_type: "medium",
  };

  it("should accept trip with exactly 30 days", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-30", // 30 days
    };

    expect(() => generateTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should accept trip with less than 30 days", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-15", // 15 days
    };

    expect(() => generateTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should reject trip with 31 days", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-31", // 31 days
    };

    expect(() => generateTripPlanSchema.parse(data)).toThrow(`Trip duration cannot exceed ${MAX_DAYS_PER_PLAN} days`);
  });

  it("should reject trip with more than 31 days", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-04-15", // 46 days
    };

    expect(() => generateTripPlanSchema.parse(data)).toThrow(`Trip duration cannot exceed ${MAX_DAYS_PER_PLAN} days`);
  });

  it("should accept single-day trip", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-01", // 1 day
    };

    expect(() => generateTripPlanSchema.parse(data)).not.toThrow();
  });
});

describe("acceptTripPlanSchema - 30-day validation", () => {
  const validBaseData = {
    destination: "Paris",
    start_date: "2026-03-01",
    end_date: "2026-03-05",
    people_count: 2,
    budget_type: "medium",
    source: "ai" as const,
    plan_details: {
      days: [
        {
          day: 1,
          date: "2026-03-01",
          activities: [
            {
              time: "09:00",
              title: "Test Activity",
              description: "Test Description",
              location: "Test Location",
            },
          ],
        },
      ],
    },
  };

  it("should accept plan with exactly 30 days in date range", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-30", // 30 days
    };

    expect(() => acceptTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should reject plan with 31 days in date range", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-31", // 31 days
    };

    expect(() => acceptTripPlanSchema.parse(data)).toThrow(`Trip duration cannot exceed ${MAX_DAYS_PER_PLAN} days`);
  });

  it("should reject plan with more than 30 days in plan_details", () => {
    const days = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      activities: [
        {
          time: "09:00",
          title: "Test Activity",
          description: "Test Description",
          location: "Test Location",
        },
      ],
    }));

    const data = {
      ...validBaseData,
      plan_details: { days },
    };

    expect(() => acceptTripPlanSchema.parse(data)).toThrow(`Plan cannot exceed ${MAX_DAYS_PER_PLAN} days`);
  });

  it("should accept plan with exactly 30 days in plan_details", () => {
    const days = Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      activities: [
        {
          time: "09:00",
          title: "Test Activity",
          description: "Test Description",
          location: "Test Location",
        },
      ],
    }));

    const data = {
      ...validBaseData,
      start_date: "2026-03-01",
      end_date: "2026-03-30",
      plan_details: { days },
    };

    expect(() => acceptTripPlanSchema.parse(data)).not.toThrow();
  });
});

describe("updateTripPlanSchema - 30-day validation", () => {
  it("should accept update with valid date range", () => {
    const data = {
      start_date: "2026-03-01",
      end_date: "2026-03-15", // 15 days
    };

    expect(() => updateTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should accept update with exactly 30 days", () => {
    const data = {
      start_date: "2026-03-01",
      end_date: "2026-03-30", // 30 days
    };

    expect(() => updateTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should reject update with 31 days", () => {
    const data = {
      start_date: "2026-03-01",
      end_date: "2026-03-31", // 31 days
    };

    expect(() => updateTripPlanSchema.parse(data)).toThrow(`Trip duration cannot exceed ${MAX_DAYS_PER_PLAN} days`);
  });

  it("should allow update without dates (partial update)", () => {
    const data = {
      destination: "New Destination",
    };

    expect(() => updateTripPlanSchema.parse(data)).not.toThrow();
  });
});

describe("Edge cases - month and year boundaries", () => {
  const validBaseData = {
    destination: "Paris",
    people_count: 2,
    budget_type: "medium",
  };

  it("should handle 30 days across month boundary", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-02-15",
      end_date: "2026-03-16", // 30 days
    };

    expect(() => generateTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should handle 30 days across year boundary", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-12-15",
      end_date: "2027-01-13", // 30 days
    };

    expect(() => generateTripPlanSchema.parse(data)).not.toThrow();
  });

  it("should reject 31 days across month boundary", () => {
    const data = {
      ...validBaseData,
      start_date: "2026-02-15",
      end_date: "2026-03-17", // 31 days
    };

    expect(() => generateTripPlanSchema.parse(data)).toThrow(`Trip duration cannot exceed ${MAX_DAYS_PER_PLAN} days`);
  });
});
