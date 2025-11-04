/**
 * Preferences Domain Types
 *
 * Typy ViewModels i pomocnicze dla domeny preferencji użytkownika.
 * Używane przez komponenty i hooki w tej domenie.
 */

import type { UserPreferenceDto } from "../types";

// =============================================================================
// FORM VIEW MODELS
// =============================================================================

/**
 * Stan formularza preferencji
 * Używany w PreferenceFormDialog do zarządzania wartościami pól
 *
 * Pola:
 * - name: string - nazwa preferencji wpisana przez użytkownika
 * - people_count: string - liczba osób jako string (dla inputu), konwertowana na number przy submit
 * - budget_type: string - wybrany typ budżetu
 */
export interface PreferenceFormViewModel {
  name: string;
  people_count: string;
  budget_type: string;
}

/**
 * Błędy walidacji formularza
 * Każde pole odpowiada polu w PreferenceFormViewModel
 *
 * Pola:
 * - name?: string - błąd walidacji nazwy (np. "Nazwa jest wymagana")
 * - people_count?: string - błąd walidacji liczby osób (np. "Wartość musi być >= 1")
 * - budget_type?: string - błąd walidacji typu budżetu
 */
export interface PreferenceFormErrors {
  name?: string;
  people_count?: string;
  budget_type?: string;
}

/**
 * Tryb dialogu formularza
 * Określa czy dialog służy do tworzenia nowej preferencji czy edycji istniejącej
 * null oznacza zamknięty dialog
 */
export type PreferenceDialogMode = "create" | "edit" | null;

// =============================================================================
// VIEW STATE
// =============================================================================

/**
 * Stan danych preferencji (CRUD operations)
 * Używany w hooku usePreferencesData
 */
export interface PreferencesDataState {
  preferences: UserPreferenceDto[];
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  error: string | null;
}

/**
 * Stan dialogów
 * Używany w hooku usePreferencesDialogs
 */
export interface PreferencesDialogsState {
  dialogMode: PreferenceDialogMode;
  selectedPreference: UserPreferenceDto | null;
  showDeleteDialog: boolean;
  preferenceToDelete: UserPreferenceDto | null;
}

/**
 * Pełny stan widoku preferencji
 * Centralne miejsce zarządzania stanem całego widoku
 * Łączy stan danych i stan dialogów
 */
export interface PreferencesViewState extends PreferencesDataState, PreferencesDialogsState {}

// =============================================================================
// UI OPTIONS
// =============================================================================

/**
 * Opcje typu budżetu dla selecta
 * Używane w PreferenceFormDialog
 */
export interface BudgetTypeOption {
  value: string;
  label: string;
}

/**
 * Predefiniowane opcje budżetu
 */
export const BUDGET_TYPE_OPTIONS: BudgetTypeOption[] = [
  { value: "none", label: "Nie określono" },
  { value: "low", label: "Niski" },
  { value: "medium", label: "Średni" },
  { value: "high", label: "Wysoki" },
];
