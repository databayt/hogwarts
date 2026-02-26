// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { IMPACT_METRICS } from "./constants"
import FeatureTabs from "./feature-tabs"
import Hero from "./hero"

interface ContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  params: { lang: Locale }
}

export default function Content({ dictionary, params }: ContentProps) {
  const t = dictionary.marketing.features

  return (
    <div className="px-responsive lg:px-0">
      <Hero dictionary={dictionary} params={params} />
      <FeatureTabs lang={params.lang} />

      {/* Impact metrics */}
      <section className="py-16 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
          {t.impactTitle}
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {IMPACT_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="bg-muted/50 flex flex-col items-center rounded-lg p-6 text-center"
            >
              <span className="text-primary text-4xl font-bold md:text-5xl">
                {metric.value}
              </span>
              <p className="mt-2 font-medium">{metric.label}</p>
              <small className="text-muted-foreground mt-1">
                {metric.description}
              </small>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/50 mb-16 flex flex-col items-center gap-6 rounded-2xl p-8 text-center md:p-16">
        <h2 className="text-3xl font-semibold tracking-tight">{t.ctaTitle}</h2>
        <p className="text-muted-foreground max-w-lg">{t.ctaSubtitle}</p>
        <div className="flex gap-4">
          <Link
            href={`/${params.lang}/features`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Browse Features
          </Link>
          <Link
            href={`/${params.lang}/contact`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Request Feature
          </Link>
        </div>
      </section>
    </div>
  )
}
