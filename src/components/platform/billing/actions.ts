/**
 * Billing Server Actions Module
 *
 * RESPONSIBILITY: School billing and subscription management - track fees, process payments, generate invoices
 *
 * WHAT IT HANDLES:
 * - Subscription management: Plans, billing cycles, seat management for school instance
 * - Fee management: Create, update, assign fees to students (tuition, activities, uniforms)
 * - Payment processing: Record manual payments, integrate with payment gateways
 * - Invoice generation: Create and manage student/family invoices
 * - Financial reports: Revenue, outstanding balances, payment tracking
 * - Multi-currency support: Handle international transactions
 *
 * KEY ALGORITHMS:
 * 1. Subscription billing: Calculate seats used vs paid (per student enrollment)
 * 2. Fee assignment: One-to-many (fee can apply to multiple students/classes)
 * 3. Invoice generation: Aggregate all fees for student in period, calculate totals + taxes
 * 4. Payment tracking: Match received payments to invoices using reference numbers
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL subscriptions scoped to schoolId (one school = one subscription)
 * - Fee assignment validates student belongs to school
 * - Payment records must reference school's invoices only
 * - Invoices generated only for students in school
 * - Financial reports filtered by schoolId (no cross-school rollups)
 * - Currency conversion only allowed by system (prevent school manipulation)
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. Subscription seats are enforced - cannot exceed paid seats (but app doesn't auto-limit enrollment)
 *    (Workaround: Manual email warning to admin when over limit)
 * 2. Fees can be:
 *    - Optional (parent can choose): Activity fees, optional transport
 *    - Required: Tuition, mandatory uniforms
 *    - Recurring: Monthly/termly charges
 *    - One-time: Registration, exam fees
 * 3. Discounts are applied at invoice level, not fee level (aggregates first, then discounts)
 * 4. Payment status: NOT PAID > PARTIAL > PAID (can overpay - creates credit)
 * 5. Currency codes stored in fee, not school (allows mixed-currency fees rare edge case)
 *
 * SUBSCRIPTION LIFECYCLE:
 * - Trial period: 30 days free (included in plan)
 * - Auto-renewal: Monthly/yearly based on billingCycle
 * - Dunning: Failed payments trigger retry + warning emails
 * - Cancellation: Soft-cancel (access revoked but data retained)
 * - Churn prevention: Email offer before auto-renewal
 *
 * PAYMENT INTEGRATION:
 * - Stripe integration: Payment gateway for CC/bank transfers (not implemented yet)
 * - Manual payment entry: Admin records offline payments (check, wire transfer, cash)
 * - Payment matching: Reference number links payment to invoice
 * - Webhooks: Stripe sends payment confirmations (requires listener)
 *
 * INVOICE MANAGEMENT:
 * - Auto-generated: On student enrollment (creates semester invoice)
 * - Manual generation: Admin can regenerate for adjustments
 * - PDF export: Generate printable invoice with school branding
 * - Email delivery: Send to parents (with payment link)
 * - Payment links: Include Stripe checkout URL (requires integration)
 *
 * FINANCIAL REPORTS:
 * - Revenue dashboard: Total collected, by payment method
 * - Accounts receivable: Outstanding balances by student/class
 * - Cash flow: Payment timing and patterns
 * - Aging report: Overdue invoices by days (30/60/90+)
 * - Budget vs actual: Compare to financial targets
 *
 * PERFORMANCE NOTES:
 * - Invoice generation aggregates fees: O(n) students × O(m) fees = O(n×m)
 * - Consider caching generated invoices (immutable after student pays)
 * - Payment reconciliation queries large result sets - batch processing recommended
 * - Subscription upgrade/downgrade may recalculate mid-cycle - track proration
 *
 * PERMISSION NOTES:
 * - School admin (ACCOUNTANT role) manages billing
 * - Parents view own invoices and payment status
 * - School finance team generates reports
 * - Platform admin can view across schools
 *
 * TAX & COMPLIANCE:
 * - Tax calculation: % of fee amount (e.g., 15% VAT)
 * - Tax ID storage: School tax number for invoices (required in some regions)
 * - Compliance note: PCI-DSS for payment processing (use Stripe, don't store CC)
 * - Audit trail: All payment changes logged with actor + timestamp
 *
 * FUTURE IMPROVEMENTS:
 * - Implement Stripe payment gateway integration
 * - Add installment plans (pay semester in 3 months)
 * - Support fee waivers (need approval workflow)
 * - Implement financial aid/scholarships
 * - Add sibling discounts
 * - Support EFT/auto-pay enrollment
 * - Implement dunning management (retry failed payments)
 * - Add multi-currency invoicing (international families)
 * - Support payment reminders (email on due date)
 * - Implement revenue recognition (accounting standards)
 * - Add financial forecasting (project cash flow)
 * - Support student fee customization (different per student)
 */

