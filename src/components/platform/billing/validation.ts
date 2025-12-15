/**
 * Billing System Validation
 *
 * Comprehensive payment processing for school subscriptions including:
 * - Multi-provider support: Stripe, PayPal, manual invoicing
 * - Payment methods: Card, bank account, digital wallets (Apple/Google Pay)
 * - Subscription management: Monthly/annual billing with tier switching
 * - Discounts: Percentage (0-100%) or fixed amount, time-bound with usage limits
 * - Credit notes: Refunds, promotional credits, adjustments (6 types)
 * - Invoicing: Auto-generation, custom branding, tax calculations
 * - Retry logic: 0-5 attempts with configurable intervals (1-30 days)
 * - Budget tracking: Monthly limits with alerts
 * - Usage metrics: Student count, teacher count, classes, storage, API calls
 *
 * Key constraints:
 * - Prorations: How to handle mid-month tier changes
 *   - "create_prorations": Credit for unused days when downgrading
 *   - "none": No credit/charge (simpler, less fair)
 *   - "always_invoice": Always charge difference (aggressive)
 * - Tax: Optional per jurisdiction, stored as percentage * 100
 * - Currency: 3-letter ISO code (USD, GBP, EUR, etc.)
 * - Invoice status: draft → open → paid (or uncollectible/void)
 *
 * Why date range validation:
 * - Discount validFrom < validUntil (prevents invalid ranges)
 * - Period start < period end (prevents backward time travel)
 * - Future dates in batch notifications and scheduled payments
 * - Amount ranges: min <= max (for filter searches)
 */

import { z } from "zod";

// Subscription schemas
export const subscriptionUpdateSchema = z.object({
  tierId: z.string().cuid(),
  billingInterval: z.enum(["monthly", "annual"]),
  prorationBehavior: z.enum(["create_prorations", "none", "always_invoice"]).default("create_prorations"),
});

export const cancelSubscriptionSchema = z.object({
  reason: z.string().optional(),
  feedback: z.string().max(1000).optional(),
  cancelAtPeriodEnd: z.boolean().default(true),
  requestRefund: z.boolean().default(false),
});

// Payment method schemas
export const addPaymentMethodSchema = z.object({
  type: z.enum(["CARD", "BANK_ACCOUNT", "PAYPAL", "GOOGLE_PAY", "APPLE_PAY", "MANUAL", "OTHER"]),
  provider: z.string().min(1),
  stripePaymentMethodId: z.string().optional(),
  billingName: z.string().min(1).max(255).optional(),
  billingEmail: z.string().email().optional(),
  billingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.string().length(2), // ISO country code
  }).optional(),
  isDefault: z.boolean().default(false),
});

export const updatePaymentMethodSchema = z.object({
  billingName: z.string().min(1).max(255).optional(),
  billingEmail: z.string().email().optional(),
  billingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    country: z.string().length(2),
  }).optional(),
  isDefault: z.boolean().optional(),
});

export const setDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().cuid(),
});

export const removePaymentMethodSchema = z.object({
  paymentMethodId: z.string().cuid(),
});

// Discount schemas
export const applyDiscountSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  subscriptionId: z.string().cuid().optional(),
});

export const createDiscountSchema = z.object({
  tierId: z.string().cuid(),
  code: z.string().min(3).max(50).toUpperCase(),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().int().positive(),
  description: z.string().min(1).max(500),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  maxUses: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => data.validUntil > data.validFrom,
  {
    message: "Valid until date must be after valid from date",
    path: ["validUntil"],
  }
).refine(
  // Percentage discounts must not exceed 100% (prevent negative charges)
  // Why: 110% discount = customer pays negative amount = security issue
  (data) => data.type !== "percentage" || data.value <= 100,
  {
    message: "Percentage discount cannot exceed 100%",
    path: ["value"],
  }
);

// Credit note schemas
export const createCreditNoteSchema = z.object({
  amount: z.number().int().positive(),
  type: z.enum(["REFUND", "PROMOTIONAL", "ADJUSTMENT", "GOODWILL", "COMPENSATION", "REFERRAL"]),
  reason: z.string().min(10).max(1000),
  invoiceId: z.string().cuid().optional(),
  validUntil: z.coerce.date().optional(),
  notes: z.string().max(2000).optional(),
});

export const applyCreditSchema = z.object({
  creditNoteId: z.string().cuid(),
  invoiceId: z.string().cuid(),
  amount: z.number().int().positive(),
});

// Billing preferences schemas
export const updateBillingPreferencesSchema = z.object({
  // Payment preferences
  autoPayEnabled: z.boolean().optional(),
  paymentRetries: z.number().int().min(0).max(5).optional(),
  retryInterval: z.number().int().min(1).max(30).optional(), // days

  // Notification preferences
  sendPaymentSuccess: z.boolean().optional(),
  sendPaymentFailed: z.boolean().optional(),
  sendUpcomingRenewal: z.boolean().optional(),
  sendUsageWarnings: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(1).max(30).optional(),

  // Invoice preferences
  invoicePrefix: z.string().max(10).optional(),
  invoiceLogo: z.string().url().optional(),
  invoiceFooter: z.string().max(1000).optional(),

  // Tax settings
  taxEnabled: z.boolean().optional(),
  taxId: z.string().max(50).optional(),
  taxRate: z.number().int().min(0).max(10000).optional(), // Percentage * 100
  taxName: z.string().max(50).optional(),

  // Currency and locale
  currency: z.string().length(3).optional(), // ISO currency code
  locale: z.string().max(10).optional(),

  // Budget alerts
  budgetAlertEnabled: z.boolean().optional(),
  monthlyBudgetLimit: z.number().int().positive().optional(),
});

// Invoice schemas
export const createInvoiceSchema = z.object({
  subscriptionId: z.string().cuid(),
  amountDue: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
}).refine(
  (data) => data.periodEnd > data.periodStart,
  {
    message: "Period end must be after period start",
    path: ["periodEnd"],
  }
);

export const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "open", "paid", "uncollectible", "void"]).optional(),
  amountPaid: z.number().int().min(0).optional(),
});

