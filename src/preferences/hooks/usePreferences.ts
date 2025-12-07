/**
 * usePreferences Hook
 *
 * Główny hook dla widoku preferencji, który łączy funkcjonalność
 * zarządzania danymi (CRUD) i zarządzania dialogami.
 */

import { usePreferencesData } from "./usePreferencesData";
import { usePreferencesDialogs } from "./usePreferencesDialogs";
import type { PreferencesViewState } from "../types";
import type { CreateUserPreferenceDto, UpdateUserPreferenceDto } from "@/types.ts";

/**
 * Hook łączący zarządzanie danymi i dialogami dla widoku preferencji
 */
export function usePreferences() {
  const dataState = usePreferencesData();
  const dialogsState = usePreferencesDialogs();

  // Wrapper dla createPreference - zamyka dialog po sukcesie
  const handleCreatePreference = async (data: CreateUserPreferenceDto): Promise<void> => {
    try {
      await dataState.createPreference(data);
      dialogsState.closeFormDialog();
    } catch (error) {
      // Błąd jest już obsłużony w usePreferencesData
      // Dialog pozostaje otwarty, żeby użytkownik mógł poprawić dane
    }
  };

  // Wrapper dla updatePreference - zamyka dialog po sukcesie
  const handleUpdatePreference = async (id: string, data: UpdateUserPreferenceDto): Promise<void> => {
    try {
      await dataState.updatePreference(id, data);
      dialogsState.closeFormDialog();
    } catch (error) {
      // Błąd jest już obsłużony w usePreferencesData
      // Dialog pozostaje otwarty, żeby użytkownik mógł poprawić dane
    }
  };

  // Wrapper dla deletePreference - zamyka dialog po sukcesie
  const handleDeletePreference = async (id: string): Promise<void> => {
    try {
      await dataState.deletePreference(id);
      dialogsState.closeDeleteDialog();
    } catch (error) {
      // Błąd jest już obsłużony w usePreferencesData
      // Dialog się zamyka, ale błąd jest wyświetlany na poziomie strony
      dialogsState.closeDeleteDialog();
    }
  };

  // Połączony stan
  const state: PreferencesViewState = {
    ...dataState,
    ...dialogsState,
  };

  return {
    state,
    // Operacje CRUD
    fetchPreferences: dataState.fetchPreferences,
    createPreference: handleCreatePreference,
    updatePreference: handleUpdatePreference,
    deletePreference: handleDeletePreference,
    clearError: dataState.clearError,
    // Zarządzanie dialogami
    openCreateDialog: dialogsState.openCreateDialog,
    openEditDialog: dialogsState.openEditDialog,
    openDeleteDialog: dialogsState.openDeleteDialog,
    closeFormDialog: dialogsState.closeFormDialog,
    closeDeleteDialog: dialogsState.closeDeleteDialog,
    closeAllDialogs: dialogsState.closeAllDialogs,
  };
}