"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { stripe } from "@/components/marketing/pricing/lib/stripe"

import { PAYMENT_RETRY_CONFIG } from "./config"
import type {
  BillingActionResult,
  BillingHistoryWithDetails,
  BillingStats,
  InvoiceWithDetails,
  PaymentMethodWithUser,
  SubscriptionWithTier,
} from "./types"
import {
  addPaymentMethodSchema,
  applyDiscountSchema,
  billingHistoryFilterSchema,
  cancelSubscriptionSchema,
  createBillingHistorySchema,
  createCreditNoteSchema,
  invoiceFilterSchema,
  processPaymentSchema,
  subscriptionUpdateSchema,
  updateBillingPreferencesSchema,
  updatePaymentMethodSchema,
  updateUsageMetricsSchema,
} from "./validation"

// ========== SUBSCRIPTION ACTIONS ==========

/**
 * Get current subscription details with tier information
 */
export async function getSubscriptionDetails(): Promise<
  BillingActionResult<SubscriptionWithTier | null>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const subscription = await db.subscription.findFirst({
      where: { schoolId },
      include: {
        subscriptionTier: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return { success: true, data: subscription }
  } catch (error) {
    console.error("Error fetching subscription:", error)
    return { success: false, error: "Failed to fetch subscription details" }
  }
}

/**
 * Get all available subscription tiers
 */
export async function getSubscriptionTiers(): Promise<
  BillingActionResult<any[]>
> {
  try {
    const tiers = await db.subscriptionTier.findMany({
      where: { isActive: true },
      orderBy: [{ monthlyPrice: "asc" }],
    })

    return { success: true, data: tiers }
  } catch (error) {
    console.error("Error fetching subscription tiers:", error)
    return { success: false, error: "Failed to fetch subscription tiers" }
  }
}

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription(
  input: unknown
): Promise<BillingActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = subscriptionUpdateSchema.parse(input)

    // Get current subscription
    const currentSubscription = await db.subscription.findFirst({
      where: { schoolId },
      include: { subscriptionTier: true },
    })

    if (!currentSubscription) {
      return { success: false, error: "No active subscription found" }
    }

    // Get new tier
    const newTier = await db.subscriptionTier.findUnique({
      where: { id: validated.tierId },
    })

    if (!newTier) {
      return { success: false, error: "Invalid subscription tier" }
    }

    // Update subscription via Stripe
    const stripePriceId =
      validated.billingInterval === "monthly"
        ? newTier.monthlyPriceStripeId
        : newTier.yearlyPriceStripeId

    if (!stripePriceId) {
      return { success: false, error: "Price not configured for this tier" }
    }

    if (!stripe) {
      return { success: false, error: "Stripe is not configured" }
    }

    const updatedStripeSubscription = await stripe.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentSubscription.stripePriceId,
            price: stripePriceId,
          },
        ],
        proration_behavior: validated.prorationBehavior,
      }
    )

    // Update in database
    const updatedSubscription = await db.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        tierId: validated.tierId,
        stripePriceId,
        currentPeriodEnd: new Date(
          (updatedStripeSubscription as any).current_period_end * 1000
        ),
      },
      include: { subscriptionTier: true },
    })

    // Log billing history
    await logBillingEvent({
      type: "SUBSCRIPTION_UPDATED",
      status: "SUCCESS",
      amount: newTier.monthlyPrice,
      currency: "USD",
      description: `Subscription updated from ${currentSubscription.subscriptionTier.name} to ${newTier.name}`,
      subscriptionId: updatedSubscription.id,
      metadata: {
        oldTier: currentSubscription.tierId,
        newTier: validated.tierId,
      },
    })

    revalidatePath("/billing")
    return { success: true, data: updatedSubscription }
  } catch (error) {
    console.error("Error updating subscription:", error)
    return { success: false, error: "Failed to update subscription" }
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  input: unknown
): Promise<BillingActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = cancelSubscriptionSchema.parse(input)

    const subscription = await db.subscription.findFirst({
      where: { schoolId },
    })

    if (!subscription) {
      return { success: false, error: "No active subscription found" }
    }

    if (!stripe) {
      return { success: false, error: "Stripe is not configured" }
    }

    // Cancel in Stripe
    if (validated.cancelAtPeriodEnd) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
    } else {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    }

    // Update database
    const updatedSubscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: validated.cancelAtPeriodEnd,
        status: validated.cancelAtPeriodEnd ? "active" : "canceled",
      },
    })

    // Log event
    await logBillingEvent({
      type: "SUBSCRIPTION_CANCELLED",
      status: "SUCCESS",
      amount: 0,
      currency: "USD",
      description: `Subscription cancelled ${validated.cancelAtPeriodEnd ? "at period end" : "immediately"}`,
      subscriptionId: subscription.id,
      metadata: { reason: validated.reason, feedback: validated.feedback },
    })

    revalidatePath("/billing")
    return { success: true, data: updatedSubscription }
  } catch (error) {
    console.error("Error cancelling subscription:", error)
    return { success: false, error: "Failed to cancel subscription" }
  }
}

