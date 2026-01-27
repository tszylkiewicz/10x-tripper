/**
 * Tests for usePlanEditor hook
 * Focus on ADD_DAY logic with conditional end_date extension and 30-day limit
 */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { usePlanEditor } from "./usePlanEditor";
import type { GeneratedTripPlanDto } from "../../../../types";

describe("usePlanEditor - ADD_DAY logic", () => {
  const baseActivity = {
    time: "09:00",
    title: "Test Activity",
    description: "Test Description",
    location: "Test Location",
  };

  const createBasePlan = (startDate: string, endDate: string, dayCount: number): GeneratedTripPlanDto => ({
    generation_id: "test-id",
    destination: "Paris",
    start_date: startDate,
    end_date: endDate,
    people_count: 2,
    budget_type: "medium",
    plan_details: {
      days: Array.from({ length: dayCount }, (_, i) => ({
        day: i + 1,
        date: new Date(new Date(startDate).getTime() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        activities: [baseActivity],
      })),
    },
  });

  it("should add day without extending end_date when within date range", () => {
    // Setup: 5-day plan (1-5 Feb) with date range 1-6 Feb (6 days available)
    const plan = createBasePlan("2026-02-01", "2026-02-06", 5);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Add day 6 - should fit within existing date range
    const newDay = {
      day: 6,
      date: "2026-02-06",
      activities: [baseActivity],
    };

    act(() => {
      result.current.updatePlan({ type: "ADD_DAY", day: newDay });
    });

    // Assertions
    expect(result.current.editablePlan).not.toBeNull();
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(6);
    expect(result.current.editablePlan?.end_date).toBe("2026-02-06"); // Unchanged
    expect(result.current.isEdited).toBe(true);
  });

  it("should extend end_date when new day count exceeds date range", () => {
    // Setup: 6-day plan (1-6 Feb) with date range 1-6 Feb (6 days)
    const plan = createBasePlan("2026-02-01", "2026-02-06", 6);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Add day 7 - should extend end_date to 2026-02-07
    const newDay = {
      day: 7,
      date: "2026-02-07",
      activities: [baseActivity],
    };

    act(() => {
      result.current.updatePlan({ type: "ADD_DAY", day: newDay });
    });

    // Assertions
    expect(result.current.editablePlan).not.toBeNull();
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(7);
    expect(result.current.editablePlan?.end_date).toBe("2026-02-07"); // Extended by 1 day
    expect(result.current.isEdited).toBe(true);
  });

  it("should extend end_date by multiple days if needed", () => {
    // Setup: 5-day plan (1-5 Feb) with date range 1-6 Feb (6 days available)
    const plan = createBasePlan("2026-02-01", "2026-02-06", 5);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Add day 6 (fits within range)
    act(() => {
      result.current.updatePlan({
        type: "ADD_DAY",
        day: { day: 6, date: "2026-02-06", activities: [baseActivity] },
      });
    });

    // Add day 7 (needs to extend end_date)
    act(() => {
      result.current.updatePlan({
        type: "ADD_DAY",
        day: { day: 7, date: "2026-02-07", activities: [baseActivity] },
      });
    });

    // Assertions
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(7);
    expect(result.current.editablePlan?.end_date).toBe("2026-02-07");
  });

  it("should block adding day 31 (exceeds 30-day limit)", () => {
    // Setup: 30-day plan at the limit
    const plan = createBasePlan("2026-02-01", "2026-03-02", 30);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Try to add day 31 - should be blocked
    const newDay = {
      day: 31,
      date: "2026-03-03",
      activities: [baseActivity],
    };

    act(() => {
      result.current.updatePlan({ type: "ADD_DAY", day: newDay });
    });

    // Assertions
    expect(result.current.editablePlan).not.toBeNull();
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(30); // Still 30
    expect(result.current.editablePlan?.end_date).toBe("2026-03-02"); // Unchanged
    expect(result.current.isEdited).toBe(false); // No edit happened
  });

  it("should block adding day when already at 30-day date range", () => {
    // Setup: 29-day plan with 30-day date range (1 free day)
    const plan = createBasePlan("2026-02-01", "2026-03-02", 29);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Add day 30 - should fit within existing date range
    act(() => {
      result.current.updatePlan({
        type: "ADD_DAY",
        day: { day: 30, date: "2026-03-02", activities: [baseActivity] },
      });
    });

    expect(result.current.editablePlan?.plan_details.days).toHaveLength(30);
    expect(result.current.editablePlan?.end_date).toBe("2026-03-02");

    act(() => {
      result.current.updatePlan({
        type: "ADD_DAY",
        day: { day: 31, date: "2026-03-03", activities: [baseActivity] },
      });
    });

    expect(result.current.editablePlan?.plan_details.days).toHaveLength(30); // Still 30
    expect(result.current.editablePlan?.end_date).toBe("2026-03-02"); // Unchanged
  });

  it("should handle adding day across month boundary", () => {
    // Setup: 28-day plan (Feb 1 - Feb 28)
    const plan = createBasePlan("2026-02-01", "2026-02-28", 28);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Add day 29 - should extend end_date to March 1
    const newDay = {
      day: 29,
      date: "2026-03-01",
      activities: [baseActivity],
    };

    act(() => {
      result.current.updatePlan({ type: "ADD_DAY", day: newDay });
    });

    // Assertions
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(29);
    expect(result.current.editablePlan?.end_date).toBe("2026-03-01");
  });
});

describe("usePlanEditor - REMOVE_DAY with auto-renumbering", () => {
  const baseActivity = {
    time: "09:00",
    title: "Test Activity",
    description: "Test Description",
    location: "Test Location",
  };

  const createPlanWithDays = (dayCount: number): GeneratedTripPlanDto => ({
    generation_id: "test-id",
    destination: "Paris",
    start_date: "2026-02-01",
    end_date: "2026-02-05",
    people_count: 2,
    budget_type: "medium",
    plan_details: {
      days: Array.from({ length: dayCount }, (_, i) => ({
        day: i + 1,
        date: `2026-02-0${i + 1}`,
        activities: [baseActivity],
      })),
    },
  });

  it("should auto-renumber days after deletion", () => {
    const plan = createPlanWithDays(5);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Remove day 3 (middle day)
    act(() => {
      result.current.updatePlan({ type: "REMOVE_DAY", dayIndex: 2 });
    });

    // Assertions
    expect(result.current.editablePlan).not.toBeNull();
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(4);

    // Verify days are renumbered 1, 2, 3, 4
    const days = result.current.editablePlan?.plan_details.days || [];
    expect(days[0].day).toBe(1);
    expect(days[1].day).toBe(2);
    expect(days[2].day).toBe(3);
    expect(days[3].day).toBe(4);

    expect(result.current.isEdited).toBe(true);
  });

  it("should not modify end_date when removing a day", () => {
    const plan = createPlanWithDays(5);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Remove day 5 (last day)
    act(() => {
      result.current.updatePlan({ type: "REMOVE_DAY", dayIndex: 4 });
    });

    // Assertions
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(4);
    expect(result.current.editablePlan?.end_date).toBe("2026-02-05"); // Unchanged
  });

  it("should handle removing first day", () => {
    const plan = createPlanWithDays(3);

    const { result } = renderHook(() => usePlanEditor(plan));

    // Remove day 1 (first day)
    act(() => {
      result.current.updatePlan({ type: "REMOVE_DAY", dayIndex: 0 });
    });

    // Assertions
    expect(result.current.editablePlan?.plan_details.days).toHaveLength(2);

    // Verify days are renumbered 1, 2 (originally days 2 and 3)
    const days = result.current.editablePlan?.plan_details.days || [];
    expect(days[0].day).toBe(1);
    expect(days[0].date).toBe("2026-02-02"); // Original day 2
    expect(days[1].day).toBe(2);
    expect(days[1].date).toBe("2026-02-03"); // Original day 3
  });
});
