/**
 * usePreferencesData Hook
 *
 * Hook odpowiedzialny za operacje CRUD na preferencjach użytkownika.
 * Zarządza stanem danych i komunikacją z API.
 */

import { useState, useEffect } from "react";
import type { PreferencesDataState } from "../types";
import type {
  UserPreferenceDto,
  CreateUserPreferenceDto,
  UpdateUserPreferenceDto,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "../../types";

/**
 * Hook do zarządzania danymi preferencji (CRUD operations)
 */
export function usePreferencesData() {
  const [state, setState] = useState<PreferencesDataState>({
    preferences: [],
    isLoading: true,
    isSubmitting: false,
    isDeleting: false,
    error: null,
  });

  /**
   * Pobiera wszystkie preferencje użytkownika
   */
  const fetchPreferences = async (): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch("/api/user/preferences", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Przekierowanie do logowania
          window.location.href = "/login";
          return;
        }
        throw new Error("Nie udało się pobrać preferencji");
      }

      const result: ApiSuccessResponse<UserPreferenceDto[]> = await response.json();
      setState((prev) => ({ ...prev, preferences: result.data, isLoading: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Nie udało się pobrać preferencji. Spróbuj ponownie.",
      }));
    }
  };

  /**
   * Tworzy nową preferencję
   */
  const createPreference = async (data: CreateUserPreferenceDto): Promise<void> => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 400) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error.message);
        }

        throw new Error("Nie udało się utworzyć preferencji");
      }

      const result: ApiSuccessResponse<UserPreferenceDto> = await response.json();

      // Dodanie nowej preferencji do listy
      setState((prev) => ({
        ...prev,
        preferences: [...prev.preferences, result.data],
        isSubmitting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Wystąpił błąd podczas tworzenia preferencji",
      }));
      throw error;
    }
  };

  /**
   * Aktualizuje istniejącą preferencję
   */
  const updatePreference = async (id: string, data: UpdateUserPreferenceDto): Promise<void> => {
    setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await fetch(`/api/user/preferences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          throw new Error("Preferencja nie została znaleziona");
        }

        if (response.status === 400) {
          const errorData: ApiErrorResponse = await response.json();
          throw new Error(errorData.error.message);
        }

        throw new Error("Nie udało się zaktualizować preferencji");
      }

      const result: ApiSuccessResponse<UserPreferenceDto> = await response.json();

      // Aktualizacja preferencji na liście
      setState((prev) => ({
        ...prev,
        preferences: prev.preferences.map((p) => (p.id === id ? result.data : p)),
        isSubmitting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSubmitting: false,
        error: error instanceof Error ? error.message : "Wystąpił błąd podczas aktualizacji preferencji",
      }));
      throw error;
    }
  };

  /**
   * Usuwa preferencję
   */
  const deletePreference = async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, isDeleting: true, error: null }));

    try {
      const response = await fetch(`/api/user/preferences/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 404) {
          throw new Error("Preferencja nie została znaleziona");
        }

        throw new Error("Nie udało się usunąć preferencji");
      }

      // Usunięcie preferencji z listy
      setState((prev) => ({
        ...prev,
        preferences: prev.preferences.filter((p) => p.id !== id),
        isDeleting: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        error: error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania preferencji",
      }));
      throw error;
    }
  };

  /**
   * Czyści komunikat błędu
   */
  const clearError = (): void => {
    setState((prev) => ({ ...prev, error: null }));
  };

  // Pobierz preferencje przy pierwszym renderowaniu
  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    ...state,
    fetchPreferences,
    createPreference,
    updatePreference,
    deletePreference,
    clearError,
  };
}
