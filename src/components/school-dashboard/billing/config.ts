// Billing Configuration and Constants

// Payment method types with display labels
export const PAYMENT_METHOD_TYPES = {
  CARD: {
    value: "CARD",
    label: "Credit/Debit Card",
    icon: "CreditCard",
  },
  BANK_ACCOUNT: {
    value: "BANK_ACCOUNT",
    label: "Bank Account (ACH)",
    icon: "Building",
  },
  PAYPAL: {
    value: "PAYPAL",
    label: "PayPal",
    icon: "BrandPaypal",
  },
  GOOGLE_PAY: {
    value: "GOOGLE_PAY",
    label: "Google Pay",
    icon: "BrandGoogle",
  },
  APPLE_PAY: {
    value: "APPLE_PAY",
    label: "Apple Pay",
    icon: "BrandApple",
  },
  MANUAL: {
    value: "MANUAL",
    label: "Manual Payment",
    icon: "Receipt",
  },
  OTHER: {
    value: "OTHER",
    label: "Other",
    icon: "Wallet",
  },
} as const

// Card brands with colors
export const CARD_BRANDS = {
  visa: { label: "Visa", color: "blue", icon: "BrandVisa" },
  mastercard: { label: "Mastercard", color: "red", icon: "BrandMastercard" },
  amex: { label: "American Express", color: "green", icon: "BrandAmex" },
  discover: { label: "Discover", color: "orange", icon: "CreditCard" },
  diners: { label: "Diners Club", color: "gray", icon: "CreditCard" },
  jcb: { label: "JCB", color: "blue", icon: "CreditCard" },
  unionpay: { label: "UnionPay", color: "red", icon: "CreditCard" },
  unknown: { label: "Unknown", color: "gray", icon: "CreditCard" },
} as const

// Billing event types with display info
export const BILLING_EVENT_TYPES = {
  PAYMENT_SUCCESS: {
    label: "Payment Successful",
    color: "green",
    icon: "CircleCheck",
  },
  PAYMENT_FAILED: {
    label: "Payment Failed",
    color: "red",
    icon: "CircleX",
  },
  REFUND: {
    label: "Refund Processed",
    color: "blue",
    icon: "ArrowBackUp",
  },
  CREDIT_APPLIED: {
    label: "Credit Applied",
    color: "purple",
    icon: "Discount",
  },
  SUBSCRIPTION_CREATED: {
    label: "Subscription Created",
    color: "green",
    icon: "Plus",
  },
  SUBSCRIPTION_UPDATED: {
    label: "Subscription Updated",
    color: "blue",
    icon: "Edit",
  },
  SUBSCRIPTION_CANCELLED: {
    label: "Subscription Cancelled",
    color: "orange",
    icon: "X",
  },
  SUBSCRIPTION_RENEWED: {
    label: "Subscription Renewed",
    color: "green",
    icon: "Refresh",
  },
  INVOICE_CREATED: {
    label: "Invoice Created",
    color: "gray",
    icon: "FileText",
  },
  INVOICE_PAID: {
    label: "Invoice Paid",
    color: "green",
    icon: "FileCheck",
  },
  INVOICE_VOIDED: {
    label: "Invoice Voided",
    color: "red",
    icon: "FileX",
  },
  PAYMENT_METHOD_ADDED: {
    label: "Payment Method Added",
    color: "green",
    icon: "CreditCardPlus",
  },
  PAYMENT_METHOD_UPDATED: {
    label: "Payment Method Updated",
    color: "blue",
    icon: "CreditCardRefresh",
  },
  PAYMENT_METHOD_REMOVED: {
    label: "Payment Method Removed",
    color: "red",
    icon: "CreditCardOff",
  },
} as const

// Billing status with colors
export const BILLING_STATUS = {
  SUCCESS: { label: "Success", color: "green", variant: "default" },
  FAILED: { label: "Failed", color: "red", variant: "destructive" },
  PENDING: { label: "Pending", color: "yellow", variant: "outline" },
  CANCELLED: { label: "Cancelled", color: "gray", variant: "secondary" },
  PROCESSING: { label: "Processing", color: "blue", variant: "outline" },
} as const

// Invoice status with colors
export const INVOICE_STATUS = {
  draft: { label: "Draft", color: "gray", variant: "outline" },
  open: { label: "Open", color: "blue", variant: "default" },
  paid: { label: "Paid", color: "green", variant: "default" },
  uncollectible: {
    label: "Uncollectible",
    color: "orange",
    variant: "outline",
  },
  void: { label: "Void", color: "red", variant: "destructive" },
} as const

// Subscription status with colors
export const SUBSCRIPTION_STATUS = {
  active: { label: "Active", color: "green", variant: "default" },
  past_due: { label: "Past Due", color: "orange", variant: "outline" },
  canceled: { label: "Canceled", color: "red", variant: "destructive" },
  cancelled: { label: "Cancelled", color: "red", variant: "destructive" },
  incomplete: { label: "Incomplete", color: "yellow", variant: "outline" },
  incomplete_expired: {
    label: "Incomplete Expired",
    color: "red",
    variant: "destructive",
  },
  trialing: { label: "Trial", color: "blue", variant: "outline" },
  unpaid: { label: "Unpaid", color: "orange", variant: "destructive" },
  paused: { label: "Paused", color: "gray", variant: "secondary" },
} as const

// Credit note types
export const CREDIT_TYPES = {
  REFUND: { label: "Refund", color: "blue", icon: "ArrowBackUp" },
  PROMOTIONAL: { label: "Promotional", color: "purple", icon: "Gift" },
  ADJUSTMENT: { label: "Adjustment", color: "yellow", icon: "AdjustmentsAlt" },
  GOODWILL: { label: "Goodwill", color: "green", icon: "Heart" },
  COMPENSATION: { label: "Compensation", color: "orange", icon: "Receipt" },
  REFERRAL: { label: "Referral Bonus", color: "indigo", icon: "Users" },
} as const

