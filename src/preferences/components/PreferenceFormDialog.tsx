/**
 * PreferenceFormDialog Component
 *
 * Modalny dialog zawierający formularz do tworzenia lub edycji preferencji.
 * Automatycznie dostosowuje tytuł i logikę w zależności od trybu (create/edit).
 */

import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePreferenceForm } from "../hooks/usePreferenceForm";
import { BUDGET_TYPE_OPTIONS } from "../types";
import type { UserPreferenceDto, CreateUserPreferenceDto, UpdateUserPreferenceDto } from "../../types";

interface PreferenceFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialData?: UserPreferenceDto;
  onSubmit: (data: CreateUserPreferenceDto | UpdateUserPreferenceDto) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function PreferenceFormDialog({
  open,
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: PreferenceFormDialogProps) {
  const {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    toDto,
    hasErrors,
    nameCharCount,
  } = usePreferenceForm({ initialData, mode });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Walidacja przed wysłaniem
    if (!validateForm()) {
      return;
    }

    // Wysłanie danych
    const dto = toDto();
    await onSubmit(dto);
  };

  const title = mode === "create" ? "Nowa preferencja" : "Edytuj preferencję";
  const description =
    mode === "create"
      ? "Utwórz szablon preferencji, który przyspieszy planowanie przyszłych wyjazdów."
      : "Zaktualizuj dane zapisanej preferencji.";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Pole: Nazwa */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nazwa <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="np. Wakacje rodzinne"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                className={errors.name && touched.name ? "border-destructive" : ""}
                disabled={isSubmitting}
                maxLength={256}
              />
              <div className="flex items-center justify-between">
                {errors.name && touched.name ? (
                  <p className="text-sm text-destructive">{errors.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Wymagane, max 256 znaków</p>
                )}
                <p
                  className={`text-xs ${
                    nameCharCount > 256 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  {nameCharCount}/256
                </p>
              </div>
            </div>

            {/* Pole: Liczba osób */}
            <div className="space-y-2">
              <Label htmlFor="people_count">Liczba osób</Label>
              <Input
                id="people_count"
                name="people_count"
                type="number"
                min="1"
                step="1"
                placeholder="Opcjonalne"
                value={formData.people_count}
                onChange={(e) => handleChange("people_count", e.target.value)}
                onBlur={() => handleBlur("people_count")}
                className={errors.people_count && touched.people_count ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.people_count && touched.people_count ? (
                <p className="text-sm text-destructive">{errors.people_count}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Opcjonalne, minimum 1</p>
              )}
            </div>

            {/* Pole: Typ budżetu */}
            <div className="space-y-2">
              <Label htmlFor="budget_type">Typ budżetu</Label>
              <Select
                value={formData.budget_type}
                onValueChange={(value) => handleChange("budget_type", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="budget_type">
                  <SelectValue placeholder="Wybierz typ budżetu" />
                </SelectTrigger>
                <SelectContent>
                  {BUDGET_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">Opcjonalne</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || hasErrors()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
