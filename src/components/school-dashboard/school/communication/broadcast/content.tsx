// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getRecentBatches, getTargetClasses } from "./actions"
import { BroadcastForm } from "./form"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function BroadcastContent({ dictionary, lang }: Props) {
  const [batches, classes] = await Promise.all([
    getRecentBatches(),
    getTargetClasses(),
  ])

  return (
    <div className="space-y-6">
      <BroadcastForm classes={classes} recentBatches={batches} lang={lang} />
    </div>
  )
}
