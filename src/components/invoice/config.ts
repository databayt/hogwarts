// Centralized constants for the Invoice feature

export const STEPS = {
  1: "Company & Client",
  2: "Invoice Details & Items",
  3: "Review & Submit"
} as const;

export const STEP_FIELDS = {
  1: ['from', 'to'] as const,
  2: ['invoice_no', 'currency', 'invoice_date', 'due_date', 'items'] as const,
  3: ['sub_total', 'discount', 'tax_percentage', 'total', 'notes'] as const
} as const;

export const TOTAL_FIELDS = [...STEP_FIELDS[1], ...STEP_FIELDS[2], ...STEP_FIELDS[3]].length;

export const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "INR", value: "INR" },
  { label: "CAD", value: "CAD" },
  { label: "AUD", value: "AUD" }
] as const;


