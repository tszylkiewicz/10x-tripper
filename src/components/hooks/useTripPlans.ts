import { useState, useEffect, useCallback } from "react";
import type { TripPlanDto, ApiSuccessResponse } from "../../types";
import { logger } from "@/lib/utils/logger";

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
   * Fetches trip plans from the API
   */
  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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
      logger.error("Error deleting plan:", err);
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
