import { FeeConfig, BillingOption, CurrencyOption } from './types';

export const FEE_CONFIGS: FeeConfig[] = [
  {
    id: 'tuition',
    label: 'Tuition Fee',
    description: 'Base annual tuition fee per student',
    required: true,
    min: 1000,
    max: 50000,
    defaultValue: 10000,
  },
  {
    id: 'registration',
    label: 'Registration Fee',
    description: 'One-time registration fee for new students',
    required: false,
    min: 50,
    max: 1000,
    defaultValue: 200,
  },
  {
    id: 'application',
    label: 'Application Fee',
    description: 'Non-refundable application processing fee',
    required: false,
    min: 25,
    max: 500,
    defaultValue: 100,
  },
  {
    id: 'materials',
    label: 'Materials Fee',
    description: 'Annual fee for books and supplies',
    required: false,
    min: 100,
    max: 2000,
    defaultValue: 500,
  },
  {
    id: 'activities',
    label: 'Activity Fee',
    description: 'Annual fee for extracurricular activities',
    required: false,
    min: 100,
    max: 2000,
    defaultValue: 500,
  },
] as const;

export const BILLING_OPTIONS: BillingOption[] = [
  {
    id: 'monthly',
    label: 'Monthly',
    description: 'Split into 12 monthly payments',
  },
  {
    id: 'quarterly',
    label: 'Quarterly',
    description: '4 payments per year',
    discountPercentage: 2,
  },
  {
    id: 'semester',
    label: 'Per Semester',
    description: '2 payments per year',
    discountPercentage: 3,
  },
  {
    id: 'annual',
    label: 'Annual',
    description: 'Single payment for the year',
    discountPercentage: 5,
  },
] as const;

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRate: 1,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    exchangeRate: 0.85,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    exchangeRate: 0.73,
  },
  {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    exchangeRate: 1.25,
  },
  {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    exchangeRate: 1.35,
  },
] as const;

export const PRICE_MESSAGES = {
  TUITION_REQUIRED: 'Tuition fee is required',
  TUITION_TOO_LOW: `Tuition fee must be at least ${FEE_CONFIGS[0].min}`,
  TUITION_TOO_HIGH: `Tuition fee cannot exceed ${FEE_CONFIGS[0].max}`,
  INVALID_FEE: 'Please enter a valid fee amount',
  SELECT_BILLING: 'Please select a billing cycle',
  SELECT_CURRENCY: 'Please select a currency',
  REGISTRATION_TOO_HIGH: `Registration fee cannot exceed ${FEE_CONFIGS[1].max}`,
  APPLICATION_TOO_HIGH: `Application fee cannot exceed ${FEE_CONFIGS[2].max}`,
  MATERIALS_TOO_HIGH: `Materials fee cannot exceed ${FEE_CONFIGS[3].max}`,
  ACTIVITIES_TOO_HIGH: `Activities fee cannot exceed ${FEE_CONFIGS[4].max}`,
} as const;
