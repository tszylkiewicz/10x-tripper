/**
 * usePreferenceForm Hook
 *
 * Hook do zarządzania formularzem preferencji.
 * Obsługuje walidację i transformację danych.
 */

import { useState, useEffect } from "react";
import type { PreferenceFormViewModel, PreferenceFormErrors } from "../types";
import type { CreateUserPreferenceDto, UpdateUserPreferenceDto, UserPreferenceDto } from "../../types";

interface UsePreferenceFormProps {
  initialData?: UserPreferenceDto;
  mode: "create" | "edit";
}

/**
 * Hook do zarządzania formularzem preferencji
 */
export function usePreferenceForm({ initialData, mode }: UsePreferenceFormProps) {
  const [formData, setFormData] = useState<PreferenceFormViewModel>({
    name: initialData?.name || "",
    people_count: initialData?.people_count?.toString() || "",
    budget_type: initialData?.budget_type || "",
  });

  const [errors, setErrors] = useState<PreferenceFormErrors>({});
  const [touched, setTouched] = useState<Record<keyof PreferenceFormViewModel, boolean>>({
    name: false,
    people_count: false,
    budget_type: false,
  });

  // Resetuj formularz gdy zmieni się initialData (np. przy przełączaniu między create/edit)
  useEffect(() => {
    setFormData({
      name: initialData?.name || "",
      people_count: initialData?.people_count?.toString() || "",
      budget_type: initialData?.budget_type || "",
    });
    setErrors({});
    setTouched({
      name: false,
      people_count: false,
      budget_type: false,
    });
  }, [initialData, mode]);

  /**
   * Walidacja pojedynczego pola
   */
  const validateField = (name: keyof PreferenceFormViewModel, value: string): string | undefined => {
    switch (name) {
      case "name": {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
          return "Nazwa jest wymagana";
        }
        if (value.length > 256) {
          return "Nazwa nie może przekraczać 256 znaków";
        }
        return undefined;
      }

      case "people_count": {
        // Puste pole jest OK (opcjonalne)
        if (!value || value.trim() === "") {
          return undefined;
        }

        const num = parseInt(value, 10);
        if (isNaN(num)) {
          return "Liczba osób musi być liczbą całkowitą";
        }
        if (num < 1) {
          return "Liczba osób musi być większa lub równa 1";
        }
        return undefined;
      }

      case "budget_type":
        // Pole select z predefiniowanymi opcjami, brak walidacji
        return undefined;

      default:
        return undefined;
    }
  };

  /**
   * Walidacja całego formularza
   * Zwraca true jeśli formularz jest poprawny
   */
  const validateForm = (): boolean => {
    const newErrors: PreferenceFormErrors = {
      name: validateField("name", formData.name),
      people_count: validateField("people_count", formData.people_count),
      budget_type: validateField("budget_type", formData.budget_type),
    };

    setErrors(newErrors);

    // Sprawdź czy są jakiekolwiek błędy
    return !Object.values(newErrors).some((error) => error !== undefined);
  };

  /**
   * Obsługa zmiany wartości pola
   */
  const handleChange = (name: keyof PreferenceFormViewModel, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Walidacja on-the-fly dla pola które zostało już touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  /**
   * Obsługa blur (walidacja po opuszczeniu pola)
   */
  const handleBlur = (name: keyof PreferenceFormViewModel) => {
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, formData[name]);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  /**
   * Reset formularza
   */
  const reset = () => {
    setFormData({
      name: initialData?.name || "",
      people_count: initialData?.people_count?.toString() || "",
      budget_type: initialData?.budget_type || "",
    });
    setErrors({});
    setTouched({
      name: false,
      people_count: false,
      budget_type: false,
    });
  };

  /**
   * Konwersja do DTO
   * Zwraca dane gotowe do wysłania do API
   */
  const toDto = (): CreateUserPreferenceDto | UpdateUserPreferenceDto => {
    const dto: CreateUserPreferenceDto | UpdateUserPreferenceDto = {
      name: formData.name.trim(),
    };

    // people_count - konwertuj na number lub null
    if (formData.people_count && formData.people_count.trim() !== "") {
      dto.people_count = parseInt(formData.people_count, 10);
    } else {
      dto.people_count = null;
    }

    // budget_type - użyj wartości lub null
    if (formData.budget_type && formData.budget_type.trim() !== "") {
      dto.budget_type = formData.budget_type;
    } else {
      dto.budget_type = null;
    }

    return dto;
  };

  /**
   * Sprawdza czy formularz ma jakiekolwiek błędy walidacji
   */
  const hasErrors = (): boolean => {
    return Object.values(errors).some((error) => error !== undefined);
  };

  /**
   * Licznik znaków dla nazwy
   */
  const nameCharCount = formData.name.length;

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    toDto,
    hasErrors,
    nameCharCount,
  };
}
