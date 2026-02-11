export const WHEN_TO_START_OPTIONS = [
  "tomorrow",
  "in_2_days",
  "in_3_days",
  "next_week",
  "the_week_before",
  "2_weeks_before",
  "3_weeks_before",
  "4_weeks_before",
] as const;

export type WhenToStartStudying = (typeof WHEN_TO_START_OPTIONS)[number];

export const PRICING = {
  MONTHLY_PRICE: "$6.99",
  MONTHLY_PRICE_DISPLAY: "6.99",
  TRIAL_DAYS: 7,
} as const;
