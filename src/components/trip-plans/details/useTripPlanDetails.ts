/**
 * Custom hook for managing trip plan details state
 *
 * Handles fetching, updating, and deleting trip plan data.
 * Uses useReducer for complex state management.
 */

import { useReducer, useEffect, useCallback } from "react";
import type {
  TripPlanDto,
  UpdateTripPlanDto,
  ApiSuccessResponse,
  ApiErrorResponse,
  ActivityDto,
  AccommodationDto,
} from "../../../types";
import type { TripPlanAction, TripPlanViewState, ViewError, TripPlanMetadata } from "./types";
import { initialTripPlanViewState } from "./types";

/**
 * Reducer for trip plan view state
 */
function tripPlanReducer(state: TripPlanViewState, action: TripPlanAction): TripPlanViewState {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, isLoading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        originalPlan: action.payload,
        editedPlan: action.payload,
        error: null,
      };

    case "FETCH_ERROR":
      return { ...state, isLoading: false, error: action.payload };

    case "ENTER_EDIT_MODE":
      return {
        ...state,
        isEditMode: true,
        editedPlan: state.originalPlan ? JSON.parse(JSON.stringify(state.originalPlan)) : null,
      };

    case "EXIT_EDIT_MODE":
      return {
        ...state,
        isEditMode: false,
        editedPlan: state.originalPlan,
      };

    case "UPDATE_EDITED_PLAN":
      return {
        ...state,
        editedPlan: action.payload,
      };

    case "UPDATE_METADATA": {
      if (!state.editedPlan) return state;
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          ...action.payload,
        },
      };
    }

    case "UPDATE_ACTIVITY": {
      if (!state.editedPlan) return state;
      const { dayIndex, activityIndex, activity } = action.payload;
      const newDays = [...state.editedPlan.plan_details.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        activities: newDays[dayIndex].activities.map((act, idx) => (idx === activityIndex ? activity : act)),
      };
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            days: newDays,
          },
        },
      };
    }

    case "DELETE_ACTIVITY": {
      if (!state.editedPlan) return state;
      const { dayIndex, activityIndex } = action.payload;
      const newDays = [...state.editedPlan.plan_details.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        activities: newDays[dayIndex].activities.filter((_, idx) => idx !== activityIndex),
      };
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            days: newDays,
          },
        },
      };
    }

    case "ADD_ACTIVITY": {
      if (!state.editedPlan) return state;
      const { dayIndex, activity } = action.payload;
      const newDays = [...state.editedPlan.plan_details.days];
      newDays[dayIndex] = {
        ...newDays[dayIndex],
        activities: [...newDays[dayIndex].activities, activity],
      };
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            days: newDays,
          },
        },
      };
    }

    case "DELETE_DAY": {
      if (!state.editedPlan) return state;
      const { dayIndex } = action.payload;
      const newDays = state.editedPlan.plan_details.days.filter((_, idx) => idx !== dayIndex);
      // Re-number days
      const renumberedDays = newDays.map((day, idx) => ({ ...day, day: idx + 1 }));
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            days: renumberedDays,
          },
        },
      };
    }

    case "ADD_DAY": {
      if (!state.editedPlan) return state;
      const newDay = {
        day: action.payload.day,
        date: action.payload.date,
        activities: action.payload.activities,
      };
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            days: [...state.editedPlan.plan_details.days, newDay],
          },
        },
      };
    }

    case "UPDATE_ACCOMMODATION": {
      if (!state.editedPlan) return state;
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            accommodation: action.payload,
          },
        },
      };
    }

    case "REMOVE_ACCOMMODATION": {
      if (!state.editedPlan) return state;
      const newPlanDetails = { ...state.editedPlan.plan_details };
      delete newPlanDetails.accommodation;
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: newPlanDetails,
        },
      };
    }

    case "ADD_ACCOMMODATION": {
      if (!state.editedPlan) return state;
      return {
        ...state,
        editedPlan: {
          ...state.editedPlan,
          plan_details: {
            ...state.editedPlan.plan_details,
            accommodation: action.payload,
          },
        },
      };
    }

    case "SAVE_START":
      return { ...state, isSaving: true, error: null };

    case "SAVE_SUCCESS":
      return {
        ...state,
        isSaving: false,
        isEditMode: false,
        originalPlan: action.payload,
        editedPlan: action.payload,
        error: null,
      };

    case "SAVE_ERROR":
      return { ...state, isSaving: false, error: action.payload };

    case "DELETE_START":
      return { ...state, isDeleting: true, error: null };

    case "DELETE_SUCCESS":
      return { ...state, isDeleting: false };

    case "DELETE_ERROR":
      return { ...state, isDeleting: false, error: action.payload };

    case "SHOW_DELETE_DIALOG":
      return { ...state, showDeleteDialog: true };

    case "HIDE_DELETE_DIALOG":
      return { ...state, showDeleteDialog: false };

    default:
      return state;
  }
}

