import type { Locale } from "@/components/internationalization/config"
// import { Gallery } from "@/components/landing/gallery";
import type { getDictionary } from "@/components/internationalization/dictionaries"

import Boost from "./boost"
// import Automated from "@/components/automated/featured";
// import Codebase from "@/components/landing/codebase";
import FAQs from "./faqs"
import Hero from "./hero"
import LetsWorkTogether from "./lets-work-together"
import LogoCloud from "./logo-cloud"
import MissionCards from "./mission-cards"
import OpenSource from "./open-source"
import StorySection from "./story-section"
// import Stack from "./stack";
import Testimonial from "./testimonial"
// import Wizard from "@/components/wizard";
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
      {/* <Wizard /> */}
      <Testimonial dictionary={dictionary} lang={lang} />
      <LogoCloud dictionary={dictionary} lang={lang} />
      <OpenSource dictionary={dictionary} lang={lang} />
      <FAQs dictionary={dictionary} lang={lang} />
      <LetsWorkTogether dictionary={dictionary} lang={lang} />
      <Boost dictionary={dictionary} lang={lang} />
    </main>
  )
}
