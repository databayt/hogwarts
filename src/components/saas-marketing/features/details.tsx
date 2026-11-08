// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import {
  CATEGORIES,
  FEATURE_DETAILS,
  FEATURE_GROUPS,
  FEATURES,
  GROUP_OF,
} from "./constants"
import { GROUP_LABEL_AR, localizeFeature } from "./i18n"
import { FEATURE_PAGE_DATA } from "./page-data"
import { FEATURE_SHOWCASE } from "./page-data/showcase"
import { BottomCta } from "./sections/bottom-cta"
import { FeatureShowcase } from "./sections/feature-showcase"
import { Glyph } from "./sections/glyph"
import { RelatedFeatures } from "./sections/related-features"
import { SectionRenderer } from "./sections/section-renderer"
import { WhyDatabayt } from "./sections/why-databayt"

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
        <p className="text-muted-foreground">{t.notFound}</p>
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

  const localized = localizeFeature(feature, lang)
  const category = CATEGORIES.find((c) => c.id === feature.category)
  const resolveRelated = (ids?: string[]) =>
    (ids
      ?.map((rid) => FEATURES.find((f) => f.id === rid))
      .filter(Boolean) as typeof FEATURES) ?? []

  const groupId = GROUP_OF[feature.id]
  const groupLabel = groupId
    ? isRTL
      ? (GROUP_LABEL_AR[groupId] ??
        FEATURE_GROUPS.find((g) => g.id === groupId)?.label)
      : FEATURE_GROUPS.find((g) => g.id === groupId)?.label
    : undefined

  // The hero copy: the page-data hero carries a fuller paragraph than the grid
  // card's one-liner, so prefer it in English. Arabic has no page-data copy yet
  // and falls back to the localized catalog description.
  const heroDescription =
    (!isRTL && FEATURE_PAGE_DATA[id]?.sections[0]?.type === "hero"
      ? FEATURE_PAGE_DATA[id].sections[0].description
      : undefined) ?? localized.description

  // Page heading: large glyph in a row with the title + description, the
  // category/group pills under them, then the primary calls to action.
  const hero = (
    <section className="mb-12">
      <div className="flex items-start gap-4 md:gap-6">
        <Glyph
          title={feature.title}
          size={80}
          className="size-14 shrink-0 md:size-20"
        />
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-semibold tracking-tight">
            {localized.title}
          </h1>
          <p className="text-foreground max-w-lg text-base leading-7 font-light text-pretty sm:text-lg">
            {heroDescription}
          </p>

          {(category || groupLabel) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {category && (
                <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
                  {category.label}
                </span>
              )}
              {groupLabel && (
                <span className="text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium">
                  {groupLabel}
                </span>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/${lang}/onboarding`} className={cn(buttonVariants())}>
              {t.ctaGetStarted}
            </Link>
            <Link
              href={`/${lang}/pricing`}
              className={cn(buttonVariants({ variant: "ghost" }))}
            >
              {t.ctaViewPricing}
            </Link>
          </div>
        </div>
      </div>
    </section>
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
  const showcase = FEATURE_SHOWCASE[id]
  const showcaseBlock = showcase ? <FeatureShowcase data={showcase} /> : null
  const whyBand = <WhyDatabayt lang={lang} />

  // ─── Section-based rendering ───
  if (pageData) {
    // The showcase deck slots right after the hero, before supporting
    // sections — mirroring zenda's for-schools page order.
    const heroCount = pageData.sections[0]?.type === "hero" ? 1 : 0

    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="py-12 md:py-16">
        {hero}

        {showcaseBlock}

        {pageData.sections.slice(heroCount).map((section, i) => (
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

        {whyBand}

        {bottomCta}
      </div>
    )
  }

  // ─── Fallback: FEATURE_DETAILS rendering for unmigrated features ───
  const details = FEATURE_DETAILS[id]

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="py-12 md:py-16">
      {hero}

      {showcaseBlock}

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

      {whyBand}

      {bottomCta}
    </div>
  )
}