// ========== PAYMENT METHOD ACTIONS ==========

/**
 * Get all payment methods for the school
 */
export async function getPaymentMethods(): Promise<
  BillingActionResult<PaymentMethodWithUser[]>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const paymentMethods = await db.billingPaymentMethod.findMany({
      where: { schoolId, status: "active" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return { success: true, data: paymentMethods }
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return { success: false, error: "Failed to fetch payment methods" }
  }
}

/**
 * Add new payment method
 */
export async function addPaymentMethod(
  input: unknown
): Promise<BillingActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = addPaymentMethodSchema.parse(input)

    // If setting as default, unset other defaults
    if (validated.isDefault) {
      await db.billingPaymentMethod.updateMany({
        where: { schoolId, isDefault: true },
        data: { isDefault: false },
      })
    }

    const paymentMethod = await db.billingPaymentMethod.create({
      data: {
        schoolId,
        userId: session.user.id!,
        type: validated.type as any,
        provider: validated.provider,
        stripePaymentMethodId: validated.stripePaymentMethodId,
        billingName: validated.billingName,
        billingEmail: validated.billingEmail,
        billingAddress: validated.billingAddress,
        isDefault: validated.isDefault,
        isVerified: validated.type === "MANUAL",
      },
    })

    // Log event
    await logBillingEvent({
      type: "PAYMENT_METHOD_ADDED",
      status: "SUCCESS",
      amount: 0,
      currency: "USD",
      description: `Payment method added: ${validated.type}`,
      paymentMethodId: paymentMethod.id,
    })

    revalidatePath("/billing")
    return { success: true, data: paymentMethod }
  } catch (error) {
    console.error("Error adding payment method:", error)
    return { success: false, error: "Failed to add payment method" }
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string
): Promise<BillingActionResult<void>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Verify ownership
    const paymentMethod = await db.billingPaymentMethod.findFirst({
      where: { id: paymentMethodId, schoolId },
    })

    if (!paymentMethod) {
      return { success: false, error: "Payment method not found" }
    }

    // Unset all defaults
    await db.billingPaymentMethod.updateMany({
      where: { schoolId, isDefault: true },
      data: { isDefault: false },
    })

    // Set new default
    await db.billingPaymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    })

    revalidatePath("/billing")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error setting default payment method:", error)
    return { success: false, error: "Failed to set default payment method" }
  }
}

/**
 * Remove payment method
 */