export const invoiceFilterSchema = z.object({
  status: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.number().int().min(0).optional(),
  amountMax: z.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).refine(
  (data) => !data.amountMax || !data.amountMin || data.amountMax >= data.amountMin,
  {
    message: "Maximum amount must be greater than or equal to minimum amount",
    path: ["amountMax"],
  }
).refine(
  (data) => !data.dateTo || !data.dateFrom || data.dateTo >= data.dateFrom,
  {
    message: "End date must be after or equal to start date",
    path: ["dateTo"],
  }
);

// Billing history schemas
export const billingHistoryFilterSchema = z.object({
  type: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  amountMin: z.number().int().min(0).optional(),
  amountMax: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
}).refine(
  (data) => !data.amountMax || !data.amountMin || data.amountMax >= data.amountMin,
  {
    message: "Maximum amount must be greater than or equal to minimum amount",
    path: ["amountMax"],
  }
).refine(
  (data) => !data.dateTo || !data.dateFrom || data.dateTo >= data.dateFrom,
  {
    message: "End date must be after or equal to start date",
    path: ["dateTo"],
  }
);

export const createBillingHistorySchema = z.object({
  type: z.enum([
    "PAYMENT_SUCCESS",
    "PAYMENT_FAILED",
    "REFUND",
    "CREDIT_APPLIED",
    "SUBSCRIPTION_CREATED",
    "SUBSCRIPTION_UPDATED",
    "SUBSCRIPTION_CANCELLED",
    "SUBSCRIPTION_RENEWED",
    "INVOICE_CREATED",
    "INVOICE_PAID",
    "INVOICE_VOIDED",
    "PAYMENT_METHOD_ADDED",
    "PAYMENT_METHOD_UPDATED",
    "PAYMENT_METHOD_REMOVED",
  ]),
  status: z.enum(["SUCCESS", "FAILED", "PENDING", "CANCELLED", "PROCESSING"]),
  amount: z.number().int(),
  currency: z.string().length(3).default("USD"),
  description: z.string().min(1).max(500),
  paymentProvider: z.string().optional(),
  transactionId: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  paymentMethodId: z.string().cuid().optional(),
  subscriptionId: z.string().cuid().optional(),
  invoiceId: z.string().cuid().optional(),
});

// Usage metrics schemas
export const updateUsageMetricsSchema = z.object({
  subscriptionId: z.string().cuid(),
  currentStudents: z.number().int().min(0).optional(),
  currentTeachers: z.number().int().min(0).optional(),
  currentClasses: z.number().int().min(0).optional(),
  currentStorage: z.number().int().min(0).optional(), // in MB
  apiCallsThisMonth: z.number().int().min(0).optional(),
  emailsSentThisMonth: z.number().int().min(0).optional(),
  smssSentThisMonth: z.number().int().min(0).optional(),
  featuresUsed: z.record(z.string(), z.boolean()).optional(),
});

// Payment processing schemas
export const processPaymentSchema = z.object({
  invoiceId: z.string().cuid(),
  paymentMethodId: z.string().cuid(),
  amount: z.number().int().positive(),
  currency: z.string().length(3).default("USD"),
});

export const refundPaymentSchema = z.object({
  billingHistoryId: z.string().cuid(),
  amount: z.number().int().positive(),
  reason: z.string().min(10).max(500),
});

// Webhook schemas
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
});

// Export type inference helpers
export type SubscriptionUpdateInput = z.infer<typeof subscriptionUpdateSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;
export type ApplyDiscountInput = z.infer<typeof applyDiscountSchema>;
export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type CreateCreditNoteInput = z.infer<typeof createCreditNoteSchema>;
export type UpdateBillingPreferencesInput = z.infer<typeof updateBillingPreferencesSchema>;
export type InvoiceFilterInput = z.infer<typeof invoiceFilterSchema>;
export type BillingHistoryFilterInput = z.infer<typeof billingHistoryFilterSchema>;
export type CreateBillingHistoryInput = z.infer<typeof createBillingHistorySchema>;
export type UpdateUsageMetricsInput = z.infer<typeof updateUsageMetricsSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
