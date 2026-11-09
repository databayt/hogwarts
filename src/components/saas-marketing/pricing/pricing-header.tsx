// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface PricingHeaderProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
  lang?: Locale
}

export default function PricingHeader({
  dictionary,
  lang,
}: PricingHeaderProps) {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-4 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">
          {dictionary?.marketing?.pricing?.badge || "ROI Guaranteed"}
        </Badge>
      </div>
      <h1
        className={cn(
          "home-hero-title sm:whitespace-nowrap",
          lang === "en"
            ? "hero-title-en"
            : "text-[40px]! sm:text-[56px]! lg:text-[64px]!"
        )}
      >
        {dictionary?.marketing?.pricing?.title || "Simple. Transparent."}
      </h1>
      <p className="home-hero-sub text-muted-foreground mx-auto text-lg! md:whitespace-nowrap lg:text-xl!">
        {dictionary?.marketing?.pricing?.subtitle ||
          "Open source at the core — we charge for crafting it and keeping it reliable."}
      </p>
    </div>
  )
}