/**
 * Maps HTTP error or network error to ViewError
 */
function mapErrorToViewError(error: unknown, status?: number): ViewError {
  if (status === 404) {
    return {
      type: "not-found",
      message: "Plan wycieczki nie został znaleziony",
    };
  }
  if (status === 401) {
    return {
      type: "unauthorized",
      message: "Brak autoryzacji. Zaloguj się ponownie.",
    };
  }
  if (status === 400) {
    const apiError = error as ApiErrorResponse;
    return {
      type: "validation-error",
      message: apiError?.error?.message || "Błąd walidacji danych",
      details: apiError?.error?.details,
    };
  }
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: "network-error",
      message: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.",
    };
  }
  return {
    type: "server-error",
    message: "Wystąpił błąd serwera. Spróbuj ponownie później.",
  };
}

/**
 * Return type for useTripPlanDetails hook
 */
export interface UseTripPlanDetailsReturn {
  state: TripPlanViewState;
  // Navigation
  enterEditMode: () => void;
  exitEditMode: () => void;
  // Metadata updates
  updateMetadata: (field: keyof TripPlanMetadata, value: string | number) => void;
  // Activity operations
  updateActivity: (dayIndex: number, activityIndex: number, activity: ActivityDto) => void;
  deleteActivity: (dayIndex: number, activityIndex: number) => void;
  addActivity: (dayIndex: number, activity: ActivityDto) => void;
  // Day operations
  deleteDay: (dayIndex: number) => void;
  addDay: (day: number, date: string, activities: ActivityDto[]) => void;
  // Accommodation operations
  updateAccommodation: (accommodation: AccommodationDto) => void;
  removeAccommodation: () => void;
  addAccommodation: (accommodation: AccommodationDto) => void;
  // API operations
  savePlan: () => Promise<boolean>;
  deletePlan: () => Promise<boolean>;
  refetch: () => void;
  // Dialog
  showDeleteDialog: () => void;
  hideDeleteDialog: () => void;
}

/**
 * Custom hook for managing trip plan details
 *
 * @param planId - ID of the trip plan to fetch
 * @returns Object containing state and mutation functions
 */
