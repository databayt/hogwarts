// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Video } from "lucide-react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary?: Dictionary
}

export function LiveClassesEmptyState({ dictionary }: Props) {
  const t = dictionary?.liveClasses?.empty
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <Video className="text-muted-foreground mb-3 size-10" aria-hidden />
      <p className="text-sm font-medium">{t?.title ?? "No live classes yet"}</p>
      <p className="text-muted-foreground mt-1 max-w-md text-sm">
        {t?.description ??
          "Live classes scheduled for your section will appear here."}
      </p>
    </div>
  )
}
