import { useState, useEffect, useCallback } from "react";
import type { TripPlanDto, ApiSuccessResponse } from "../../types";

// Toggle this to use mock data for testing
const USE_MOCK_DATA = true;

const MOCK_PLANS: TripPlanDto[] = [
  {
    id: "mock-1",
    destination: "Kraków, Polska",
    start_date: "2025-06-15",
    end_date: "2025-06-18",
    people_count: 2,
    budget_type: "medium",
    plan_details: {
      days: [
        {
          date: "2025-06-15",
          activities: [
            { time: "10:00", title: "Wawel", description: "Zwiedzanie zamku" },
            { time: "14:00", title: "Sukiennice", description: "Zakupy pamiątek" },
          ],
        },
        {
          date: "2025-06-16",
          activities: [{ time: "09:00", title: "Kazimierz", description: "Spacer po dzielnicy" }],
        },
      ],
    },
  },
  {
    id: "mock-2",
    destination: "Barcelona, Hiszpania",
    start_date: "2025-07-01",
    end_date: "2025-07-07",
    people_count: 4,
    budget_type: "high",
    plan_details: {
      days: [
        {
          date: "2025-07-01",
          activities: [
            { time: "11:00", title: "Sagrada Familia", description: "Wizyta w bazylice" },
            { time: "15:00", title: "Park Güell", description: "Spacer po parku" },
            { time: "20:00", title: "La Rambla", description: "Kolacja i spacer" },
          ],
        },
      ],
    },
  },
  {
    id: "mock-3",
    destination: "Zakopane, Polska",
    start_date: "2025-08-10",
    end_date: "2025-08-12",
    people_count: 1,
    budget_type: "low",
    plan_details: {
      days: [
        {
          date: "2025-08-10",
          activities: [{ time: "08:00", title: "Morskie Oko", description: "Wycieczka nad jezioro" }],
        },
        {
          date: "2025-08-11",
          activities: [
            { time: "09:00", title: "Krupówki", description: "Zakupy i oscypki" },
            { time: "14:00", title: "Gubałówka", description: "Kolejka na szczyt" },
          ],
        },
      ],
    },
  },
];

/**
 * State interface for the trip plans list
 */
interface UseTripPlansState {
  plans: TripPlanDto[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Return type for the useTripPlans hook
 */
interface UseTripPlansReturn extends UseTripPlansState {
  deletePlan: (planId: string) => Promise<boolean>;
  refetch: () => void;
}

/**
 * Custom hook for managing trip plans state and operations
 *
 * Handles fetching, deleting, and refreshing trip plans from the API.
 * Provides loading and error states for UI feedback.
 *
 * @returns Object containing plans array, loading/error states, and mutation functions
 */
export function useTripPlans(): UseTripPlansReturn {
  const [plans, setPlans] = useState<TripPlanDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches trip plans from the API (or uses mock data if enabled)
   */
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Use mock data for testing
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate loading
      setPlans(MOCK_PLANS);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/trip-plans");

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        throw new Error("Nie udało się pobrać planów");
      }

      const data: ApiSuccessResponse<TripPlanDto[]> = await response.json();
      setPlans(data.data);
    } catch (err) {
      if (err instanceof Error && err.message.includes("fetch")) {
        setError("Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.");
      } else {
        setError(err instanceof Error ? err.message : "Wystąpił nieoczekiwany błąd");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Deletes a trip plan (soft delete)
   * Performs optimistic update - removes plan from local state immediately
   *
   * @param planId - ID of the plan to delete
   * @returns true if deletion was successful, false otherwise
   */
  const deletePlan = useCallback(async (planId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/trip-plans/${planId}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return false;
      }

      if (response.status === 404) {
        // Plan already deleted - remove from local state
        setPlans((prev) => prev.filter((plan) => plan.id !== planId));
        return true;
      }

      if (!response.ok) {
        throw new Error("Nie udało się usunąć planu");
      }

      // Optimistic update - remove plan from local state
      setPlans((prev) => prev.filter((plan) => plan.id !== planId));

      return true;
    } catch (err) {
      console.error("Error deleting plan:", err);
      return false;
    }
  }, []);

  /**
   * Refreshes the trip plans list
   */
  const refetch = useCallback(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    isLoading,
    error,
    deletePlan,
    refetch,
  };
}