export async function removePaymentMethod(
  paymentMethodId: string
): Promise<BillingActionResult<void>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const paymentMethod = await db.billingPaymentMethod.findFirst({
      where: { id: paymentMethodId, schoolId },
    })

    if (!paymentMethod) {
      return { success: false, error: "Payment method not found" }
    }

    // Don't allow removing the default payment method if there are others
    if (paymentMethod.isDefault) {
      const otherMethods = await db.billingPaymentMethod.count({
        where: { schoolId, id: { not: paymentMethodId }, status: "active" },
      })

      if (otherMethods > 0) {
        return {
          success: false,
          error:
            "Cannot remove default payment method. Please set another as default first.",
        }
      }
    }

    // Soft delete
    await db.billingPaymentMethod.update({
      where: { id: paymentMethodId },
      data: { status: "removed" },
    })

    // Log event
    await logBillingEvent({
      type: "PAYMENT_METHOD_REMOVED",
      status: "SUCCESS",
      amount: 0,
      currency: "USD",
      description: `Payment method removed: ${paymentMethod.type}`,
      paymentMethodId: paymentMethod.id,
    })

    revalidatePath("/billing")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("Error removing payment method:", error)
    return { success: false, error: "Failed to remove payment method" }
  }
}

// ========== INVOICE ACTIONS ==========

/**
 * Get invoices with filters and pagination
 */
export async function getInvoices(
  filters?: unknown
): Promise<
  BillingActionResult<{ invoices: InvoiceWithDetails[]; total: number }>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = filters
      ? invoiceFilterSchema.parse(filters)
      : invoiceFilterSchema.parse({})

    const where: any = { schoolId }

    // Apply filters
    if (validated.status && validated.status.length > 0) {
      where.status = { in: validated.status }
    }

    if (validated.dateFrom || validated.dateTo) {
      where.periodStart = {}
      if (validated.dateFrom) where.periodStart.gte = validated.dateFrom
      if (validated.dateTo) where.periodStart.lte = validated.dateTo
    }

    if (
      validated.amountMin !== undefined ||
      validated.amountMax !== undefined
    ) {
      where.amountDue = {}
      if (validated.amountMin !== undefined)
        where.amountDue.gte = validated.amountMin
      if (validated.amountMax !== undefined)
        where.amountDue.lte = validated.amountMax
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          appliedDiscounts: {
            include: {
              discount: true,
            },
          },
          receipts: {
            select: {
              id: true,
              fileName: true,
              fileUrl: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (validated.page - 1) * validated.limit,
        take: validated.limit,
      }),
      db.invoice.count({ where }),
    ])

    return { success: true, data: { invoices, total } }
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return { success: false, error: "Failed to fetch invoices" }
  }
}

// ========== BILLING HISTORY ACTIONS ==========

/**
 * Get billing history with filters
 */
export async function getBillingHistory(
  filters?: unknown
): Promise<
  BillingActionResult<{ history: BillingHistoryWithDetails[]; total: number }>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = filters
      ? billingHistoryFilterSchema.parse(filters)
      : billingHistoryFilterSchema.parse({})

    const where: any = { schoolId }

    // Apply filters
    if (validated.type && validated.type.length > 0) {
      where.type = { in: validated.type }
    }

    if (validated.status && validated.status.length > 0) {
      where.status = { in: validated.status }
    }

    if (validated.dateFrom || validated.dateTo) {
      where.createdAt = {}
      if (validated.dateFrom) where.createdAt.gte = validated.dateFrom
      if (validated.dateTo) where.createdAt.lte = validated.dateTo
    }

    const [history, total] = await Promise.all([
      db.billingHistory.findMany({
        where,
        include: {
          paymentMethod: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (validated.page - 1) * validated.limit,
        take: validated.limit,
      }),
      db.billingHistory.count({ where }),
    ])

    return { success: true, data: { history, total } }
  } catch (error) {
    console.error("Error fetching billing history:", error)
    return { success: false, error: "Failed to fetch billing history" }
  }
}

/**
 * Log billing event (internal helper)
 */
async function logBillingEvent(input: unknown): Promise<void> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      throw new Error("Unauthorized")
    }

    const validated = createBillingHistorySchema.parse(input)

    await db.billingHistory.create({
      data: {
        schoolId,
        userId: session.user.id!,
        type: validated.type as any,
        status: validated.status as any,
        amount: validated.amount,
        currency: validated.currency,
        description: validated.description,
        paymentProvider: validated.paymentProvider,
        transactionId: validated.transactionId,
        receiptUrl: validated.receiptUrl,
        metadata: validated.metadata as any,
        errorCode: validated.errorCode,
        errorMessage: validated.errorMessage,
        paymentMethodId: validated.paymentMethodId,
        subscriptionId: validated.subscriptionId,
        invoiceId: validated.invoiceId,
      },
    })
  } catch (error) {
    console.error("Error logging billing event:", error)
    // Don't throw - logging failures shouldn't break main flow
  }
}