// Credit status
export const CREDIT_STATUS = {
  ACTIVE: { label: "Active", color: "green", variant: "default" },
  EXPIRED: { label: "Expired", color: "gray", variant: "outline" },
  FULLY_USED: { label: "Fully Used", color: "blue", variant: "secondary" },
  CANCELLED: { label: "Cancelled", color: "red", variant: "destructive" },
} as const

// Usage warning thresholds
export const USAGE_THRESHOLDS = {
  INFO: 70, // Show info at 70%
  WARNING: 85, // Show warning at 85%
  CRITICAL: 95, // Show critical at 95%
} as const

// Usage warning messages
export const USAGE_WARNING_MESSAGES = {
  students: {
    INFO: "You're approaching your student limit",
    WARNING: "You're nearing your student limit - consider upgrading",
    CRITICAL:
      "You're very close to your student limit - upgrade now to avoid disruption",
  },
  teachers: {
    INFO: "You're approaching your teacher limit",
    WARNING: "You're nearing your teacher limit - consider upgrading",
    CRITICAL:
      "You're very close to your teacher limit - upgrade now to avoid disruption",
  },
  classes: {
    INFO: "You're approaching your class limit",
    WARNING: "You're nearing your class limit - consider upgrading",
    CRITICAL:
      "You're very close to your class limit - upgrade now to avoid disruption",
  },
  storage: {
    INFO: "You're approaching your storage limit",
    WARNING: "You're nearing your storage limit - consider upgrading",
    CRITICAL:
      "You're very close to your storage limit - upgrade now to avoid disruption",
  },
} as const

// Currency symbols
export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CNY: "¥",
  SAR: "﷼",
  AED: "د.إ",
} as const

// Currency display names
export const CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound" },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar" },
} as const

// Supported billing intervals
export const BILLING_INTERVALS = {
  monthly: { label: "Monthly", value: "monthly" },
  annual: { label: "Annual", value: "annual", discount: "Save 20%" },
} as const

// Payment retry configuration
export const PAYMENT_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_INTERVALS: [3, 5, 7], // Days between retries
  DUNNING_PERIOD: 14, // Days before final cancellation
} as const

// Email notification templates
export const EMAIL_TEMPLATES = {
  PAYMENT_SUCCESS: "payment-success",
  PAYMENT_FAILED: "payment-failed",
  UPCOMING_RENEWAL: "upcoming-renewal",
  SUBSCRIPTION_CANCELLED: "subscription-cancelled",
  USAGE_WARNING: "usage-warning",
  INVOICE_CREATED: "invoice-created",
  CREDIT_APPLIED: "credit-applied",
} as const

// Feature flags for billing module
export const BILLING_FEATURES = {
  STRIPE_ENABLED: true,
  PAYPAL_ENABLED: true,
  BANK_ACCOUNTS_ENABLED: true,
  MANUAL_PAYMENTS_ENABLED: true,
  CREDITS_ENABLED: true,
  DISCOUNTS_ENABLED: true,
  USAGE_TRACKING_ENABLED: true,
  AUTO_BILLING_ENABLED: true,
  DUNNING_ENABLED: true,
  TAX_CALCULATION_ENABLED: true,
} as const

// Default billing preferences
export const DEFAULT_BILLING_PREFERENCES = {
  autoPayEnabled: true,
  paymentRetries: 3,
  retryInterval: 3,
  sendPaymentSuccess: true,
  sendPaymentFailed: true,
  sendUpcomingRenewal: true,
  sendUsageWarnings: true,
  reminderDaysBefore: 7,
  invoicePrefix: "INV",
  invoiceNumbering: 1000,
  taxEnabled: false,
  currency: "USD",
  locale: "en",
  budgetAlertEnabled: false,
} as const

// Chart colors for analytics
export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  error: "hsl(0, 72%, 51%)",
  info: "hsl(217, 91%, 60%)",
  purple: "hsl(271, 81%, 56%)",
  orange: "hsl(25, 95%, 53%)",
} as const

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// Date range presets for filters
export const DATE_RANGE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last year", days: 365 },
] as const

// Export format options
export const EXPORT_FORMATS = {
  CSV: { label: "CSV", extension: "csv", mimeType: "text/csv" },
  EXCEL: {
    label: "Excel",
    extension: "xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  PDF: { label: "PDF", extension: "pdf", mimeType: "application/pdf" },
} as const

// Billing alert severity levels
export const ALERT_SEVERITY = {
  INFO: { label: "Info", color: "blue", variant: "default" },
  WARNING: { label: "Warning", color: "yellow", variant: "outline" },
  ERROR: { label: "Error", color: "red", variant: "destructive" },
} as const

// Format currency helper
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100) // Convert cents to dollars
}

// Format date helper
export function formatBillingDate(
  date: Date | string,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

// Calculate usage percentage
export function calculateUsagePercentage(
  current: number,
  limit: number
): number {
  if (limit === 0) return 0
  return Math.round((current / limit) * 100)
}

// Get usage severity
export function getUsageSeverity(
  percentage: number
): "info" | "warning" | "critical" {
  if (percentage >= USAGE_THRESHOLDS.CRITICAL) return "critical"
  if (percentage >= USAGE_THRESHOLDS.WARNING) return "warning"
  return "info"
}

// Determine if usage warning should be shown
export function shouldShowUsageWarning(percentage: number): boolean {
  return percentage >= USAGE_THRESHOLDS.INFO
}
