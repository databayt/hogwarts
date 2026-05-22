// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { listApiTokens } from "../actions/api-tokens"
import { getSettings } from "../actions/settings"
import { TransportationEmptyState } from "../empty-state"
import { TransportationApiTokensSection } from "./api-tokens-section"
import { TransportationSettingsForm } from "./form"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export async function TransportationSettingsContent({ dictionary }: Props) {
  const t = dictionary.transportation
  const [result, tokensResult] = await Promise.all([
    getSettings(),
    listApiTokens(),
  ])

  if (!result.success) {
    return (
      <TransportationEmptyState
        title={t.settings.title}
        description={t.errors.internalError}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">{t.settings.title}</h2>
        <p className="text-muted-foreground text-sm">{t.settings.subtitle}</p>
      </header>

      <TransportationSettingsForm
        dictionary={dictionary}
        initial={{
          defaultPickupBufferMinutes:
            result.data.defaultPickupBufferMinutes ?? 10,
          defaultMonthlyFee: result.data.defaultMonthlyFee ?? null,
          notifyGuardiansOnTripStart:
            result.data.notifyGuardiansOnTripStart ?? true,
          notifyGuardiansOnTripFinish:
            result.data.notifyGuardiansOnTripFinish ?? true,
          notifyGuardiansOnTripCancel:
            result.data.notifyGuardiansOnTripCancel ?? true,
          lateThresholdMinutes: result.data.lateThresholdMinutes ?? 15,
        }}
      />

      <hr className="border-border" />

      <TransportationApiTokensSection
        dictionary={dictionary}
        tokens={tokensResult.success ? tokensResult.data : []}
      />
    </div>
  )
}