// ========== BILLING STATS ACTIONS ==========

/**
 * Get comprehensive billing statistics
 */
export async function getBillingStats(): Promise<
  BillingActionResult<BillingStats>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get current subscription
    const subscription = await db.subscription.findFirst({
      where: { schoolId },
      include: { subscriptionTier: true },
    })

    if (!subscription) {
      return { success: false, error: "No active subscription" }
    }

    // Get all invoices
    const allInvoices = await db.invoice.findMany({
      where: { schoolId },
    })

    // Get current period invoices (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const currentPeriodInvoices = allInvoices.filter(
      (inv) => inv.createdAt >= thirtyDaysAgo
    )

    // Calculate metrics
    const totalSpent = allInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
    const currentPeriodSpent = currentPeriodInvoices.reduce(
      (sum, inv) => sum + inv.amountPaid,
      0
    )
    const outstandingBalance = allInvoices
      .filter((inv) => inv.status === "open")
      .reduce((sum, inv) => sum + (inv.amountDue - inv.amountPaid), 0)

    // Get payment success rate
    const billingHistory = await db.billingHistory.findMany({
      where: {
        schoolId,
        type: { in: ["PAYMENT_SUCCESS", "PAYMENT_FAILED"] },
      },
    })

    const successfulPayments = billingHistory.filter(
      (h) => h.type === "PAYMENT_SUCCESS"
    ).length
    const failedPayments = billingHistory.filter(
      (h) => h.type === "PAYMENT_FAILED"
    ).length
    const paymentSuccessRate =
      successfulPayments + failedPayments > 0
        ? (successfulPayments / (successfulPayments + failedPayments)) * 100
        : 100

    // Get usage metrics
    const usageMetrics = await db.usageMetrics.findFirst({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    })

    // Get monthly spending for last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const recentInvoices = await db.invoice.findMany({
      where: {
        schoolId,
        createdAt: { gte: twelveMonthsAgo },
      },
      orderBy: { createdAt: "asc" },
    })

    // Group by month
    const monthlySpending = []
    const months = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      months.push(
        date.toLocaleString("default", { month: "short", year: "numeric" })
      )
    }

    for (const month of months) {
      const monthInvoices = recentInvoices.filter((inv) => {
        const invMonth = inv.createdAt.toLocaleString("default", {
          month: "short",
          year: "numeric",
        })
        return invMonth === month
      })
      const amount = monthInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0)
      monthlySpending.push({ month, amount })
    }

    const stats: BillingStats = {
      currentPlan: subscription.subscriptionTier.name,
      planStatus: subscription.status,
      nextBillingDate: subscription.currentPeriodEnd,
      nextPaymentAmount: subscription.subscriptionTier.monthlyPrice,
      totalSpent,
      currentPeriodSpent,
      averageMonthlySpend:
        monthlySpending.reduce((sum, m) => sum + m.amount, 0) / 12,
      projectedAnnualCost: (currentPeriodSpent / 30) * 365,
      successfulPayments,
      failedPayments,
      paymentSuccessRate,
      outstandingBalance,
      totalCredits: 0,
      availableCredits: 0,
      totalDiscountsApplied: 0,
      currentUsage: {
        students: usageMetrics?.currentStudents || 0,
        teachers: usageMetrics?.currentTeachers || 0,
        classes: usageMetrics?.currentClasses || 0,
        storage: usageMetrics?.currentStorage || 0,
      },
      limits: {
        students: subscription.subscriptionTier.maxStudents,
        teachers: subscription.subscriptionTier.maxTeachers,
        classes: subscription.subscriptionTier.maxClasses,
        storage: 10000, // 10GB default
      },
      usagePercentages: {
        students: Math.round(
          ((usageMetrics?.currentStudents || 0) /
            subscription.subscriptionTier.maxStudents) *
            100
        ),
        teachers: Math.round(
          ((usageMetrics?.currentTeachers || 0) /
            subscription.subscriptionTier.maxTeachers) *
            100
        ),
        classes: Math.round(
          ((usageMetrics?.currentClasses || 0) /
            subscription.subscriptionTier.maxClasses) *
            100
        ),
        storage: Math.round(
          ((usageMetrics?.currentStorage || 0) / 10000) * 100
        ),
      },
      monthlySpending,
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error("Error fetching billing stats:", error)
    return { success: false, error: "Failed to fetch billing statistics" }
  }
}

