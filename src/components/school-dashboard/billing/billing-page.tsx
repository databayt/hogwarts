"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { plans, type CurrentPlan, type Plan } from "@/lib/billingsdk-config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { cancelSubscription, updateSubscription } from "./actions"
import {
  calculateTotal,
  formatDate,
  getTrialEndDate,
  isOnTrial,
  toCurrentPlan,
  toInvoiceItems,
  toPaymentCards,
  toUpcomingCharges,
  toUsageResources,
} from "./adapters"
import {
  BillingSection,
  HeaderSection,
  PaymentSection,
  SettingsSection,
  SubscriptionSection,
  UsageSection,
} from "./sections"
import type {
  BillingStats,
  InvoiceWithDetails,
  PaymentMethodWithUser,
  SubscriptionWithTier,
} from "./types"

interface BillingPageProps {
  stats: BillingStats
  subscription: SubscriptionWithTier
  invoices: InvoiceWithDetails[]
  paymentMethods: PaymentMethodWithUser[]
  dictionary?: Dictionary
}

export function BillingPage({
  stats,
  subscription,
  invoices,
  paymentMethods,
  dictionary,
}: BillingPageProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  // Transform data for BillingSDK components
  const currentPlan = useMemo(() => toCurrentPlan(subscription), [subscription])
  const invoiceItems = useMemo(() => toInvoiceItems(invoices), [invoices])
  const usageResources = useMemo(
    () =>
      toUsageResources(
        {
          currentStudents: stats.currentUsage.students,
          currentTeachers: stats.currentUsage.teachers,
          currentClasses: stats.currentUsage.classes,
          currentStorage: stats.currentUsage.storage,
        } as any,
        stats.limits
      ),
    [stats]
  )
  const savedCards = useMemo(
    () => toPaymentCards(paymentMethods as any),
    [paymentMethods]
  )
  const upcomingCharges = useMemo(
    () => toUpcomingCharges(subscription),
    [subscription]
  )
  const totalCharges = useMemo(
    () => calculateTotal(upcomingCharges),
    [upcomingCharges]
  )

  // Trial information
  const onTrial = isOnTrial(subscription)
  const trialEndDate = getTrialEndDate(subscription)
  const trialFeatures = [
    "Access to all premium features",
    "Advanced analytics and reports",
    "Priority customer support",
    "Custom branding options",
  ]

  // Handlers
  const handlePlanChange = async (planId: string) => {
    startTransition(async () => {
      const result = await updateSubscription({
        tierId: planId,
        billingInterval: "monthly",
        prorationBehavior: "create_prorations",
      })

      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to update subscription:", result.error)
      }
    })
  }

  const handleCancelSubscription = async (planId: string) => {
    startTransition(async () => {
      const result = await cancelSubscription({
        cancelAtPeriodEnd: true,
        reason: "User requested cancellation",
      })

      if (result.success) {
        router.refresh()
      } else {
        console.error("Failed to cancel subscription:", result.error)
      }
    })
  }

  const handleViewPlans = () => {
    router.push("/pricing")
  }

  const handleUpgrade = () => {
    // Scroll to subscription section or open upgrade dialog
    const subscriptionSection = document.getElementById("subscription-section")
    subscriptionSection?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSettings = () => {
    // Scroll to settings section
    const settingsSection = document.getElementById("settings-section")
    settingsSection?.scrollIntoView({ behavior: "smooth" })
  }

  const handleAddCard = () => {
    setShowPaymentForm(true)
    const paymentSection = document.getElementById("payment-section")
    paymentSection?.scrollIntoView({ behavior: "smooth" })
  }

  const handleEditBillingAddress = () => {
    // TODO: Open dialog or navigate to billing address form
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    // Find the invoice - PDF URL would be fetched from Stripe separately
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (invoice?.stripeInvoiceId) {
      // TODO: Call Stripe API to get the PDF URL and download
      void invoice.stripeInvoiceId
    }
  }

  type PaymentMethod = "cards" | "digital-wallets" | "upi" | "bnpl-services"
  type PaymentFormData = {
    cardNumber?: string
    expiryDate?: string
    cvv?: string
    cardholderName?: string
    email?: string
    phone?: string
    upiId?: string
    income?: string
  }

  const handlePaymentMethodSelect = (
    method: PaymentMethod,
    data: PaymentFormData
  ) => {
    // TODO: Handle payment method selection
    void { method, data }
  }

  const handlePay = async (data: {
    cardNumber: string
    expiry: string
    cvc: string
  }) => {
    // TODO: Integrate with Stripe or payment processor
    void data
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const handleSettingsChange = (settings: Record<string, unknown>) => {
    // TODO: Handle settings change
    void settings
  }

  const handleSaveSettings = () => {
    // TODO: Call updateBillingPreferences action
  }

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <HeaderSection
        currentPlan={currentPlan}
        isOnTrial={onTrial}
        trialEndDate={trialEndDate}
        trialFeatures={trialFeatures}
        totalBalance={stats.availableCredits}
        username={subscription.stripeCustomerId || "User"}
        onViewPlans={handleViewPlans}
        onCancelPlan={() => handleCancelSubscription(currentPlan.plan.id)}
        onUpgrade={handleUpgrade}
        onSettings={handleSettings}
      />

      {/* Subscription Section */}
      <div id="subscription-section">
        <SubscriptionSection
          currentPlan={currentPlan}
          plans={plans}
          onPlanChange={handlePlanChange}
          onCancelSubscription={handleCancelSubscription}
        />
      </div>

      {/* Usage Section */}
      <UsageSection resources={usageResources} showUsageSlider={false} />

      {/* Billing Section */}
      <BillingSection
        nextBillingDate={currentPlan.nextBillingDate}
        totalAmount={totalCharges}
        upcomingCharges={upcomingCharges}
        invoices={invoiceItems}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {/* Payment Section */}
      <div id="payment-section">
        <PaymentSection
          savedCards={savedCards}
          showPaymentForm={showPaymentForm}
          paymentAmount={stats.nextPaymentAmount.toString()}
          paymentTitle="Add Payment Method"
          paymentDescription="Add a new payment method for future billing"
          onPaymentMethodSelect={handlePaymentMethodSelect}
          onPay={handlePay}
          onPaymentSuccess={() => {
            setShowPaymentForm(false)
            router.refresh()
          }}
        />
      </div>

      {/* Settings Section */}
      <div id="settings-section">
        <SettingsSection
          cards={savedCards}
          onAddCard={handleAddCard}
          onEditBillingAddress={handleEditBillingAddress}
          initialSettings={{
            emailNotifications: true,
            usageAlerts: true,
            invoiceReminders: true,
            invoiceFormat: "PDF",
            overageProtection: false,
            usageLimitAlerts: true,
            autoRenewal: true,
            invoiceEmails: true,
            promotionalEmails: false,
          }}
          onSettingsChange={handleSettingsChange}
          onSaveSettings={handleSaveSettings}
        />
      </div>
    </div>
  )
}
