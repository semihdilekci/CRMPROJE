export const ROLES = ['admin', 'user'] as const;
export type UserRole = (typeof ROLES)[number];

export const CONVERSION_RATES = ['very_high', 'high', 'medium', 'low', 'very_low'] as const;
export type ConversionRate = (typeof CONVERSION_RATES)[number];

export const CURRENCIES = ['USD', 'EUR', 'TRY', 'GBP'] as const;
export type Currency = (typeof CURRENCIES)[number];
