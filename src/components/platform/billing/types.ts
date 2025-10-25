import type {
  Subscription,
  SubscriptionTier,
  Invoice,
  BillingPaymentMethod,
  BillingHistory,
  UsageMetrics,
  CreditNote,
  BillingPreferences,
  Discount,
} from "@prisma/client";

// Extended types with relationships
export type SubscriptionWithTier = Subscription & {
  subscriptionTier: SubscriptionTier;
};

export type InvoiceWithDetails = Invoice & {
  appliedDiscounts?: {
    id: string;
    amount: number;
    discount: Discount;
  }[];
  receipts?: {
    id: string;
    fileName: string;
    fileUrl: string | null;
    status: string;
  }[];
};

export type PaymentMethodWithUser = BillingPaymentMethod & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type BillingHistoryWithDetails = BillingHistory & {
  paymentMethod?: BillingPaymentMethod | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

export type CreditNoteWithUser = CreditNote & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
};

// Dashboard statistics
export interface BillingStats {
  // Current subscription
  currentPlan: string;
  planStatus: string;
  nextBillingDate: Date | null;
  nextPaymentAmount: number;

  // Financial metrics
  totalSpent: number;
  currentPeriodSpent: number;
  averageMonthlySpend: number;
  projectedAnnualCost: number;

  // Payment health
  successfulPayments: number;
  failedPayments: number;
  paymentSuccessRate: number;
  outstandingBalance: number;

  // Credits and discounts
  totalCredits: number;
  availableCredits: number;
  totalDiscountsApplied: number;

  // Usage metrics
  currentUsage: {
    students: number;
    teachers: number;
    classes: number;
    storage: number;
  };
  limits: {
    students: number;
    teachers: number;
    classes: number;
    storage: number;
  };
  usagePercentages: {
    students: number;
    teachers: number;
    classes: number;
    storage: number;
  };

  // Historical data
  monthlySpending: {
    month: string;
    amount: number;
  }[];
}

// Subscription update request
export interface SubscriptionUpdateRequest {
  tierId: string;
  billingInterval: "monthly" | "annual";
  prorationBehavior: "create_prorations" | "none" | "always_invoice";
}

// Payment method add request
export interface AddPaymentMethodRequest {
  type: string;
  provider: string;
  stripePaymentMethodId?: string;
  billingName?: string;
  billingEmail?: string;
  billingAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  isDefault?: boolean;
}

// Discount application request
export interface ApplyDiscountRequest {
  code: string;
  subscriptionId?: string;
}

// Credit note creation request
export interface CreateCreditNoteRequest {
  amount: number;
  type: "REFUND" | "PROMOTIONAL" | "ADJUSTMENT" | "GOODWILL" | "COMPENSATION" | "REFERRAL";
  reason: string;
  invoiceId?: string;
  validUntil?: Date;
  notes?: string;
}

// Billing preferences update
export interface UpdateBillingPreferencesRequest {
  autoPayEnabled?: boolean;
  paymentRetries?: number;
  retryInterval?: number;
  sendPaymentSuccess?: boolean;
  sendPaymentFailed?: boolean;
  sendUpcomingRenewal?: boolean;
  sendUsageWarnings?: boolean;
  reminderDaysBefore?: number;
  invoicePrefix?: string;
  invoiceLogo?: string;
  invoiceFooter?: string;
  taxEnabled?: boolean;
  taxId?: string;
  taxRate?: number;
  taxName?: string;
  currency?: string;
  locale?: string;
  budgetAlertEnabled?: boolean;
  monthlyBudgetLimit?: number;
}

// Invoice filters
export interface InvoiceFilters {
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

// Billing history filters
export interface BillingHistoryFilters {
  type?: string[];
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

// Payment processing result
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  amount: number;
  status: string;
  errorCode?: string;
  errorMessage?: string;
}

// Subscription cancellation request
export interface CancelSubscriptionRequest {
  reason?: string;
  feedback?: string;
  cancelAtPeriodEnd: boolean;
  requestRefund?: boolean;
}

// Plan comparison data
export interface PlanComparison {
  tiers: SubscriptionTier[];
  currentTierId: string;
  features: {
    name: string;
    description: string;
    tiers: {
      [tierId: string]: boolean | string | number;
    };
  }[];
}

// Usage warning
export interface UsageWarning {
  resource: "students" | "teachers" | "classes" | "storage";
  current: number;
  limit: number;
  percentage: number;
  severity: "info" | "warning" | "critical";
  message: string;
}

// Billing alert
export interface BillingAlert {
  id: string;
  type: "payment_failed" | "upcoming_renewal" | "usage_limit" | "subscription_cancelled" | "credit_expiring";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  createdAt: Date;
  dismissible: boolean;
}

// Chart data types
export interface SpendingChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface UsageChartData {
  resource: string;
  used: number;
  available: number;
  percentage: number;
}

// API response types
export type BillingActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Stripe-specific types
export interface StripeSubscriptionOptions {
  priceId: string;
  customerId: string;
  paymentMethodId?: string;
  trialDays?: number;
  metadata?: Record<string, string>;
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: {
      id: string;
      [key: string]: unknown;
    };
  };
}

// Export all for convenience
export type {
  Subscription,
  SubscriptionTier,
  Invoice,
  BillingPaymentMethod,
  BillingHistory,
  UsageMetrics,
  CreditNote,
  BillingPreferences,
  Discount,
};
