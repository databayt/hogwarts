// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Lightbulb } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { CATEGORIES, FEATURE_DETAILS, FEATURES } from "./constants"
import { FEATURE_PAGE_DATA } from "./page-data"
import { SectionRenderer } from "./sections/section-renderer"
import { getFeatureIconColor } from "./util"

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
          className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
        >
          <BackArrow className="h-4 w-4" />
          {t.backToFeatures}
        </Link>
      </div>
    )
  }

  const pageData = FEATURE_PAGE_DATA[id]
  const category = CATEGORIES.find((c) => c.id === feature.category)

  // Section-based rendering
  if (pageData) {
    const relatedFeatures = pageData.relatedFeatures
      ?.map((rid) => FEATURES.find((f) => f.id === rid))
      .filter(Boolean) as typeof FEATURES | undefined

    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="py-16 md:py-24">
        {/* Back link */}
        <Link
          href={`/${lang}/features`}
          className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
        >
          <BackArrow className="h-4 w-4" />
          {t.backToFeatures}
        </Link>

        {/* Category badge */}
        {category && (
          <span
            className={cn(
              "mb-6 inline-block rounded-full border px-3 py-1 text-xs font-medium",
              getFeatureIconColor(feature.category)
            )}
          >
            {category.label}
          </span>
        )}

        {/* Sections */}
        {pageData.sections.map((section, i) => (
          <SectionRenderer
            key={i}
            section={section}
            lang={lang}
            ctaLabel={t.ctaGetStarted}
          />
        ))}

        {/* Related Features */}
        {relatedFeatures && relatedFeatures.length > 0 && (
          <section className="mb-16">
            <h2 className="font-heading mb-6 text-2xl font-bold">
              {t.relatedFeatures}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {relatedFeatures.map((rf) => (
                <Link
                  key={rf.id}
                  href={`/${lang}/features/${rf.id}`}
                  className="bg-background hover:border-primary rounded-lg border p-5 transition-[border-color] duration-200"
                >
                  <h4 className="mb-1 font-medium">{rf.title}</h4>
                  <small className="text-muted-foreground">
                    {rf.description}
                  </small>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="bg-muted/50 flex flex-col items-center gap-6 rounded-2xl p-8 text-center md:p-16">
          <h2 className="font-heading text-2xl font-bold md:text-3xl">
            {t.ctaTitle}
          </h2>
          <div className="flex gap-4">
            <Link
              href={`/${lang}/onboarding`}
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {t.ctaGetStarted}
            </Link>
            <Link
              href={`/${lang}/pricing`}
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              {t.ctaViewPricing}
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // Fallback: old FEATURE_DETAILS rendering for unmigrated features
  const details = FEATURE_DETAILS[id]
  const relatedFeatures = details?.relatedFeatures
    ?.map((rid) => FEATURES.find((f) => f.id === rid))
    .filter(Boolean) as typeof FEATURES | undefined

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="py-16 md:py-24">
      {/* Back link */}
      <Link
        href={`/${lang}/features`}
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors"
      >
        <BackArrow className="h-4 w-4" />
        {t.backToFeatures}
      </Link>

      {/* Header */}
      <div className="mb-12 max-w-3xl">
        {category && (
          <span
            className={cn(
              "mb-4 inline-block rounded-full border px-3 py-1 text-xs font-medium",
              getFeatureIconColor(feature.category)
            )}
          >
            {category.label}
          </span>
        )}
        <h1 className="font-heading mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          {feature.title}
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl">
          {details?.longDescription || feature.description}
        </p>
      </div>

      {details && (
        <>
          {/* Benefits */}
          {details.benefits.length > 0 && (
            <section className="mb-16">
              <h2 className="font-heading mb-6 text-2xl font-bold">
                {t.keyBenefits}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {details.benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <Check className="text-primary mt-0.5 h-5 w-5 shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Use Cases */}
          {details.useCases.length > 0 && (
            <section className="mb-16">
              <h2 className="font-heading mb-6 text-2xl font-bold">
                {t.useCases}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {details.useCases.map((useCase) => (
                  <div
                    key={useCase}
                    className="bg-muted/50 flex items-start gap-3 rounded-lg p-5"
                  >
                    <Lightbulb className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" />
                    <span>{useCase}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Features */}
          {relatedFeatures && relatedFeatures.length > 0 && (
            <section className="mb-16">
              <h2 className="font-heading mb-6 text-2xl font-bold">
                {t.relatedFeatures}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {relatedFeatures.map((rf) => (
                  <Link
                    key={rf.id}
                    href={`/${lang}/features/${rf.id}`}
                    className="bg-background hover:border-primary rounded-lg border p-5 transition-[border-color] duration-200"
                  >
                    <h4 className="mb-1 font-medium">{rf.title}</h4>
                    <small className="text-muted-foreground">
                      {rf.description}
                    </small>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* CTA */}
      <section className="bg-muted/50 flex flex-col items-center gap-6 rounded-2xl p-8 text-center md:p-16">
        <h2 className="font-heading text-2xl font-bold md:text-3xl">
          {t.ctaTitle}
        </h2>
        <div className="flex gap-4">
          <Link
            href={`/${lang}/onboarding`}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {t.ctaGetStarted}
          </Link>
          <Link
            href={`/${lang}/pricing`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            {t.ctaViewPricing}
          </Link>
        </div>
      </section>
    </div>
  )
}
