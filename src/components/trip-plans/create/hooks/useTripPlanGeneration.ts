import { useState, useCallback } from "react";
import type {
  GenerateTripPlanRequestDto,
  GeneratedTripPlanDto,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../../../types";
import type { TripPlanFormData } from "../types";

/**
 * Return type for the useTripPlanGeneration hook
 */
interface UseTripPlanGenerationReturn {
  generatePlan: (formData: TripPlanFormData) => Promise<void>;
  isGenerating: boolean;
  generatedPlan: GeneratedTripPlanDto | null;
  error: ApiErrorResponse | null;
  reset: () => void;
}

/**
 * Transforms form data to API request format
 */
function transformFormDataToRequest(formData: TripPlanFormData): GenerateTripPlanRequestDto {
  return {
    destination: formData.destination,
    start_date: formData.start_date,
    end_date: formData.end_date,
    people_count: formData.people_count,
    budget_type: formData.budget_type,
    notes: formData.preferences,
  };
}

/**
 * Custom hook for managing trip plan generation
 *
 * Handles the API call to generate a trip plan using AI,
 * including loading state, error handling, and result management.
 *
 * @returns Object containing generation function, states, and reset function
 */
export function useTripPlanGeneration(): UseTripPlanGenerationReturn {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedTripPlanDto | null>(null);
  const [error, setError] = useState<ApiErrorResponse | null>(null);

  /**
   * Generates a trip plan from form data
   * Calls POST /api/trip-plans/generate endpoint
   *
   * @param formData - The form data from TripPlanForm
   */
  const generatePlan = useCallback(async (formData: TripPlanFormData): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setGeneratedPlan(null);

    const requestData = transformFormDataToRequest(formData);

    try {
      const response = await fetch("/api/trip-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      // Handle specific error codes
      if (response.status === 401) {
        setError({
          error: {
            code: "UNAUTHORIZED",
            message: "Sesja wygasła. Zaloguj się ponownie.",
          },
        });
        // Delay redirect to allow user to see the message
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData as ApiErrorResponse);
        return;
      }

      const result: ApiSuccessResponse<GeneratedTripPlanDto> = await response.json();
      setGeneratedPlan(result.data);
    } catch (err) {
      // Network error handling
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError({
          error: {
            code: "NETWORK_ERROR",
            message: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.",
          },
        });
      } else {
        setError({
          error: {
            code: "UNKNOWN_ERROR",
            message: "Wystąpił nieoczekiwany błąd podczas generowania planu.",
          },
        });
      }
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Resets the generation state to initial values
   * Use when returning to form or starting fresh
   */
  const reset = useCallback(() => {
    setGeneratedPlan(null);
    setError(null);
    setIsGenerating(false);
  }, []);

  return {
    generatePlan,
    isGenerating,
    generatedPlan,
    error,
    reset,
  };
}
