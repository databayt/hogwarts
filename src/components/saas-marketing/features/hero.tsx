// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, ArrowRight, GraduationCap } from "lucide-react"

import { PageHeader } from "@/components/atom/page-header"
import { TwoButtons } from "@/components/atom/two-buttons"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

interface HeroProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  params: { lang: Locale }
}

export default function Hero({ dictionary, params }: HeroProps) {
  const t = dictionary.marketing.features

  return (
    <PageHeader
      announcement={
        <Link
          href={`/${params.lang}/pricing`}
          className="group mb-2 inline-flex items-center gap-2 px-0.5 text-sm font-medium"
        >
          <GraduationCap className="h-4 w-4" />
          <span className="underline-offset-4 group-hover:underline">
            {t.badge}
          </span>
          <ArrowRight className="ms-1 h-4 w-4 rtl:hidden" />
          <ArrowLeft className="ms-1 hidden h-4 w-4 rtl:block" />
        </Link>
      }
      heading={t.title}
      description={t.subtitle}
      actions={
        <TwoButtons
          primaryLabel="Browse Features"
          primaryHref={`/${params.lang}/features`}
          secondaryLabel="Request Feature"
          secondaryHref={`/${params.lang}/contact`}
        />
      }
    />
  )
}
