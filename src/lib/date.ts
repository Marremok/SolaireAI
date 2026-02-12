/**
 * Date utility functions for consistent date handling across the app
 * Uses native JavaScript Date API for simplicity
 */

// Swedish locale for date formatting
const LOCALE = 'en-US';

// Day names
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Get today's date at midnight (for consistent comparisons)
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Format date as "Wednesday, Feb 4" (for TodayBox header)
 */
export function formatDateFull(date: Date): string {
  const dayName = DAY_NAMES_FULL[date.getDay()];
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const day = date.getDate();
  return `${dayName}, ${month} ${day}`;
}

/**
 * Format date as "Feb 4" (for day cards)
 */
export function formatDateShort(date: Date): string {
  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Get short day name (Mon, Tue, etc.)
 */
export function getDayNameShort(date: Date): string {
  return DAY_NAMES_SHORT[date.getDay()];
}

/**
 * Get full day name (Monday, Tuesday, etc.)
 */
export function getDayNameFull(date: Date): string {
  return DAY_NAMES_FULL[date.getDay()];
}

/**
 * Get full month name
 */
export function getMonthName(date: Date): string {
  return MONTH_NAMES_FULL[date.getMonth()];
}

/**
 * Get short month name
 */
export function getMonthNameShort(date: Date): string {
  return MONTH_NAMES_SHORT[date.getMonth()];
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get upcoming days starting from a given date
 * @param startDate The starting date (defaults to today)
 * @param count Number of days to return
 * @returns Array of dates
 */
export function getUpcomingDays(startDate: Date = getToday(), count: number = 5): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    days.push(addDays(startDate, i + 1)); // Start from tomorrow
  }
  return days;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, getToday());
}

/**
 * Check if a date is tomorrow
 */
export function isTomorrow(date: Date): boolean {
  return isSameDay(date, addDays(getToday(), 1));
}

/**
 * Get relative date string (Today, Tomorrow, In X days)
 */
export function getRelativeDateString(date: Date): string {
  const today = getToday();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;

  return formatDateShort(date);
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get all days in a month
 * @param year The year
 * @param month The month (0-indexed)
 * @returns Array of dates for the entire month
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);

  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return days;
}

/**
 * Get the first day of the week for a given month (0 = Sunday, 1 = Monday, etc.)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get calendar grid for a month (includes padding days from prev/next months)
 * Starts on Monday (EU standard)
 */
export function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);

  // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
  const mondayBasedFirstDay = (firstDayOfMonth + 6) % 7;

  // Pad the beginning with null values for days before the 1st
  const grid: (Date | null)[] = Array(mondayBasedFirstDay).fill(null);

  // Add all days of the month
  grid.push(...daysInMonth);

  // Pad the end to complete the last week (optional)
  const remainingDays = (7 - (grid.length % 7)) % 7;
  grid.push(...Array(remainingDays).fill(null));

  return grid;
}

/**
 * Get previous month and year
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 0) {
    return { year: year - 1, month: 11 };
  }
  return { year, month: month - 1 };
}

/**
 * Get next month and year
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 11) {
    return { year: year + 1, month: 0 };
  }
  return { year, month: month + 1 };
}
