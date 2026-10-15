"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { plans as basePlans, type Plan } from "@/lib/billingsdk-config"
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
import { useBillingText } from "@/components/billingsdk/use-billing-text"
import type { Locale } from "@/components/internationalization/config"
import { fill } from "@/components/school-dashboard/school/format"

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
  const matched = basePlans.find(
    (p) =>
      p.title.toLowerCase() === tier.name.toLowerCase() ||
      p.id === tier.name.toLowerCase()
  )
  if (matched) return matched
  return basePlans[0]
}

/** Latin digits in both languages; the locale picks month names and order. */
const bcp47 = (lang: string) => (lang === "ar" ? "ar-SA" : "en-US")

function formatDate(
  date: string | Date | null,
  lang: string,
  fallback: string
): string {
  if (!date) return fallback
  return new Intl.DateTimeFormat(bcp47(lang), {
    numberingSystem: "latn",
    calendar: "gregory",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date))
}

function formatAmount(amount: number, lang: string, currency = "USD"): string {
  return new Intl.NumberFormat(bcp47(lang), {
    numberingSystem: "latn",
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
  const b = useBillingText()
  const t = b.dashboard
  const na = b.common.na
  const fmtDate = (date: string | Date | null) => formatDate(date, lang, na)
  const fmtAmount = (amount: number) => formatAmount(amount, lang)
  const num = (v: number) =>
    new Intl.NumberFormat(bcp47(lang), { numberingSystem: "latn" }).format(v)
  const statusLabel = (status: string) =>
    (b.statuses as Record<string, string>)[status] ?? status

  // Plan names stay as brand tiers; descriptions, badges and features follow
  // the page language.
  const localizePlan = (plan: Plan): Plan => {
    const text = (b.plans as Record<string, any>)[plan.id]
    if (!text) return plan
    return {
      ...plan,
      description: text.description ?? plan.description,
      badge: plan.badge ? (text.badge ?? plan.badge) : plan.badge,
      features: plan.features.map((f, i) => ({
        ...f,
        name: text.features?.[i] ?? f.name,
      })),
    }
  }
  const plans = basePlans.map(localizePlan)

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
  const currentPlan = localizePlan(
    subscription ? mapSubscriptionToPlan(subscription) : basePlans[0]
  )

  // Build current plan data for SubscriptionManagement
  const currentPlanData = subscription
    ? {
        plan: currentPlan,
        type: "monthly" as const,
        price: fmtAmount(subscription.subscriptionTier.monthlyPrice),
        nextBillingDate: fmtDate(subscription.currentPeriodEnd),
        paymentMethod:
          paymentMethods.length > 0
            ? `${paymentMethods[0].type} ****${paymentMethods[0].stripePaymentMethodId?.slice(-4) ?? "****"}`
            : t.noPaymentMethod,
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
        price: b.common.free,
        nextBillingDate: na,
        paymentMethod: b.common.none,
        status: "active" as const,
      }

  // Map invoices to InvoiceHistory format
  const invoiceItems = invoices.map((inv: any) => ({
    id: inv.id,
    date: fmtDate(inv.createdAt),
    amount: fmtAmount(inv.amountDue),
    status: (inv.status === "paid"
      ? "paid"
      : inv.status === "void"
        ? "void"
        : inv.status === "open"
          ? "open"
          : "paid") as "paid" | "refunded" | "open" | "void",
    description:
      inv.description ||
      fill(t.invoiceNumber, {
        number: inv.invoiceNumber || inv.id.slice(0, 8),
      }),
  }))

  // Map usage stats to resources
  const usageResources = stats
    ? [
        {
          name: t.resources.students,
          used: stats.currentUsage.students,
          limit: stats.limits.students,
          percentage: stats.usagePercentages.students,
          unit: t.units.users,
        },
        {
          name: t.resources.teachers,
          used: stats.currentUsage.teachers,
          limit: stats.limits.teachers,
          percentage: stats.usagePercentages.teachers,
          unit: t.units.users,
        },
        {
          name: t.resources.classes,
          used: stats.currentUsage.classes,
          limit: stats.limits.classes,
          percentage: stats.usagePercentages.classes,
          unit: t.units.classes,
        },
        {
          name: t.resources.storage,
          used: stats.currentUsage.storage,
          limit: stats.limits.storage,
          percentage: stats.usagePercentages.storage,
          unit: t.units.mb,
        },
      ]
    : []

  // Upcoming charges
  const upcomingCharges = subscription
    ? [
        {
          id: "1",
          description: fill(t.planMonthly, {
            name: subscription.subscriptionTier.name,
          }),
          amount: fmtAmount(subscription.subscriptionTier.monthlyPrice),
          date: fmtDate(subscription.currentPeriodEnd),
          type: "recurring" as const,
        },
      ]
    : []

  // Payment method cards for settings
  const settingsCards = paymentMethods.map((pm: any) => ({
    id: pm.id,
    last4: pm.stripePaymentMethodId?.slice(-4) ?? "****",
    brand: pm.type === "CARD" ? t.card : pm.type,
    expiry: na,
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
            <CardTitle>{t.noSubscriptionTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{t.noSubscriptionBody}</p>
          </CardContent>
        </Card>

        <section className="grid gap-6 md:grid-cols-2">
          <UpdatePlanCard
            currentPlan={plans[0]}
            plans={plans}
            onPlanChange={handlePlanChange}
            title={t.choosePlan}
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
            triggerText: t.changePlan,
            onPlanChange: handlePlanChange,
          }}
          cancelSubscription={{
            title: t.cancelTitle,
            description: t.cancelDescription,
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
          title={t.upgradeYourPlan}
        />
        {isTrial && trialEndDate ? (
          <TrialExpiryCard
            trialEndDate={trialEndDate}
            onUpgrade={() => handlePlanChange("pro")}
            title={t.trialTitle}
            description={t.trialDescription}
            upgradeButtonText={t.upgradeNow}
            features={t.trialFeatures.map((feature) =>
              fill(feature, {
                students:
                  currentPlan.limits && currentPlan.limits.students >= 0
                    ? num(currentPlan.limits.students)
                    : b.common.unlimited,
              })
            )}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {t.planStatus}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statusLabel(subscription.status)}
              </div>
              <p className="text-muted-foreground text-xs">
                {fill(t.nextBilling, {
                  date: fmtDate(subscription.currentPeriodEnd),
                })}
              </p>
              {stats && (
                <p className="text-muted-foreground mt-2 text-xs">
                  {fill(t.totalSpent, { amount: fmtAmount(stats.totalSpent) })}
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
          title={t.studentUsage}
          unitLabel={t.students}
          subtitle={fill(t.studentsUsed, {
            used: num(stats?.currentUsage?.students ?? 0),
            limit:
              currentPlan.limits && currentPlan.limits.students >= 0
                ? num(currentPlan.limits.students)
                : b.common.unlimited,
          })}
        />
        <UpcomingCharges
          title={t.upcomingCharges}
          description={t.upcomingDescription}
          nextBillingDate={fmtDate(subscription.currentPeriodEnd)}
          totalAmount={fmtAmount(subscription.subscriptionTier.monthlyPrice)}
          charges={upcomingCharges}
        />
      </section>

      {/* Section 4: Usage Table */}
      {usageResources.length > 0 && (
        <section>
          <DetailedUsageTable
            title={t.resourceUsage}
            description={t.resourceDescription}
            resources={usageResources}
          />
        </section>
      )}

      {/* Section 5: Invoice History */}
      <section>
        <InvoiceHistory
          title={t.invoiceHistory}
          description={t.invoiceDescription}
          invoices={
            invoiceItems.length > 0
              ? invoiceItems
              : [
                  {
                    id: "none",
                    date: na,
                    amount: fmtAmount(0),
                    status: "paid" as const,
                    description: t.noInvoices,
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
          title={t.completePayment}
          description={t.completePaymentDescription}
          price={String(subscription.subscriptionTier.monthlyPrice)}
          feature={t.fullAccess}
          featuredescription={fill(t.planFeatures, {
            name: subscription.subscriptionTier.name,
          })}
          feature2={t.prioritySupport}
          feature2description={t.supportDescription}
          finalText={[
            { text: t.securePayment },
            { text: t.encryption },
            { text: t.pciCompliant },
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
          title={b.preferences.title}
          inputFields={[
            {
              id: "fullName",
              name: "fullName",
              value: fullName,
              placeholder: b.preferences.fullNamePlaceholder,
              onChange: setFullName,
              label: b.preferences.fullName,
              type: "text",
              required: true,
            },
            {
              id: "billingEmail",
              name: "billingEmail",
              value: billingEmail,
              placeholder: "billing@school.edu",
              onChange: setBillingEmail,
              label: b.preferences.billingEmail,
              helperText: b.preferences.billingEmailHint,
              type: "email",
              required: true,
            },
            {
              id: "taxId",
              name: "taxId",
              value: taxId,
              placeholder: "EU123456789",
              onChange: setTaxId,
              label: b.preferences.taxId,
              helperText: b.preferences.taxIdHint,
              type: "text",
            },
          ]}
          features={[
            {
              id: "auto-renewal",
              label: b.preferences.autoRenewal,
              description: b.preferences.autoRenewalHint,
              enabled: autoRenewal,
              onToggle: setAutoRenewal,
            },
            {
              id: "invoice-emails",
              label: b.preferences.invoiceEmails,
              description: b.preferences.invoiceEmailsHint,
              enabled: invoiceEmails,
              onToggle: setInvoiceEmails,
            },
            {
              id: "promotional-emails",
              label: b.preferences.promoEmails,
              description: b.preferences.promoEmailsHint,
              enabled: promotionalEmails,
              onToggle: setPromotionalEmails,
            },
          ]}
          currencies={["USD", "EUR", "GBP", "SAR", "AED"]}
          defaultCurrency={currency}
          onCurrencyChange={setCurrency}
          onSave={handleSavePreferences}
          onCancel={() => router.refresh()}
          saveButtonText={b.preferences.save}
          cancelButtonText={b.preferences.cancel}
        />
      </section>
    </div>
  )
}