// ========== USAGE METRICS ACTIONS ==========

/**
 * Update usage metrics for current billing period
 */
export async function updateUsageMetrics(
  input: unknown
): Promise<BillingActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = updateUsageMetricsSchema.parse(input)

    const subscription = await db.subscription.findFirst({
      where: { schoolId },
    })

    if (!subscription) {
      return { success: false, error: "No active subscription" }
    }

    const periodStart = new Date(subscription.currentPeriodEnd)
    periodStart.setMonth(periodStart.getMonth() - 1)

    const usageMetrics = await db.usageMetrics.upsert({
      where: {
        schoolId_subscriptionId_periodStart: {
          schoolId,
          subscriptionId: subscription.id,
          periodStart,
        },
      },
      update: {
        currentStudents: validated.currentStudents,
        currentTeachers: validated.currentTeachers,
        currentClasses: validated.currentClasses,
        currentStorage: validated.currentStorage,
        apiCallsThisMonth: validated.apiCallsThisMonth,
        emailsSentThisMonth: validated.emailsSentThisMonth,
        smssSentThisMonth: validated.smssSentThisMonth,
        featuresUsed: validated.featuresUsed as any,
      },
      create: {
        schoolId,
        subscriptionId: subscription.id,
        currentStudents: validated.currentStudents || 0,
        currentTeachers: validated.currentTeachers || 0,
        currentClasses: validated.currentClasses || 0,
        currentStorage: validated.currentStorage || 0,
        apiCallsThisMonth: validated.apiCallsThisMonth || 0,
        emailsSentThisMonth: validated.emailsSentThisMonth || 0,
        smssSentThisMonth: validated.smssSentThisMonth || 0,
        featuresUsed: validated.featuresUsed as any,
        periodStart,
        periodEnd: subscription.currentPeriodEnd,
      },
    })

    return { success: true, data: usageMetrics }
  } catch (error) {
    console.error("Error updating usage metrics:", error)
    return { success: false, error: "Failed to update usage metrics" }
  }
}

// ========== BILLING PREFERENCES ACTIONS ==========

/**
 * Get billing preferences
 */
export async function getBillingPreferences(): Promise<
  BillingActionResult<any>
> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    let preferences = await db.billingPreferences.findUnique({
      where: { schoolId },
    })

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await db.billingPreferences.create({
        data: { schoolId },
      })
    }

    return { success: true, data: preferences }
  } catch (error) {
    console.error("Error fetching billing preferences:", error)
    return { success: false, error: "Failed to fetch billing preferences" }
  }
}

/**
 * Update billing preferences
 */
export async function updateBillingPreferences(
  input: unknown
): Promise<BillingActionResult<any>> {
  try {
    const session = await auth()
    const { schoolId } = await getTenantContext()

    if (!session?.user || !schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const validated = updateBillingPreferencesSchema.parse(input)

    const preferences = await db.billingPreferences.upsert({
      where: { schoolId },
      update: validated,
      create: { schoolId, ...validated },
    })

    revalidatePath("/billing")
    return { success: true, data: preferences }
  } catch (error) {
    console.error("Error updating billing preferences:", error)
    return { success: false, error: "Failed to update billing preferences" }
  }
}

// ========== CUSTOMER PORTAL ACTION (existing) ==========

export async function openCustomerPortal(userStripeId: string) {
  try {
    if (!stripe) {
      throw new Error("Stripe is not configured")
    }

    const session = await auth()

    if (!session?.user || !session?.user.email) {
      throw new Error("Unauthorized")
    }

    if (userStripeId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: userStripeId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
      })

      redirect(stripeSession.url)
    }
  } catch (error) {
    throw new Error("Failed to generate user stripe session")
  }
}
