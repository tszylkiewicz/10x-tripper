# Trip Plan Utilities

Shared utility functions for trip plan components. These utilities are used across both `create` and `details` views to ensure consistency.

## 📁 Structure

```
src/lib/utils/
├── date-formatting.ts              # Date formatting utilities
├── date-formatting.test.ts
├── activity-validation.ts          # Activity validation logic
├── activity-validation.test.ts
├── accommodation-validation.ts     # Accommodation validation logic
├── accommodation-validation.test.ts
├── trip-plan-constants.ts          # Shared constants
├── index.ts                        # Central export
└── README.md                       # This file
```

## 🎯 Usage

### Date Formatting

```typescript
import { formatDate, formatAccommodationDate, formatDateRange } from "@/lib/utils";

// Format date with weekday (for day headers)
formatDate("2025-06-01");
// Returns: "sobota, 1 czerwca"

// Format date without weekday (for accommodation)
formatAccommodationDate("2025-06-01");
// Returns: "1 czerwca 2025"

// Format date range
formatDateRange("2025-06-01", "2025-06-03");
// Returns: "1 czerwca 2025 - 3 czerwca 2025"
```

### Activity Validation

```typescript
import { validateActivity, isActivityValid, EMPTY_ACTIVITY } from "@/lib/utils";

// Validate activity
const errors = validateActivity(activity);
if (Object.keys(errors).length > 0) {
  // Handle validation errors
  console.log(errors.title); // "Tytuł jest wymagany"
}

// Quick validation check
if (isActivityValid(activity)) {
  // Activity is valid
}

// Use empty activity template
const [newActivity, setNewActivity] = useState(EMPTY_ACTIVITY);
```

### Accommodation Validation

```typescript
import { validateAccommodation, isAccommodationValid, validateDateRange, EMPTY_ACCOMMODATION } from "@/lib/utils";

// Validate accommodation
const errors = validateAccommodation(accommodation);

// Validate only date range
const error = validateDateRange(checkIn, checkOut);
if (error) {
  console.log(error); // "Data wymeldowania musi być >= data zameldowania"
}

// Use empty accommodation template
const [newAccommodation, setNewAccommodation] = useState(EMPTY_ACCOMMODATION);
```

### Constants

```typescript
import {
  MAX_ACTIVITY_TITLE_LENGTH,
  MIN_ACTIVITIES_PER_DAY,
  ACTIVITY_CATEGORIES,
  PLACEHOLDERS,
  ERROR_MESSAGES
} from "@/lib/utils";

// Use in validation
if (title.length > MAX_ACTIVITY_TITLE_LENGTH) {
  setError(ERROR_MESSAGES.activity.titleTooLong);
}

// Business rule
if (activities.length <= MIN_ACTIVITIES_PER_DAY) {
  return; // Cannot delete last activity
}

// Autocomplete suggestions
<Autocomplete options={ACTIVITY_CATEGORIES} />

// Form placeholders
<Input placeholder={PLACEHOLDERS.activity.title} />
```

## 🧪 Testing

All utilities have comprehensive unit tests:

```bash
# Run all utility tests
npm test src/lib/utils/

# Run specific test file
npm test src/lib/utils/activity-validation.test.ts

# Watch mode
npm test -- --watch src/lib/utils/
```

### Test Coverage

- **date-formatting**: 13 tests
- **activity-validation**: 35+ tests
- **accommodation-validation**: 40+ tests

All utilities have >95% code coverage.

## 📝 Validation Rules

### Activity

| Field            | Rules                        |
| ---------------- | ---------------------------- |
| `time`           | Required, format: `HH:MM`    |
| `title`          | Required, max 200 characters |
| `description`    | Required                     |
| `location`       | Required                     |
| `estimated_cost` | Optional, must be >= 0       |

### Accommodation

| Field            | Rules                           |
| ---------------- | ------------------------------- |
| `name`           | Required                        |
| `address`        | Required                        |
| `check_in`       | Required                        |
| `check_out`      | Required, must be >= `check_in` |
| `estimated_cost` | Optional, must be >= 0          |
| `booking_url`    | Optional, must be valid URL     |

## 🔧 Migration Guide

### Before (duplicate validation in components)

```typescript
// In ActivityCard.tsx
function validateActivity(activity: ActivityDto): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!activity.time?.trim()) {
    errors.time = "Godzina jest wymagana";
  }
  // ... more validation
  return errors;
}

// In DayCard.tsx (ActivityItem)
function validateActivity(activity: ActivityDto): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!activity.time?.trim()) {
    errors.time = "Godzina jest wymagana";
  }
  // ... same validation again!
  return errors;
}
```

### After (shared utility)

```typescript
// In ActivityCard.tsx
import { validateActivity } from "@/lib/utils";

// Use shared validation
const errors = validateActivity(activity);
```

## 🎨 Best Practices

1. **Always use shared constants** instead of hardcoding values
2. **Import from index.ts** for better tree-shaking:

   ```typescript
   // ✅ Good
   import { validateActivity, EMPTY_ACTIVITY } from "@/lib/utils";

   // ❌ Avoid
   import { validateActivity } from "@/lib/utils/activity-validation";
   ```

3. **Use typed errors** from validation functions
4. **Reuse error messages** from `ERROR_MESSAGES` constant

## 🚀 Benefits

- ✅ **DRY**: Single source of truth for validation logic
- ✅ **Consistency**: Same validation rules everywhere
- ✅ **Tested**: Comprehensive unit tests
- ✅ **Maintainable**: Change once, apply everywhere
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Tree-shakable**: Import only what you need

## 📚 Related

- Components using these utils:
  - `src/components/trip-plans/details/ActivityCard.tsx`
  - `src/components/trip-plans/details/PlanDay.tsx`
  - `src/components/trip-plans/details/AccommodationSection.tsx`
  - `src/components/trip-plans/create/DayCard.tsx`
  - `src/components/trip-plans/create/AccommodationCard.tsx`

## 🔄 Future Enhancements

Potential additions for Phase 2:

- `validateTripPlanMetadata()` - Validate trip plan header fields
- `calculateTripDuration()` - Calculate days between dates
- `generateDayActivitiesSummary()` - Create summary for a day
- `formatCurrency()` - Consistent currency formatting
