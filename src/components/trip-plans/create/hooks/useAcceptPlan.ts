import { useState, useCallback } from "react";
import type { AcceptTripPlanDto, TripPlanDto, ApiSuccessResponse, ApiErrorResponse } from "../../../../types";
import type { EditableGeneratedPlan } from "../types";

/**
 * Return type for the useAcceptPlan hook
 */
interface UseAcceptPlanReturn {
  acceptPlan: (plan: EditableGeneratedPlan) => Promise<TripPlanDto | null>;
  isAccepting: boolean;
  error: ApiErrorResponse | null;
  reset: () => void;
}

/**
 * Transforms an editable plan to the API accept request format
 */
function transformToAcceptRequest(plan: EditableGeneratedPlan): AcceptTripPlanDto {
  return {
    generation_id: plan.generation_id,
    destination: plan.destination,
    start_date: plan.start_date,
    end_date: plan.end_date,
    people_count: plan.people_count,
    budget_type: plan.budget_type,
    plan_details: plan.plan_details,
    source: plan.isEdited ? "ai-edited" : "ai",
  };
}

/**
 * Custom hook for accepting and saving a generated trip plan
 *
 * Handles the API call to save the plan to the database,
 * including proper source attribution (ai vs ai-edited).
 *
 * @returns Object containing accept function, loading state, error state, and reset function
 */
export function useAcceptPlan(): UseAcceptPlanReturn {
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  /**
   * Accepts and saves a trip plan to the database
   * Sets source to "ai-edited" if plan was modified, otherwise "ai"
   *
   * @param plan - The editable plan to save
   * @returns The saved TripPlanDto on success, null on failure
   */
  const acceptPlan = useCallback(async (plan: EditableGeneratedPlan): Promise<TripPlanDto | null> => {
    setIsAccepting(true);
    setError(null);

    const requestBody = transformToAcceptRequest(plan);

    try {
      const response = await fetch("/api/trip-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      // Handle specific error codes
      if (response.status === 401) {
        setError({
          error: {
            code: "UNAUTHORIZED",
            message: "Sesja wygasła. Zaloguj się ponownie, aby zapisać plan.",
          },
        });
        // Store plan in localStorage for recovery after login
        try {
          localStorage.setItem("tripper_pending_plan", JSON.stringify(plan));
        } catch {
          // localStorage might be full or unavailable
        }
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData as ApiErrorResponse);
        return null;
      }

      const result: ApiSuccessResponse<TripPlanDto> = await response.json();
      return result.data;
    } catch (err) {
      // Network error handling - save plan locally as backup
      try {
        localStorage.setItem("tripper_pending_plan", JSON.stringify(plan));
      } catch {
        // localStorage might be full or unavailable
      }

      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError({
          error: {
            code: "NETWORK_ERROR",
            message: "Nie udało się połączyć z serwerem. Plan został zapisany lokalnie.",
          },
        });
      } else {
        setError({
          error: {
            code: "UNKNOWN_ERROR",
            message: "Wystąpił nieoczekiwany błąd podczas zapisywania planu.",
          },
        });
      }
      return null;
    } finally {
      setIsAccepting(false);
    }
  }, []);

  /**
   * Resets the error state
   */
  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    acceptPlan,
    isAccepting,
    error,
    reset,
  };
}
