import { Suspense } from "react"

import { type Locale } from "@/components/internationalization/config"
import { type getDictionary } from "@/components/internationalization/dictionaries"

import {
  getBillingPreferences,
  getBillingStats,
  getInvoices,
  getPaymentMethods,
  getSubscriptionDetails,
  getSubscriptionTiers,
} from "./actions"
import { BillingDashboard } from "./billing-dashboard"

interface BillingContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default async function BillingContent({
  dictionary,
  lang,
}: BillingContentProps) {
  const [
    subscriptionResult,
    tiersResult,
    statsResult,
    invoicesResult,
    paymentMethodsResult,
    preferencesResult,
  ] = await Promise.all([
    getSubscriptionDetails().catch(() => ({
      success: false as const,
      error: "Failed",
    })),
    getSubscriptionTiers().catch(() => ({
      success: false as const,
      error: "Failed",
    })),
    getBillingStats().catch(() => ({
      success: false as const,
      error: "Failed",
    })),
    getInvoices().catch(() => ({
      success: false as const,
      error: "Failed",
    })),
    getPaymentMethods().catch(() => ({
      success: false as const,
      error: "Failed",
    })),
    getBillingPreferences().catch(() => ({
      success: false as const,
      error: "Failed",
    })),
  ])

  const subscription = subscriptionResult.success
    ? subscriptionResult.data
    : null
  const tiers = tiersResult.success ? tiersResult.data : []
  const stats = statsResult.success ? statsResult.data : null
  const invoices = invoicesResult.success ? invoicesResult.data.invoices : []
  const paymentMethods = paymentMethodsResult.success
    ? paymentMethodsResult.data
    : []
  const preferences = preferencesResult.success ? preferencesResult.data : null

  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground py-8 text-center">
          Loading billing...
        </div>
      }
    >
      <BillingDashboard
        subscription={
          subscription ? JSON.parse(JSON.stringify(subscription)) : null
        }
        tiers={JSON.parse(JSON.stringify(tiers))}
        stats={stats ? JSON.parse(JSON.stringify(stats)) : null}
        invoices={JSON.parse(JSON.stringify(invoices))}
        paymentMethods={JSON.parse(JSON.stringify(paymentMethods))}
        preferences={
          preferences ? JSON.parse(JSON.stringify(preferences)) : null
        }
        lang={lang}
      />
    </Suspense>
  )
}
