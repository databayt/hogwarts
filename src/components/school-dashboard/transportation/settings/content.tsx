// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  locale: Locale
  subdomain: string
  dictionary: Dictionary
}

export function TransportationSettingsContent({ dictionary }: Props) {
  const t = dictionary.transportation

  // Settings UI is a placeholder for MVP. Defaults (pickup buffer, default
  // monthly fee) will be wired in Phase 2 once the SchoolSettings model
  // gains a `transportation` block.
  return (
    <div className="flex flex-col gap-6 p-6">
      <header>
        <h2 className="text-2xl font-semibold">{t.settings.title}</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t.settings.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>{t.settings.defaultPickupBuffer}: —</p>
          <p>{t.settings.defaultMonthlyFee}: —</p>
          <p className="text-xs">({t.overview.noData})</p>
        </CardContent>
      </Card>
    </div>
  )
}
