// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getBroadcastTargets, getRecentBatches } from "./actions"
import { BroadcastForm } from "./form"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BroadcastContent({ dictionary, lang }: Props) {
  const [batches, grades] = await Promise.all([
    getRecentBatches(),
    getBroadcastTargets(),
  ])

  return (
    <div className="space-y-6">
      <BroadcastForm grades={grades} recentBatches={batches} lang={lang} />
    </div>
  )
}
