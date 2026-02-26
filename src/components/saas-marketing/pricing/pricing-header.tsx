// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface PricingHeaderProps {
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export default function PricingHeader({ dictionary }: PricingHeaderProps) {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">
          {dictionary?.marketing?.pricing?.badge || "ROI Guaranteed"}
        </Badge>
      </div>
      <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
        {dictionary?.marketing?.pricing?.title || "Simple. Transparent."}
      </h1>
      <p className="muted mx-auto max-w-[85%]">
        {dictionary?.marketing?.pricing?.subtitle ||
          "All components and building blocks are open source — we charge for crafting fully functional masterpieces and ensuring their ongoing reliability."}
      </p>
    </div>
  )
}
