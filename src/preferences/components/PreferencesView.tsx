/**
 * PreferencesView Component
 *
 * Główny kontener widoku zarządzający stanem całej strony preferencji.
 * Odpowiada za pobieranie danych, zarządzanie dialogami i koordynację operacji CRUD.
 */

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreferences } from "../hooks/usePreferences";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorAlert } from "./ErrorAlert";
import { EmptyState } from "./EmptyState";
import { PreferenceCard } from "./PreferenceCard";
import { PreferenceFormDialog } from "./PreferenceFormDialog";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import type { CreateUserPreferenceDto, UpdateUserPreferenceDto } from "@/types";

export function PreferencesView() {
  const {
    state,
    fetchPreferences,
    createPreference,
    updatePreference,
    deletePreference,
    clearError,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeFormDialog,
    closeDeleteDialog,
  } = usePreferences();

  // Handler dla submit formularza (create/edit)
  const handleFormSubmit = async (data: CreateUserPreferenceDto | UpdateUserPreferenceDto) => {
    if (state.dialogMode === "create") {
      await createPreference(data as CreateUserPreferenceDto);
    } else if (state.dialogMode === "edit" && state.selectedPreference) {
      await updatePreference(state.selectedPreference.id, data as UpdateUserPreferenceDto);
    }
  };

  // Handler dla potwierdzenia usunięcia
  const handleDeleteConfirm = async () => {
    if (state.preferenceToDelete) {
      await deletePreference(state.preferenceToDelete.id);
    }
  };

  // Wyświetl loading spinner podczas ładowania
  if (state.isLoading) {
    return <LoadingSpinner message="Ładowanie preferencji..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="preferences-view">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="preferences-page-title">
            Moje Preferencje
          </h1>
          <p className="mt-2 text-muted-foreground">
            Zarządzaj szablonami preferencji dla szybszego planowania wyjazdów
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2" data-testid="create-preference-button">
          <Plus className="h-4 w-4" />
          Nowa preferencja
        </Button>
      </div>

      {/* Error Alert */}
      {state.error && <ErrorAlert message={state.error} onDismiss={clearError} onRetry={fetchPreferences} />}

      {/* Content */}
      {state.preferences.length === 0 ? (
        <EmptyState onCreateClick={openCreateDialog} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="preferences-grid">
          {state.preferences.map((preference) => (
            <PreferenceCard
              key={preference.id}
              preference={preference}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

      {/* Form Dialog (Create/Edit) */}
      <PreferenceFormDialog
        open={state.dialogMode !== null}
        mode={state.dialogMode || "create"}
        initialData={state.selectedPreference || undefined}
        onSubmit={handleFormSubmit}
        onCancel={closeFormDialog}
        isSubmitting={state.isSubmitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={state.showDeleteDialog}
        preference={state.preferenceToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteDialog}
        isDeleting={state.isDeleting}
      />
    </div>
  );
}
