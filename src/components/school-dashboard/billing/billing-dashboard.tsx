"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { plans } from "@/lib/billingsdk-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BillingSettings } from "@/components/billingsdk/billing-settings"
import { BillingSettings2 } from "@/components/billingsdk/billing-settings-2"
import { DetailedUsageTable } from "@/components/billingsdk/detailed-usage-table"
import { InvoiceHistory } from "@/components/billingsdk/invoice-history"
import { PaymentCard } from "@/components/billingsdk/payment-card"
import { PaymentMethodSelector } from "@/components/billingsdk/payment-method-selector"
import { SubscriptionManagement } from "@/components/billingsdk/subscription-management"
import { TrialExpiryCard } from "@/components/billingsdk/trial-expiry-card"
import { UpcomingCharges } from "@/components/billingsdk/upcoming-charges"
import { UpdatePlanCard } from "@/components/billingsdk/update-plan-card"
import { UsageBasedPricing } from "@/components/billingsdk/usage-based-pricing"
import type { Locale } from "@/components/internationalization/config"

import {
  addPaymentMethod,
  cancelSubscription,
  updateBillingPreferences,
  updateSubscription,
} from "./actions"
import type { BillingStats, SubscriptionWithTier } from "./types"

interface BillingDashboardProps {
  subscription: SubscriptionWithTier | null
  tiers: any[]
  stats: BillingStats | null
  invoices: any[]
  paymentMethods: any[]
  preferences: any | null
  lang: Locale
}

function mapSubscriptionToPlan(sub: SubscriptionWithTier) {
  const tier = sub.subscriptionTier
  const matched = plans.find(
    (p) =>
      p.title.toLowerCase() === tier.name.toLowerCase() ||
      p.id === tier.name.toLowerCase()
  )
  if (matched) return matched
  return plans[0]
}