export function useTripPlanDetails(planId: string): UseTripPlanDetailsReturn {
  const [state, dispatch] = useReducer(tripPlanReducer, initialTripPlanViewState);

  /**
   * Fetches trip plan data from API
   */
  const fetchTripPlan = useCallback(async (id: string) => {
    dispatch({ type: "FETCH_START" });

    try {
      const response = await fetch(`/api/trip-plans/${id}`);

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw { status: response.status, data: errorData };
      }

      const data: ApiSuccessResponse<TripPlanDto> = await response.json();
      dispatch({ type: "FETCH_SUCCESS", payload: data.data });
    } catch (error) {
      const status = (error as { status?: number })?.status;
      dispatch({ type: "FETCH_ERROR", payload: mapErrorToViewError(error, status) });
    }
  }, []);

  /**
   * Saves changes to the trip plan
   */
  const savePlan = useCallback(async (): Promise<boolean> => {
    if (!state.editedPlan) return false;

    dispatch({ type: "SAVE_START" });

    try {
      const updates: UpdateTripPlanDto = {
        destination: state.editedPlan.destination,
        start_date: state.editedPlan.start_date,
        end_date: state.editedPlan.end_date,
        people_count: state.editedPlan.people_count,
        budget_type: state.editedPlan.budget_type,
        plan_details: state.editedPlan.plan_details,
      };

      const response = await fetch(`/api/trip-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return false;
      }

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({
          error: { code: "UNKNOWN", message: "Błąd zapisu" },
        }));
        dispatch({ type: "SAVE_ERROR", payload: mapErrorToViewError(errorData, response.status) });
        return false;
      }

      const data: ApiSuccessResponse<TripPlanDto> = await response.json();
      dispatch({ type: "SAVE_SUCCESS", payload: data.data });
      return true;
    } catch (error) {
      dispatch({ type: "SAVE_ERROR", payload: mapErrorToViewError(error) });
      return false;
    }
  }, [planId, state.editedPlan]);

  /**
   * Deletes the trip plan
   */
  const deletePlan = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "DELETE_START" });

    try {
      const response = await fetch(`/api/trip-plans/${planId}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        window.location.href = "/login";
        return false;
      }

      if (!response.ok && response.status !== 204) {
        const errorData = await response.json().catch(() => null);
        dispatch({ type: "DELETE_ERROR", payload: mapErrorToViewError(errorData, response.status) });
        return false;
      }

      dispatch({ type: "DELETE_SUCCESS" });
      window.location.href = "/";
      return true;
    } catch (error) {
      dispatch({ type: "DELETE_ERROR", payload: mapErrorToViewError(error) });
      return false;
    }
  }, [planId]);

  // Edit mode
  const enterEditMode = useCallback(() => {
    dispatch({ type: "ENTER_EDIT_MODE" });
  }, []);

  const exitEditMode = useCallback(() => {
    dispatch({ type: "EXIT_EDIT_MODE" });
  }, []);

  // Metadata updates
  const updateMetadata = useCallback((field: keyof TripPlanMetadata, value: string | number) => {
    dispatch({ type: "UPDATE_METADATA", payload: { [field]: value } });
  }, []);

  // Activity operations
  const updateActivity = useCallback((dayIndex: number, activityIndex: number, activity: ActivityDto) => {
    dispatch({ type: "UPDATE_ACTIVITY", payload: { dayIndex, activityIndex, activity } });
  }, []);

  const deleteActivity = useCallback((dayIndex: number, activityIndex: number) => {
    dispatch({ type: "DELETE_ACTIVITY", payload: { dayIndex, activityIndex } });
  }, []);

  const addActivity = useCallback((dayIndex: number, activity: ActivityDto) => {
    dispatch({ type: "ADD_ACTIVITY", payload: { dayIndex, activity } });
  }, []);

  // Day operations
  const deleteDay = useCallback((dayIndex: number) => {
    dispatch({ type: "DELETE_DAY", payload: { dayIndex } });
  }, []);

  const addDay = useCallback((day: number, date: string, activities: ActivityDto[]) => {
    dispatch({ type: "ADD_DAY", payload: { day, date, activities } });
  }, []);

  // Accommodation operations
  const updateAccommodation = useCallback((accommodation: AccommodationDto) => {
    dispatch({ type: "UPDATE_ACCOMMODATION", payload: accommodation });
  }, []);

  const removeAccommodation = useCallback(() => {
    dispatch({ type: "REMOVE_ACCOMMODATION" });
  }, []);

  const addAccommodation = useCallback((accommodation: AccommodationDto) => {
    dispatch({ type: "ADD_ACCOMMODATION", payload: accommodation });
  }, []);

  // Dialog
  const showDeleteDialog = useCallback(() => {
    dispatch({ type: "SHOW_DELETE_DIALOG" });
  }, []);

  const hideDeleteDialog = useCallback(() => {
    dispatch({ type: "HIDE_DELETE_DIALOG" });
  }, []);

  // Refetch
  const refetch = useCallback(() => {
    fetchTripPlan(planId);
  }, [fetchTripPlan, planId]);

  // Fetch on mount
  useEffect(() => {
    fetchTripPlan(planId);
  }, [fetchTripPlan, planId]);

  return {
    state,
    enterEditMode,
    exitEditMode,
    updateMetadata,
    updateActivity,
    deleteActivity,
    addActivity,
    deleteDay,
    addDay,
    updateAccommodation,
    removeAccommodation,
    addAccommodation,
    savePlan,
    deletePlan,
    refetch,
    showDeleteDialog,
    hideDeleteDialog,
  };
}
