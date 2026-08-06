// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface EnterpriseSectionProps {
  lang?: Locale
  dictionary?: Awaited<ReturnType<typeof getDictionary>>
}

export default function EnterpriseSection({
  dictionary,
}: EnterpriseSectionProps) {
  const enterprise = dictionary?.marketing?.pricing?.enterprise

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 pt-16 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">
          {enterprise?.badge || "For networks"}
        </Badge>
      </div>
      <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
        {enterprise?.title || "Running more than one school?"}
      </h1>
      <p className="muted">
        {enterprise?.description ||
          "Multi-campus networks and government contracts get a dedicated account manager, a 99.9% uptime SLA, white-label branding, and SSO — priced per student for 1,000+ students."}
      </p>
      <div className="flex justify-center">
        <Link
          href={
            enterprise?.contactHref ||
            "mailto:contact@databayt.org?subject=Enterprise%20plan"
          }
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        >
          {enterprise?.talkToSales || "Talk to Sales"}
        </Link>
      </div>
    </div>
  )
}
