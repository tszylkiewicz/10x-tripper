/**
 * usePreferencesDialogs Hook
 *
 * Hook odpowiedzialny za zarządzanie stanem dialogów w widoku preferencji.
 * Obsługuje otwieranie/zamykanie dialogów tworzenia, edycji i usuwania.
 */

import { useState } from "react";
import type { PreferencesDialogsState } from "../types";
import type { UserPreferenceDto } from "../../types";

/**
 * Hook do zarządzania dialogami
 */
export function usePreferencesDialogs() {
  const [state, setState] = useState<PreferencesDialogsState>({
    dialogMode: null,
    selectedPreference: null,
    showDeleteDialog: false,
    preferenceToDelete: null,
  });

  /**
   * Otwiera dialog tworzenia nowej preferencji
   */
  const openCreateDialog = (): void => {
    setState({
      dialogMode: "create",
      selectedPreference: null,
      showDeleteDialog: false,
      preferenceToDelete: null,
    });
  };

  /**
   * Otwiera dialog edycji preferencji
   */
  const openEditDialog = (preference: UserPreferenceDto): void => {
    setState({
      dialogMode: "edit",
      selectedPreference: preference,
      showDeleteDialog: false,
      preferenceToDelete: null,
    });
  };

  /**
   * Otwiera dialog potwierdzenia usunięcia
   */
  const openDeleteDialog = (preference: UserPreferenceDto): void => {
    setState({
      dialogMode: null,
      selectedPreference: null,
      showDeleteDialog: true,
      preferenceToDelete: preference,
    });
  };

  /**
   * Zamyka dialog formularza (tworzenia/edycji)
   */
  const closeFormDialog = (): void => {
    setState((prev) => ({
      ...prev,
      dialogMode: null,
      selectedPreference: null,
    }));
  };

  /**
   * Zamyka dialog potwierdzenia usunięcia
   */
  const closeDeleteDialog = (): void => {
    setState((prev) => ({
      ...prev,
      showDeleteDialog: false,
      preferenceToDelete: null,
    }));
  };

  /**
   * Zamyka wszystkie dialogi
   */
  const closeAllDialogs = (): void => {
    setState({
      dialogMode: null,
      selectedPreference: null,
      showDeleteDialog: false,
      preferenceToDelete: null,
    });
  };

  return {
    ...state,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeFormDialog,
    closeDeleteDialog,
    closeAllDialogs,
  };
}
