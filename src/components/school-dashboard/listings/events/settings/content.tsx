// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
}

export default function EventSettingsContent({ dictionary, lang }: Props) {
  const d = dictionary?.events

  return (
    <div className="space-y-6">
      <div className="space-y-2 p-1">
        <h3 className="text-lg font-semibold">
          {d?.settings?.title || "Event Settings"}
        </h3>
        <p className="text-muted-foreground text-sm">
          {d?.settings?.description ||
            "Event types, notification rules, and module configurations will be available here."}
        </p>
      </div>
    </div>
  )
}
