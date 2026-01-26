/**
 * PreferencesView Component
 *
 * Główny kontener widoku zarządzający stanem całej strony preferencji.
 * Odpowiada za pobieranie danych, zarządzanie dialogami i koordynację operacji CRUD.
 */

import { FileHeart } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteConfirmDialog } from "@/components/ui/DeleteConfirmDialog";
import { usePreferences } from "../hooks/usePreferences";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorAlert } from "./ErrorAlert";
import { PreferenceCard } from "./PreferenceCard";
import { PreferenceFormDialog } from "./PreferenceFormDialog";
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
      <PageHeader
        title="Moje Preferencje"
        description="Zarządzaj szablonami preferencji dla szybszego planowania wyjazdów"
        onCreateClick={openCreateDialog}
        createButtonLabel="Nowa preferencja"
        titleTestId="preferences-page-title"
        createButtonTestId="create-preference-button"
      />

      {/* Error Alert */}
      {state.error && <ErrorAlert message={state.error} onDismiss={clearError} onRetry={fetchPreferences} />}

      {/* Content */}
      {state.preferences.length === 0 ? (
        <EmptyState
          icon={FileHeart}
          title="Brak preferencji"
          description="Utwórz swoją pierwszą preferencję, aby szybciej planować przyszłe wyjazdy. Zapisane preferencje pozwolą Ci łatwiej konfigurować parametry planów podróży."
          actionLabel="Utwórz pierwszą preferencję"
          onAction={openCreateDialog}
          containerTestId="preferences-empty-state"
          actionTestId="empty-state-create-button"
        />
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
      <DeleteConfirmDialog
        open={state.showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteDialog}
        isDeleting={state.isDeleting}
        title="Czy na pewno chcesz usunąć?"
        description={
          state.preferenceToDelete ? (
            <>
              Ta akcja jest nieodwracalna. Preferencja{" "}
              <strong className="font-semibold text-foreground">{state.preferenceToDelete.name}</strong> zostanie trwale
              usunięta z twojego konta.
            </>
          ) : null
        }
      />
    </div>
  );
}
