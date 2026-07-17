// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getPaymentSettings } from "./actions"
import { PaymentSettingsForm } from "./form"

interface Props {
  lang: Locale
}

export async function PaymentSettingsContent({ lang }: Props) {
  const [dictionary, result] = await Promise.all([
    getDictionary(lang),
    getPaymentSettings(),
  ])

  const d = (dictionary as any)?.finance?.paymentSettings as
    | Record<string, string>
    | undefined

  if (!result.success || !result.data) {
    return (
      <div className="text-muted-foreground p-8 text-center">
        {d?.loadFailed || "Could not load payment settings."}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {d?.title || "Payment methods"}
        </h1>
        <p className="text-muted-foreground">
          {d?.description ||
            "Configure how families pay the school, and when unpaid fees are chased."}
        </p>
      </div>
      <PaymentSettingsForm initial={result.data} dictionary={dictionary} />
    </div>
  )
}
