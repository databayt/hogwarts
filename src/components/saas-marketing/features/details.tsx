// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"

import { FEATURE_DETAILS, FEATURES } from "./constants"
import { featureVideo } from "./feature-video"
import { localizeFeature } from "./i18n"
import { FEATURE_PAGE_DATA } from "./page-data"
import { FEATURE_SHOWCASE } from "./page-data/showcase"
import { BottomCta } from "./sections/bottom-cta"
import { FeatureShowcase } from "./sections/feature-showcase"
import { HeroVideo } from "./sections/hero-video"
import { InfoCard } from "./sections/info-card"
import { RelatedFeatures } from "./sections/related-features"
import { SectionRenderer } from "./sections/section-renderer"
import { SectionTitle } from "./sections/section-title"
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
  const resolveRelated = (ids?: string[]) =>
    (ids
      ?.map((rid) => FEATURES.find((f) => f.id === rid))
      .filter(Boolean) as typeof FEATURES) ?? []

  // Body copy in the page's language where the entry has it (`sectionsAr`);
  // otherwise the English sections, as before.
  const pageData = FEATURE_PAGE_DATA[id]
  const localizedSections = isRTL ? pageData?.sectionsAr : pageData?.sections
  const sections = localizedSections ?? pageData?.sections ?? []

  // The hero lead: the page-data hero line in the page's language, else the
  // localized catalog one-liner — never English copy on /ar.
  const lead = localizedSections?.[0]
  const heroDescription =
    (lead?.type === "hero" ? lead.description : undefined) ??
    localized.description

  // The first screen: the feature's loop edge to edge across the whole top
  // half, from the very top — the transparent page header (layout,
  // SmartBar variant="page", 64px + a 44px link row below md) sits on top
  // of it, so the band is pulled up by exactly that height. Then the heading
  // block under it. The clips keep their action in the centre, so the
  // cover crop (wide on desktop, near-square on phones) never cuts it.
  //
  // The heading block is three things on the content edge: title, one lead
  // line, the two calls to action. The glyph and the category/group chips
  // it used to carry were dropped (2026-11-09) — the video already names the
  // feature visually, and the chips were catalog taxonomy, not buyer copy.
  const hero = (
    <section>
      <HeroVideo
        video={featureVideo(id, lang)}
        label={localized.title}
        className="mx-[calc(50%-50vw)] -mt-[108px] h-[50svh] md:-mt-16"
        scrim
      />

      <div className="mt-8 md:mt-10">
        <h1 className={cn("home-hero-title", lang === "en" && "hero-title-en")}>
          {localized.title}
        </h1>
        <p className="home-hero-sub text-foreground mt-2 max-w-2xl text-pretty">
          {heroDescription}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
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

  const showcase = FEATURE_SHOWCASE[id]
  const showcaseBlock = showcase ? <FeatureShowcase data={showcase} /> : null
  const whyBand = <WhyDatabayt lang={lang} />

  // Everything below the hero shares one rhythm: one gap between sections,
  // one title (SectionTitle), one card style; the page closes on one CTA.
  const below = "mt-16 flex flex-col gap-16 md:mt-24 md:gap-24"

  // ─── Section-based rendering ───
  if (pageData) {
    // The showcase deck slots right after the hero, before supporting
    // sections — mirroring zenda's for-schools page order.
    const heroCount = sections[0]?.type === "hero" ? 1 : 0

    return (
      <div dir={isRTL ? "rtl" : "ltr"} className="pb-12 md:pb-16">
        {hero}

        <div className={below}>
          {showcaseBlock}

          {sections.slice(heroCount).map((section, i) => (
            <SectionRenderer key={i} section={section} />
          ))}

          <RelatedFeatures
            features={resolveRelated(pageData.relatedFeatures)}
            lang={lang}
            heading={t.relatedFeatures}
          />

          {whyBand}

          {bottomCta}
        </div>
      </div>
    )
  }

  // ─── Fallback: FEATURE_DETAILS rendering for features without page data ───
  const details = FEATURE_DETAILS[id]

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="pb-12 md:pb-16">
      {hero}

      <div className={below}>
        {showcaseBlock}

        {details && details.benefits.length > 0 && (
          <section>
            <SectionTitle title={t.keyBenefits} />
            <ul className="grid gap-x-12 gap-y-4 sm:grid-cols-2">
              {details.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-base">
                  <Check
                    className="text-primary mt-0.5 size-5 shrink-0"
                    strokeWidth={2.25}
                  />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {details && details.useCases.length > 0 && (
          <section>
            <SectionTitle title={t.useCases} />
            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {details.useCases.map((useCase) => (
                <InfoCard key={useCase} title={useCase} description="" />
              ))}
            </div>
          </section>
        )}

        {details && (
          <RelatedFeatures
            features={resolveRelated(details.relatedFeatures)}
            lang={lang}
            heading={t.relatedFeatures}
          />
        )}

        {whyBand}

        {bottomCta}
      </div>
    </div>
  )
}
