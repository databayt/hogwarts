// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import {
  FEATURE_GROUPS,
  GROUP_OF,
  IMPACT_METRICS,
  SHOWN_FEATURES,
} from "./constants"
import { FeatureIcon } from "./feature-icon"
import FeatureTabs, { type FeatureTabItem } from "./feature-tabs"
import Hero from "./hero"
import { featuresUi, GROUP_LABEL_AR, localizeFeature, METRIC_AR } from "./i18n"

interface ContentProps {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  params: { lang: Locale }
}

export default function Content({ dictionary, params }: ContentProps) {
  const t = dictionary.marketing.features
  const isAr = params.lang === "ar"
  const ui = featuresUi(params.lang)

  // Localize and render every card here, on the server: the client shell gets
  // plain strings and finished icons, so the catalog stays out of its bundle.
  const tabs = [
    { id: "all", label: isAr ? (GROUP_LABEL_AR.all ?? "الكل") : "All" },
    ...FEATURE_GROUPS.map((g) => ({
      id: g.id,
      label: isAr ? (GROUP_LABEL_AR[g.id] ?? g.label) : g.label,
    })),
  ]
  const items: FeatureTabItem[] = SHOWN_FEATURES.map((feature) => {
    const { title, description } = localizeFeature(feature, params.lang)
    return {
      id: feature.id,
      title,
      description,
      group: GROUP_OF[feature.id],
      href: `/${params.lang}/features/${feature.id}`,
      icon: <FeatureIcon feature={feature} alt={title} />,
    }
  })

  return (
    <div>
      <Hero dictionary={dictionary} params={params} />
      <FeatureTabs
        items={items}
        tabs={tabs}
        seeMoreLabel={ui.seeMore}
        dir={isAr ? "rtl" : "ltr"}
      />

      {/* Impact metrics */}
      <section className="py-16 md:py-24">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight">
          {t.impactTitle}
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {IMPACT_METRICS.map((metric) => {
            const m = isAr ? (METRIC_AR[metric.id] ?? metric) : metric
            return (
              <div
                key={metric.id}
                className="bg-muted/50 flex flex-col items-center rounded-lg p-6 text-center"
              >
                <span className="text-primary text-4xl font-bold md:text-5xl">
                  {metric.value}
                </span>
                <p className="mt-2 font-medium">{m.label}</p>
                <small className="text-muted-foreground mt-1">
                  {m.description}
                </small>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mb-16 flex flex-col items-center gap-6 p-8 text-center md:p-16">
        <h2 className="text-3xl font-semibold tracking-tight">{t.ctaTitle}</h2>
        <p className="text-muted-foreground max-w-lg">{t.ctaSubtitle}</p>
        <div className="flex gap-4">
          <Link
            href={`/${params.lang}/contact`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {ui.talkToSales}
          </Link>
        </div>
      </section>
    </div>
  )
}
