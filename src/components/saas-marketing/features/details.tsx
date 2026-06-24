// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { CATEGORIES, FEATURE_DETAILS, FEATURES } from "./constants"
import { ImportedSections } from "./imported"
import { FEATURE_PAGE_DATA } from "./page-data"
import { BottomCta } from "./sections/bottom-cta"
import { Glyph } from "./sections/glyph"
import { RelatedFeatures } from "./sections/related-features"
import { SectionRenderer } from "./sections/section-renderer"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

export default function FeatureDetails({ dictionary, lang, id }: Props) {
  const isRTL = lang === "ar"
  const t = dictionary.marketing.features
  const BackArrow = isRTL ? ArrowRight : ArrowLeft

  const feature = FEATURES.find((f) => f.id === id)
  if (!feature) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="text-muted-foreground">Feature not found.</p>
        <Link
          href={`/${lang}/features`}
          className={cn(buttonVariants({ variant: "outline" }), "mt-4 gap-2")}
        >
          <BackArrow className="size-4" />
          {t.backToFeatures}
        </Link>
      </div>
    )
  }

  const category = CATEGORIES.find((c) => c.id === feature.category)
  const resolveRelated = (ids?: string[]) =>
    (ids
      ?.map((rid) => FEATURES.find((f) => f.id === rid))
      .filter(Boolean) as typeof FEATURES) ?? []

  // Shared chrome: back link + a subtle category pill.
  const header = (
    <div className="mb-12 flex items-center justify-between gap-4">
      <Link
        href={`/${lang}/features`}
        className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-2 text-sm transition-colors"
      >
        <BackArrow className="size-4 transition-transform group-hover:-translate-x-0.5 rtl:group-hover:translate-x-0.5" />
        {t.backToFeatures}
      </Link>
      {category && (
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
          {category.label}
        </span>
      )}
    </div>
  )

  const bottomCta = (
    <BottomCta
      lang={lang}
      title={t.ctaTitle}
      subtitle={t.ctaSubtitle}
      getStartedLabel={t.ctaGetStarted}
      viewPricingLabel={t.ctaViewPricing}
    />
  )

  const pageData = FEATURE_PAGE_DATA[id]

  // ─── Section-based rendering ───
  if (pageData) {
    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="py-12 md:py-16">
        {header}

        {pageData.sections.map((section, i) => (
          <SectionRenderer
            key={i}
            section={section}
            lang={lang}
            ctaLabel={t.ctaGetStarted}
          />
        ))}

        <RelatedFeatures
          features={resolveRelated(pageData.relatedFeatures)}
          lang={lang}
          heading={t.relatedFeatures}
        />

        {bottomCta}

        <ImportedSections />
      </div>
    )
  }

  // ─── Fallback: FEATURE_DETAILS rendering for unmigrated features ───
  const details = FEATURE_DETAILS[id]

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="py-12 md:py-16">
      {header}

      <section className="mb-16 max-w-3xl">
        <Glyph title={feature.title} size={56} className="mb-6" />
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance md:text-5xl md:leading-[1.08]">
          {feature.title}
        </h1>
        <p className="text-muted-foreground mt-5 text-lg leading-relaxed text-pretty md:text-xl">
          {details?.longDescription || feature.description}
        </p>
      </section>

      {details && (
        <>
          {/* Benefits */}
          {details.benefits.length > 0 && (
            <section className="mb-16">
              <h2 className="font-heading mb-8 text-2xl font-bold tracking-tight md:text-3xl">
                {t.keyBenefits}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {details.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="bg-background flex items-start gap-3 rounded-lg border p-4"
                  >
                    <Check
                      className="text-primary mt-0.5 size-5 shrink-0"
                      strokeWidth={2.25}
                    />
                    <span className="text-sm leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Use Cases */}
          {details.useCases.length > 0 && (
            <section className="mb-16">
              <h2 className="font-heading mb-8 text-2xl font-bold tracking-tight md:text-3xl">
                {t.useCases}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {details.useCases.map((useCase) => (
                  <div
                    key={useCase}
                    className="bg-background rounded-lg border p-6"
                  >
                    <Glyph title={useCase} size={32} className="mb-4" />
                    <p className="text-sm leading-relaxed">{useCase}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <RelatedFeatures
            features={resolveRelated(details.relatedFeatures)}
            lang={lang}
            heading={t.relatedFeatures}
          />
        </>
      )}

      {bottomCta}

      <ImportedSections />
    </div>
  )
}
