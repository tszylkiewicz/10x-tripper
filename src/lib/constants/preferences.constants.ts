/**
 * Predefined options for trip planning preferences
 */

export interface PreferenceOption {
  id: string;
  label: string;
  labelEn: string; // dla przyszłego i18n i do przekazania do AI
}

/**
 * Transport options - multi-select
 */
export const TRANSPORT_OPTIONS: PreferenceOption[] = [
  { id: "airplane", label: "Samolot", labelEn: "Airplane" },
  { id: "train", label: "Pociąg", labelEn: "Train" },
  { id: "long_distance_bus", label: "Autobus dalekobieżny", labelEn: "Long-distance bus" },
  { id: "rental_car", label: "Wypożyczony samochód", labelEn: "Rental car" },
  { id: "own_car", label: "Własny samochód", labelEn: "Own car" },
  { id: "public_transport", label: "Transport publiczny", labelEn: "Public transport" },
  { id: "walking", label: "Piesze spacery", labelEn: "Walking" },
  { id: "bike_scooter", label: "Rower / hulajnoga", labelEn: "Bike / scooter" },
  { id: "taxi_uber", label: "Taksówki / Uber", labelEn: "Taxi / Uber" },
];

/**
 * Activity options - multi-select (used for both "todo" and "avoid")
 */
export const ACTIVITY_OPTIONS: PreferenceOption[] = [
  { id: "museums", label: "Zwiedzanie muzeów", labelEn: "Museums" },
  { id: "landmarks", label: "Zabytki i architektura", labelEn: "Landmarks and architecture" },
  { id: "local_cuisine", label: "Lokalna kuchnia / restauracje", labelEn: "Local cuisine / restaurants" },
  { id: "shopping", label: "Zakupy", labelEn: "Shopping" },
  { id: "hiking", label: "Piesze wycieczki / trekking", labelEn: "Hiking / trekking" },
  { id: "water_sports", label: "Sporty wodne", labelEn: "Water sports" },
  { id: "beach", label: "Plaża / wypoczynek", labelEn: "Beach / relaxation" },
  { id: "nightlife", label: "Życie nocne / kluby", labelEn: "Nightlife / clubs" },
  { id: "nature", label: "Parki i natura", labelEn: "Parks and nature" },
  { id: "kids_attractions", label: "Atrakcje dla dzieci", labelEn: "Kids attractions" },
  { id: "viewpoints", label: "Punkty widokowe (must-see)", labelEn: "Viewpoints (must-see)" },
  { id: "festivals", label: "Festiwale i wydarzenia lokalne", labelEn: "Local festivals and events" },
  { id: "spa_wellness", label: "Spa i wellness", labelEn: "Spa and wellness" },
];

/**
 * Custom option prefix - used to distinguish custom entries from predefined IDs
 */
export const CUSTOM_OPTION_PREFIX = "custom:";

/**
 * Check if value is a custom option
 */
export function isCustomOption(value: string): boolean {
  return value.startsWith(CUSTOM_OPTION_PREFIX);
}

/**
 * Extract custom text from custom option value
 */
export function getCustomText(value: string): string {
  return value.replace(CUSTOM_OPTION_PREFIX, "");
}

/**
 * Create custom option value from text
 */
export function createCustomOption(text: string): string {
  return `${CUSTOM_OPTION_PREFIX}${text.trim()}`;
}

/**
 * Get display label for an option value (predefined ID or custom)
 */
export function getOptionLabel(value: string, options: PreferenceOption[], language: "pl" | "en" = "pl"): string {
  if (isCustomOption(value)) {
    return getCustomText(value);
  }
  const option = options.find((opt) => opt.id === value);
  return option ? (language === "pl" ? option.label : option.labelEn) : value;
}

/**
 * Get display labels for all selected values
 */
export function getOptionLabels(values: string[], options: PreferenceOption[], language: "pl" | "en" = "pl"): string[] {
  return values.map((v) => getOptionLabel(v, options, language));
}

/**
 * Convert selected options to AI prompt format (English labels)
 */
export function optionsToPromptText(values: string[], options: PreferenceOption[]): string {
  return getOptionLabels(values, options, "en").join(", ");
}

/**
 * Separate predefined IDs from custom options
 */
export function separateOptions(values: string[]): {
  predefined: string[];
  custom: string[];
} {
  return {
    predefined: values.filter((v) => !isCustomOption(v)),
    custom: values.filter(isCustomOption).map(getCustomText),
  };
}
