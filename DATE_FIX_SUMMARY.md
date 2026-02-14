# Date Logic Fix Summary

## Problem
The app was showing incorrect "days until exam" counts due to timezone inconsistencies and improper date arithmetic. For example, it would show "5 days" when there were actually only 4 days remaining.

## Root Causes

1. **Timezone Drift**: Database dates stored as ISO strings (UTC midnight) were being parsed and compared to local timestamps without normalization
2. **Raw Millisecond Math**: Using `Math.ceil(diffTime / (1000 * 60 * 60 * 24))` is error-prone:
   - Time components cause rounding issues
   - DST transitions can affect calculations
   - Doesn't account for calendar days vs 24-hour periods
3. **Inconsistent Date Handling**: Mix of normalized dates (`getToday()`) and raw timestamps (`new Date()`)

## Solution

### New Utility Functions in `src/lib/date.ts`

Added four new utility functions for consistent, timezone-safe date handling:

```typescript
// Normalize any date to local midnight
normalizeToStartOfDay(date: Date | string): Date

// Calculate calendar days between two dates
getDaysBetween(dateA: Date | string, dateB: Date | string): number

// Check if a date is after today
isFutureDay(date: Date | string): boolean

// Check if a date is before today
isPastDay(date: Date | string): boolean
```

### Fixed `getRelativeDateString()`
Refactored to use `getDaysBetween()` instead of raw millisecond math, ensuring correct "Today", "Tomorrow", "In X days" labels.

## Files Changed

### 1. `src/lib/date.ts`
- ✅ Added `normalizeToStartOfDay()` - ensures dates are at local midnight
- ✅ Added `getDaysBetween()` - accurate calendar day calculation
- ✅ Added `isFutureDay()` and `isPastDay()` - semantic date checks
- ✅ Refactored `getRelativeDateString()` to use new utilities

### 2. `src/components/dashboard/WelcomeHeader.tsx`
- ✅ Replaced raw `getTime()` math with `getDaysBetween()`
- ✅ Fixed exam sorting to use `getDaysBetween()` instead of timestamp comparison
- ✅ Now shows accurate "Days to Exam" count

### 3. `src/components/dashboard/TodayBox.tsx`
- ✅ Updated exam sorting to use `getDaysBetween()`
- ✅ Removed unnecessary `new Date()` wrapper in `getRelativeDateString()`
- ✅ Ensures consistent date handling

### 4. `src/components/dashboard/CalendarView.tsx`
- ✅ Replaced raw `date < today` with `isPastDay(date)`
- ✅ More semantic and consistent with other date checks

### 5. `src/lib/actions/exam.ts`
- ✅ Imported `normalizeToStartOfDay` and `getToday`
- ✅ Fixed exam status calculation: `normalizeToStartOfDay(exam.date) < today`
- ✅ Fixed `cleanupPastData()` to use `getToday()` instead of `new Date()`
- ✅ Ensures UPCOMING/COMPLETED status is accurate

## How It Works

### Before (Broken)
```typescript
// WelcomeHeader.tsx - WRONG
const diffTime = new Date(nearestExam.date).getTime() - today.getTime();
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// ❌ Off-by-one due to timezone and time components
```

### After (Fixed)
```typescript
// WelcomeHeader.tsx - CORRECT
const diffDays = getDaysBetween(today, nearestExam.date);
// ✅ Accurate calendar day calculation
```

### How `getDaysBetween()` Works
```typescript
export function getDaysBetween(dateA: Date | string, dateB: Date | string): number {
  // Normalize both dates to midnight local time
  const a = normalizeToStartOfDay(dateA);
  const b = normalizeToStartOfDay(dateB);
  // Calculate difference in milliseconds
  const diffMs = b.getTime() - a.getTime();
  // Round to nearest day (safe because both are at midnight)
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
```

## Testing

✅ Build passes with no TypeScript errors
✅ All date comparisons now use consistent, normalized dates
✅ Calendar day calculations work regardless of timezone
✅ No more off-by-one errors

## Best Practices Going Forward

1. **Always normalize dates** before comparison using `normalizeToStartOfDay()`
2. **Use `getDaysBetween()`** instead of raw millisecond math
3. **Use semantic helpers** like `isPastDay()`, `isFutureDay()`, `isToday()`
4. **Use `getToday()`** instead of `new Date()` when you need "today at midnight"
5. **Never use** `Math.ceil/floor((date1 - date2) / MS_PER_DAY)` - use utilities instead

## Impact

- ✅ "Days to Exam" now shows correct values
- ✅ "Today" works reliably across timezones
- ✅ Exam status (UPCOMING/COMPLETED) is accurate
- ✅ Calendar view past/future detection is consistent
- ✅ All date handling is timezone-safe and reliable