function formatDate(date: string | Date | null): string {
  if (!date) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

function formatAmount(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function BillingDashboard({
  subscription,
  tiers,
  stats,
  invoices,
  paymentMethods,
  preferences,
  lang,
}: BillingDashboardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Settings state
  const [activeTab, setActiveTab] = useState("general")
  const [emailNotifications, setEmailNotifications] = useState(
    preferences?.sendPaymentSuccess ?? true
  )
  const [usageAlerts, setUsageAlerts] = useState(
    preferences?.sendUsageWarnings ?? true
  )
  const [invoiceReminders, setInvoiceReminders] = useState(
    preferences?.sendUpcomingRenewal ?? false
  )
  const [invoiceFormat, setInvoiceFormat] = useState<"PDF" | "HTML">("PDF")
  const [overageProtection, setOverageProtection] = useState(
    preferences?.budgetAlertEnabled ?? true
  )
  const [usageLimitAlerts, setUsageLimitAlerts] = useState(
    preferences?.sendUsageWarnings ?? true
  )

  // Settings 2 state
  const [fullName, setFullName] = useState(preferences?.billingName ?? "")
  const [billingEmail, setBillingEmail] = useState(
    preferences?.billingEmail ?? ""
  )
  const [taxId, setTaxId] = useState(preferences?.taxId ?? "")
  const [currency, setCurrency] = useState(preferences?.currency ?? "USD")
  const [autoRenewal, setAutoRenewal] = useState(
    preferences?.autoPayEnabled ?? true
  )
  const [invoiceEmails, setInvoiceEmails] = useState(
    preferences?.sendPaymentSuccess ?? true
  )
  const [promotionalEmails, setPromotionalEmails] = useState(false)

  // Usage credits state
  const [credits, setCredits] = useState(stats?.currentUsage?.students ?? 0)

  // Map subscription to plan
  const currentPlan = subscription
    ? mapSubscriptionToPlan(subscription)
    : plans[0]

  // Build current plan data for SubscriptionManagement
  const currentPlanData = subscription
    ? {
        plan: currentPlan,
        type: "monthly" as const,
        price: formatAmount(subscription.subscriptionTier.monthlyPrice),
        nextBillingDate: formatDate(subscription.currentPeriodEnd),
        paymentMethod:
          paymentMethods.length > 0
            ? `${paymentMethods[0].type} ****${paymentMethods[0].stripePaymentMethodId?.slice(-4) ?? "****"}`
            : "No payment method",
        status: (subscription.status === "active"
          ? "active"
          : subscription.status === "past_due"
            ? "past_due"
            : subscription.status === "canceled"
              ? "cancelled"
              : "inactive") as "active" | "inactive" | "past_due" | "cancelled",
      }
    : {
        plan: plans[0],
        type: "monthly" as const,
        price: "Free",
        nextBillingDate: "N/A",
        paymentMethod: "None",
        status: "active" as const,
      }

  // Map invoices to InvoiceHistory format
  const invoiceItems = invoices.map((inv: any) => ({
    id: inv.id,
    date: formatDate(inv.createdAt),
    amount: formatAmount(inv.amountDue),
    status: (inv.status === "paid"
      ? "paid"
      : inv.status === "void"
        ? "void"
        : inv.status === "open"
          ? "open"
          : "paid") as "paid" | "refunded" | "open" | "void",
    description:
      inv.description || `Invoice ${inv.invoiceNumber || inv.id.slice(0, 8)}`,
  }))

  // Map usage stats to resources
  const usageResources = stats
    ? [
        {
          name: "Students",
          used: stats.currentUsage.students,
          limit: stats.limits.students,
          percentage: stats.usagePercentages.students,
          unit: "users",
        },
        {
          name: "Teachers",
          used: stats.currentUsage.teachers,
          limit: stats.limits.teachers,
          percentage: stats.usagePercentages.teachers,
          unit: "users",
        },
        {
          name: "Classes",
          used: stats.currentUsage.classes,
          limit: stats.limits.classes,
          percentage: stats.usagePercentages.classes,
          unit: "classes",
        },
        {
          name: "Storage",
          used: stats.currentUsage.storage,
          limit: stats.limits.storage,
          percentage: stats.usagePercentages.storage,
          unit: "MB",
        },
      ]
    : []

  // Upcoming charges
  const upcomingCharges = subscription
    ? [
        {
          id: "1",
          description: `${subscription.subscriptionTier.name} Plan (Monthly)`,
          amount: formatAmount(subscription.subscriptionTier.monthlyPrice),
          date: formatDate(subscription.currentPeriodEnd),
          type: "recurring" as const,
        },
      ]
    : []

  // Payment method cards for settings
  const settingsCards = paymentMethods.map((pm: any) => ({
    id: pm.id,
    last4: pm.stripePaymentMethodId?.slice(-4) ?? "****",
    brand: pm.type === "CARD" ? "Card" : pm.type,
    expiry: "N/A",
    primary: pm.isDefault,
  }))

  // Is trial (status string comparison)
  const isTrial = subscription?.status === "trialing"
  const trialEndDate = isTrial
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Estimate from status
    : null

  const handlePlanChange = (planId: string) => {
    const selectedTier = tiers.find(
      (t: any) => t.name.toLowerCase() === planId.toLowerCase()
    )
    if (!selectedTier) return

    startTransition(async () => {
      await updateSubscription({
        tierId: selectedTier.id,
        billingInterval: "monthly",
        prorationBehavior: "create_prorations",
      })
      router.refresh()
    })
  }

  const handleCancel = async () => {
    startTransition(async () => {
      await cancelSubscription({
        cancelAtPeriodEnd: true,
        reason: "User requested cancellation",
      })
      router.refresh()
    })
  }

  const handleSavePreferences = () => {
    startTransition(async () => {
      await updateBillingPreferences({
        autoPayEnabled: autoRenewal,
        sendPaymentSuccess: invoiceEmails,
        sendUsageWarnings: usageLimitAlerts,
        sendUpcomingRenewal: invoiceReminders,
        budgetAlertEnabled: overageProtection,
        taxId: taxId || undefined,
        currency: currency.toUpperCase(),
      })
      router.refresh()
    })
  }

  // No subscription at all - show empty state
  if (!subscription) {
    return (
      <div className="flex flex-col gap-8 py-4 pb-14">
        <Card>
          <CardHeader>
            <CardTitle>No Subscription Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your school does not have an active subscription. Contact your
              administrator to set up billing.
            </p>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <UpdatePlanCard
            currentPlan={plans[0]}
            plans={plans}
            onPlanChange={handlePlanChange}
            title="Choose a Plan"
          />
          <PaymentMethodSelector
            onProceed={(method, data) =>
              console.log("Payment method selected:", method, data)
            }
          />
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-4 pb-14">
      {/* Section 1: Subscription Overview */}
      <section>
        <SubscriptionManagement
          currentPlan={currentPlanData}
          updatePlan={{
            currentPlan,
            plans,
            triggerText: "Change Plan",
            onPlanChange: handlePlanChange,
          }}
          cancelSubscription={{
            title: "Cancel Subscription",
            description:
              "We're sorry to see you go. Your subscription will remain active until the end of the billing period.",
            plan: currentPlan,
            onCancel: handleCancel,
          }}
        />
      </section>

      {/* Section 2: Plan & Trial Cards */}
      <section className="grid gap-6 md:grid-cols-2">
        <UpdatePlanCard
          currentPlan={currentPlan}
          plans={plans}
          onPlanChange={handlePlanChange}
          title="Upgrade Your Plan"
        />
        {isTrial && trialEndDate ? (
          <TrialExpiryCard
            trialEndDate={trialEndDate}
            onUpgrade={() => handlePlanChange("pro")}
            title="Trial Period"
            description="Your trial is ending soon. Upgrade to keep access to all features."
            upgradeButtonText="Upgrade Now"
            features={[
              "Full access to all premium features",
              `Up to ${currentPlan.limits?.students ?? "unlimited"} students`,
              "Advanced analytics dashboard",
              "Priority customer support",
            ]}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {subscription.status}
              </div>
              <p className="text-muted-foreground text-xs">
                Next billing: {formatDate(subscription.currentPeriodEnd)}
              </p>
              {stats && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Total spent: {formatAmount(stats.totalSpent)}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Section 3: Usage & Charges */}
      <section className="grid gap-6 md:grid-cols-2">
        <UsageBasedPricing
          min={0}
          max={currentPlan.limits?.students ?? 1000}
          value={stats?.currentUsage?.students ?? 0}
          onChange={setCredits}
          onChangeEnd={(val) => console.log("Credits set to:", val)}
          currency="$"
          basePrice={subscription.subscriptionTier.monthlyPrice}
          includedCredits={currentPlan.limits?.students ?? 100}
          title="Student Usage"
          subtitle={`${stats?.currentUsage?.students ?? 0} of ${currentPlan.limits?.students ?? "unlimited"} students used`}
        />
        <UpcomingCharges
          title="Upcoming Charges"
          description="Preview of your next billing cycle"
          nextBillingDate={formatDate(subscription.currentPeriodEnd)}
          totalAmount={formatAmount(subscription.subscriptionTier.monthlyPrice)}
          charges={upcomingCharges}
        />
      </section>

      {/* Section 4: Usage Table */}
      {usageResources.length > 0 && (
        <section>
          <DetailedUsageTable
            title="Resource Usage"
            description="Current usage across your school's resources"
            resources={usageResources}
          />
        </section>
      )}

      {/* Section 5: Invoice History */}
      <section>
        <InvoiceHistory
          title="Invoice History"
          description="Your past invoices and payment receipts."
          invoices={
            invoiceItems.length > 0
              ? invoiceItems
              : [
                  {
                    id: "none",
                    date: "N/A",
                    amount: "$0",
                    status: "paid" as const,
                    description: "No invoices yet",
                  },
                ]
          }
          onDownload={(id) => console.log("Download invoice:", id)}
        />
      </section>

      {/* Section 6: Payment Methods */}
      <section className="grid gap-6 md:grid-cols-2">
        <PaymentMethodSelector
          onProceed={(method, data) => {
            startTransition(async () => {
              await addPaymentMethod({
                type: method === "cards" ? "CARD" : "MANUAL",
                provider: method === "cards" ? "stripe" : "manual",
                stripePaymentMethodId: (data as any)?.cardNumber,
                isDefault: paymentMethods.length === 0,
              })
              router.refresh()
            })
          }}
        />
        <PaymentCard
          title="Complete your payment"
          description="Enter your card details to finalize your subscription"
          price={String(subscription.subscriptionTier.monthlyPrice)}
          feature="Full Access"
          featuredescription={`${subscription.subscriptionTier.name} plan features`}
          feature2="Priority Support"
          feature2description="Get help within 24 hours from our support team"
          finalText={[
            { text: "Secure payment" },
            { text: "256-bit encryption" },
            { text: "PCI compliant" },
          ]}
          onPay={async (data) => {
            console.log("Payment submitted:", data)
          }}
        />
      </section>

      {/* Section 7: Billing Settings */}
      <section className="grid gap-6 md:grid-cols-2">
        <BillingSettings
          activeTab={activeTab}
          onTabChange={setActiveTab}
          emailNotifications={emailNotifications}
          onEmailNotificationsChange={setEmailNotifications}
          usageAlerts={usageAlerts}
          onUsageAlertsChange={setUsageAlerts}
          invoiceReminders={invoiceReminders}
          onInvoiceRemindersChange={setInvoiceReminders}
          cards={settingsCards}
          onAddCard={() => console.log("Add card clicked")}
          invoiceFormat={invoiceFormat}
          onInvoiceFormatChange={setInvoiceFormat}
          onEditBillingAddress={() =>
            console.log("Edit billing address clicked")
          }
          overageProtection={overageProtection}
          onOverageProtectionChange={setOverageProtection}
          usageLimitAlerts={usageLimitAlerts}
          onUsageLimitAlertsChange={setUsageLimitAlerts}
        />
        <BillingSettings2
          title="Billing Preferences"
          inputFields={[
            {
              id: "fullName",
              name: "fullName",
              value: fullName,
              placeholder: "School Admin",
              onChange: setFullName,
              label: "Full Name",
              type: "text",
              required: true,
            },
            {
              id: "billingEmail",
              name: "billingEmail",
              value: billingEmail,
              placeholder: "billing@school.edu",
              onChange: setBillingEmail,
              label: "Billing Email",
              helperText: "Invoices will be sent to this email address",
              type: "email",
              required: true,
            },
            {
              id: "taxId",
              name: "taxId",
              value: taxId,
              placeholder: "EU123456789",
              onChange: setTaxId,
              label: "Tax ID (Optional)",
              helperText: "For VAT or other tax purposes",
              type: "text",
            },
          ]}
          features={[
            {
              id: "auto-renewal",
              label: "Auto-Renewal",
              description: "Automatically renew your subscription",
              enabled: autoRenewal,
              onToggle: setAutoRenewal,
            },
            {
              id: "invoice-emails",
              label: "Invoice Emails",
              description: "Receive emails when invoices are generated",
              enabled: invoiceEmails,
              onToggle: setInvoiceEmails,
            },
            {
              id: "promotional-emails",
              label: "Promotional Emails",
              description:
                "Receive occasional updates about new features and offers",
              enabled: promotionalEmails,
              onToggle: setPromotionalEmails,
            },
          ]}
          currencies={["USD", "EUR", "GBP", "SAR", "AED"]}
          defaultCurrency={currency}
          onCurrencyChange={setCurrency}
          onSave={handleSavePreferences}
          onCancel={() => router.refresh()}
          saveButtonText="Save Changes"
          cancelButtonText="Cancel"
        />
      </section>
    </div>
  )
}
