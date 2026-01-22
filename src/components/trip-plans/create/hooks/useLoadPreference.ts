/**
 * useLoadPreference Hook
 *
 * Hook for loading user preference templates into the trip plan form.
 * Fetches all user preferences and provides a function to load a specific one.
 */

import { useEffect, useState } from "react";
import type { UserPreferenceDto } from "@/types";

interface UseLoadPreferenceReturn {
  preferences: UserPreferenceDto[];
  isLoading: boolean;
  error: string | null;
  loadPreference: (preferenceId: string) => UserPreferenceDto | undefined;
}

/**
 * Hook for loading preferences
 */
export function useLoadPreference(): UseLoadPreferenceReturn {
  const [preferences, setPreferences] = useState<UserPreferenceDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/user/preferences");

        if (!response.ok) {
          throw new Error("Nie udało się pobrać preferencji");
        }

        const data = await response.json();
        setPreferences(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Wystąpił błąd");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  /**
   * Load a specific preference by ID
   * Returns the preference object if found, undefined otherwise
   */
  const loadPreference = (preferenceId: string): UserPreferenceDto | undefined => {
    return preferences.find((pref) => pref.id === preferenceId);
  };

  return {
    preferences,
    isLoading,
    error,
    loadPreference,
  };
}
