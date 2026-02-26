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
  lang,
  dictionary,
}: EnterpriseSectionProps) {
  const enterprise = dictionary?.marketing?.pricing?.enterprise

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 pt-16 text-center">
      <div className="flex justify-center">
        <Badge className="bg-muted text-foreground">
          {enterprise?.badge || "Enterprise"}
        </Badge>
      </div>
      <h1 className="font-heading text-4xl font-extrabold md:text-5xl">
        {enterprise?.title || "Need Something Bigger?"}
      </h1>
      <p className="muted">
        {enterprise?.description ||
          "For enterprises and large organizations, we offer custom solutions with dedicated teams, SLAs, and specialized support tailored to your unique requirements."}
      </p>
      <div className="flex justify-center">
        <Link
          href={`/${lang}/docs/community/support`}
          className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
        >
          {enterprise?.talkToSales || "Talk to Sales"}
        </Link>
      </div>
    </div>
  )
}
