import { useState } from "react";
import { Checkbox } from "./checkbox";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import type { PreferenceOption } from "@lib/constants/preferences.constants";
import { createCustomOption, getCustomText, isCustomOption } from "@lib/constants/preferences.constants";
import { X } from "lucide-react";

export interface MultiSelectWithCustomProps {
  options: PreferenceOption[];
  selectedValues: string[]; // Mix of predefined IDs and "custom:..." values
  onSelectionChange: (values: string[]) => void;
  customInputPlaceholder?: string;
  label: string;
  disabled?: boolean;
}

export function MultiSelectWithCustom({
  options,
  selectedValues,
  onSelectionChange,
  customInputPlaceholder = "Dodaj własną opcję...",
  label,
  disabled = false,
}: MultiSelectWithCustomProps) {
  const [customInput, setCustomInput] = useState("");

  // Separate predefined and custom values
  const predefinedValues = selectedValues.filter((v) => !isCustomOption(v));
  const customValues = selectedValues.filter(isCustomOption);

  // Handle checkbox toggle for predefined options
  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    if (disabled) return;

    const newValues = checked ? [...selectedValues, optionId] : selectedValues.filter((v) => v !== optionId);

    onSelectionChange(newValues);
  };

  // Handle adding custom option
  const handleAddCustom = () => {
    if (disabled || !customInput.trim()) return;

    const customValue = createCustomOption(customInput.trim());

    // Check if already exists
    if (selectedValues.includes(customValue)) {
      setCustomInput("");
      return;
    }

    onSelectionChange([...selectedValues, customValue]);
    setCustomInput("");
  };

  // Handle removing custom option
  const handleRemoveCustom = (customValue: string) => {
    if (disabled) return;
    onSelectionChange(selectedValues.filter((v) => v !== customValue));
  };

  // Handle Enter key in input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustom();
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">{label}</Label>

      {/* Predefined options - checkboxes */}
      <div className="space-y-3">
        {options.map((option) => {
          const isChecked = predefinedValues.includes(option.id);

          return (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`${label}-${option.id}`}
                checked={isChecked}
                onCheckedChange={(checked) => handleCheckboxChange(option.id, checked === true)}
                disabled={disabled}
              />
              <label
                htmlFor={`${label}-${option.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>

      {/* Custom options - badges/chips */}
      {customValues.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Własne opcje:</Label>
          <div className="flex flex-wrap gap-2">
            {customValues.map((customValue) => (
              <Badge key={customValue} variant="secondary" className="gap-1 pr-1" data-testid={`badge-${customValue}`}>
                <span>{getCustomText(customValue)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustom(customValue)}
                  disabled={disabled}
                  className="rounded-full hover:bg-muted p-0.5"
                  aria-label={`Usuń ${getCustomText(customValue)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Add custom option input */}
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={customInputPlaceholder}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="flex-1"
        />
        <Button type="button" onClick={handleAddCustom} disabled={disabled || !customInput.trim()} variant="outline">
          Dodaj
        </Button>
      </div>
    </div>
  );
}
