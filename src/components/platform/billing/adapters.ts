/**
 * Data Adapters for BillingSDK Components
 *
 * Transforms existing Prisma/database types to BillingSDK component props.
 */

import type { Invoice, BillingPaymentMethod, UsageMetrics } from "@prisma/client";
import type {
  Plan,
  CurrentPlan,
  InvoiceItem,
  UsageResource,
  ChargeItem,
  PaymentCard,
} from "@/lib/billingsdk-config";
import { plans, getPlanById } from "@/lib/billingsdk-config";
import type { SubscriptionWithTier } from "./types";

// ========== Subscription Adapters ==========

/**
 * Convert DB subscription to BillingSDK CurrentPlan
 */
export function toCurrentPlan(subscription: SubscriptionWithTier): CurrentPlan {
  const planId = subscription.subscriptionTier?.name?.toLowerCase() || "hobby";
  const plan = getPlanById(planId) || plans[0];

  const billingType = subscription.stripePriceId?.includes("yearly") ? "yearly" : "monthly";

  const statusMap: Record<string, CurrentPlan["status"]> = {
    active: "active",
    trialing: "active",
    past_due: "past_due",
    canceled: "cancelled",
    cancelled: "cancelled",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "inactive",
  };

  return {
    plan,
    type: billingType,
    price: `$${subscription.subscriptionTier?.monthlyPrice || 0}`,
    nextBillingDate: subscription.currentPeriodEnd
      ? formatDate(subscription.currentPeriodEnd)
      : "N/A",
    paymentMethod: "Credit Card", // Default - can be enhanced with actual payment method
    status: statusMap[subscription.status] || "active",
  };
}

/**
 * Get plan from subscription tier name
 */
export function getPlanFromTier(tierName: string): Plan {
  const planId = tierName.toLowerCase();
  return getPlanById(planId) || plans[0];
}

// ========== Invoice Adapters ==========

/**
 * Convert DB invoices to BillingSDK InvoiceItem[]
 */
export function toInvoiceItems(invoices: Invoice[]): InvoiceItem[] {
  return invoices.map((invoice) => ({
    id: invoice.id,
    date: formatDate(invoice.createdAt),
    amount: formatCurrency(invoice.amountDue),
    status: mapInvoiceStatus(invoice.status),
    invoiceUrl: undefined, // PDF URL from Stripe would be fetched separately
    description: `Invoice #${invoice.stripeInvoiceId?.slice(-8) || invoice.id.slice(-8)}`,
  }));
}

function mapInvoiceStatus(status: string): InvoiceItem["status"] {
  const statusMap: Record<string, InvoiceItem["status"]> = {
    paid: "paid",
    open: "open",
    void: "void",
    uncollectible: "void",
    draft: "open",
    refunded: "refunded",
  };
  return statusMap[status] || "open";
}

// ========== Usage Adapters ==========

/**
 * Convert usage metrics to BillingSDK UsageResource[]
 */
export function toUsageResources(
  metrics: UsageMetrics | null,
  limits: { students: number; teachers: number; classes: number; storage: number }
): UsageResource[] {
  if (!metrics) {
    return [
      { name: "Students", used: 0, limit: limits.students, unit: "users" },
      { name: "Teachers", used: 0, limit: limits.teachers, unit: "users" },
      { name: "Classes", used: 0, limit: limits.classes, unit: "classes" },
      { name: "Storage", used: 0, limit: limits.storage, unit: "MB" },
    ];
  }

  return [
    {
      name: "Students",
      used: metrics.currentStudents,
      limit: limits.students === -1 ? 999999 : limits.students,
      percentage: limits.students === -1 ? 0 : Math.round((metrics.currentStudents / limits.students) * 100),
      unit: "users",
    },
    {
      name: "Teachers",
      used: metrics.currentTeachers,
      limit: limits.teachers === -1 ? 999999 : limits.teachers,
      percentage: limits.teachers === -1 ? 0 : Math.round((metrics.currentTeachers / limits.teachers) * 100),
      unit: "users",
    },
    {
      name: "Classes",
      used: metrics.currentClasses,
      limit: limits.classes === -1 ? 999999 : limits.classes,
      percentage: limits.classes === -1 ? 0 : Math.round((metrics.currentClasses / limits.classes) * 100),
      unit: "classes",
    },
    {
      name: "Storage",
      used: metrics.currentStorage,
      limit: limits.storage === -1 ? 999999 : limits.storage,
      percentage: limits.storage === -1 ? 0 : Math.round((metrics.currentStorage / limits.storage) * 100),
      unit: "MB",
    },
  ];
}

// ========== Payment Method Adapters ==========

/**
 * Convert DB payment methods to BillingSDK PaymentCard[]
 */
export function toPaymentCards(methods: BillingPaymentMethod[]): PaymentCard[] {
  return methods.map((method) => ({
    id: method.id,
    last4: method.cardLast4 || "****",
    brand: method.cardBrand || "Card",
    expiry: method.cardExpMonth && method.cardExpYear
      ? `${String(method.cardExpMonth).padStart(2, '0')}/${String(method.cardExpYear).slice(-2)}`
      : "**/**",
    primary: method.isDefault,
  }));
}

// ========== Charge Adapters ==========

/**
 * Create upcoming charges from subscription
 */
export function toUpcomingCharges(
  subscription: SubscriptionWithTier,
  additionalCharges: Array<{ description: string; amount: number; type: ChargeItem["type"] }> = []
): ChargeItem[] {
  const billingDate = subscription.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : formatDate(new Date());

  const baseCharge: ChargeItem = {
    id: "base_subscription",
    description: `${subscription.subscriptionTier?.name || "Pro"} Plan (Monthly)`,
    amount: formatCurrency(subscription.subscriptionTier?.monthlyPrice || 0),
    date: billingDate,
    type: "recurring",
  };

  const charges: ChargeItem[] = [baseCharge];

  // Add any additional charges (prorated, one-time, etc.)
  additionalCharges.forEach((charge, index) => {
    charges.push({
      id: `charge_${index}`,
      description: charge.description,
      amount: formatCurrency(charge.amount),
      date: billingDate,
      type: charge.type,
    });
  });

  return charges;
}

/**
 * Calculate total from charges
 */
export function calculateTotal(charges: ChargeItem[]): string {
  const total = charges.reduce((sum, charge) => {
    const amount = parseFloat(charge.amount.replace(/[^0-9.-]+/g, ""));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  return formatCurrency(total * 100); // Convert to cents for formatCurrency
}

// ========== Utility Functions ==========

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format currency (amount in cents to display string)
 */
export function formatCurrency(amountInCents: number): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format currency from dollars
 */
export function formatDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Calculate days until date
 */
export function daysUntil(date: Date | string | null): number {
  if (!date) return 0;
  const target = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if subscription is on trial
 */
export function isOnTrial(subscription: SubscriptionWithTier): boolean {
  return subscription.status === "trialing";
}

/**
 * Get trial end date if on trial
 */
export function getTrialEndDate(subscription: SubscriptionWithTier): Date | null {
  if (subscription.status !== "trialing") return null;
  // Assuming trial ends at current period end during trial
  return subscription.currentPeriodEnd;
}
