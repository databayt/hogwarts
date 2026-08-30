// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
// import { Gallery } from "@/components/landing/gallery";
import type { getDictionary } from "@/components/internationalization/dictionaries"

// import Automated from "@/components/automated/featured";
// import Codebase from "@/components/landing/codebase";
// import Wizard from "@/components/wizard";
import { DreamSection } from "./dream-section"
import FAQs from "./faqs"
import Hero from "./hero"
import LetsWorkTogether from "./lets-work-together"
import LogoCloud from "./logo-cloud"
import MissionCards from "./mission-cards"
import StorySection from "./story-section"
// import Stack from "./stack";
import Testimonial from "./testimonial"
import Time from "./time"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
}

export default function HomeContent(props: Props) {
  const { dictionary, lang } = props
  const isRTL = lang === "ar"

  return (
    <main
      className="bg-background flex min-h-screen flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <Hero dictionary={dictionary} lang={lang} />
      <StorySection dictionary={dictionary} lang={lang} />
      <MissionCards dictionary={dictionary} lang={lang} />
      {/* <Gallery />
      <Stack />
      <Automated />
      <Codebase /> */}
      <Time dictionary={dictionary} lang={lang} />
      <DreamSection dictionary={dictionary} lang={lang} />
      {/* <Wizard /> */}
      <Testimonial dictionary={dictionary} lang={lang} />
      <LogoCloud dictionary={dictionary} lang={lang} />
      {/* OpenSource + Boost hidden — the SaaS homepage sells the product,
          not the repo or donations. Components kept in the block. */}
      <FAQs dictionary={dictionary} lang={lang} />
      <LetsWorkTogether dictionary={dictionary} lang={lang} />
      {/* DownloadApp hidden — the iOS/Android listings aren't live, so its two
          store buttons render permanently disabled. Component kept in the
          block; re-add here once APP_STORE_URL / PLAY_STORE_URL are filled in. */}
    </main>
  )
}
