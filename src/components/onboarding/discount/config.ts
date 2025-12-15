import {
  ApplicableFeeOption,
  DiscountOption,
  DiscountValidation,
} from "./types"

export const DISCOUNT_OPTIONS: DiscountOption[] = [
  {
    id: "percentage",
    label: "Percentage Discount",
    description: "Reduce fees by a percentage",
    maxValue: 50,
    defaultValue: 10,
    isPercentage: true,
    requiresDates: false,
    requiresTerms: false,
  },
  {
    id: "fixed",
    label: "Fixed Amount",
    description: "Reduce fees by a fixed amount",
    maxValue: 2000,
    defaultValue: 500,
    isPercentage: false,
    requiresDates: false,
    requiresTerms: false,
  },
  {
    id: "early_bird",
    label: "Early Bird",
    description: "Special discount for early registration",
    maxValue: 25,
    defaultValue: 15,
    isPercentage: true,
    requiresDates: true,
    requiresTerms: true,
  },
  {
    id: "sibling",
    label: "Sibling Discount",
    description: "Discount for enrolling multiple children",
    maxValue: 20,
    defaultValue: 10,
    isPercentage: true,
    requiresDates: false,
    requiresTerms: true,
  },
  {
    id: "scholarship",
    label: "Scholarship",
    description: "Merit or need-based scholarship",
    maxValue: 100,
    defaultValue: 50,
    isPercentage: true,
    requiresDates: true,
    requiresTerms: true,
  },
] as const

export const APPLICABLE_FEES: ApplicableFeeOption[] = [
  {
    id: "tuition",
    label: "Tuition Only",
    description: "Apply discount to tuition fees only",
  },
  {
    id: "registration",
    label: "Registration Only",
    description: "Apply discount to registration fees only",
  },
  {
    id: "all",
    label: "All Fees",
    description: "Apply discount to all applicable fees",
  },
] as const

export const DISCOUNT_VALIDATION: DiscountValidation = {
  minValue: 1,
  maxValue: 2000,
  maxDiscountCount: 5,
  maxStackedDiscounts: 2,
  minPurchaseAmount: 100,
  maxValidityDays: 365,
} as const

export const DISCOUNT_MESSAGES = {
  NAME_REQUIRED: "Discount name is required",
  NAME_TOO_SHORT: "Name must be at least 3 characters",
  NAME_TOO_LONG: "Name cannot exceed 50 characters",
  VALUE_REQUIRED: "Discount value is required",
  VALUE_TOO_LOW: "Value must be at least 1",
  VALUE_TOO_HIGH: (max: number) => `Value cannot exceed ${max}`,
  INVALID_DATES: "End date must be after start date",
  DATES_REQUIRED: "Start and end dates are required for this discount type",
  MAX_USES_INVALID: "Maximum uses must be a positive number",
  MIN_PURCHASE_INVALID: "Minimum purchase amount must be at least 100",
  FEES_REQUIRED: "Select at least one applicable fee",
  TERMS_REQUIRED: "Terms and conditions are required for this discount type",
  MAX_DISCOUNTS: `Cannot create more than ${DISCOUNT_VALIDATION.maxDiscountCount} discounts`,
  MAX_STACKED: `Cannot stack more than ${DISCOUNT_VALIDATION.maxStackedDiscounts} discounts`,
  VALIDITY_TOO_LONG: `Discount period cannot exceed ${DISCOUNT_VALIDATION.maxValidityDays} days`,
} as const
