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
  return (
    <main className="bg-background flex min-h-screen flex-col">
      <Hero dictionary={dictionary} lang={lang} />
      <StorySection dictionary={dictionary} />
      <MissionCards dictionary={dictionary} />
      {/* <Gallery />
      <Stack />
      <Automated />
      <Codebase /> */}
      <Time dictionary={dictionary} />
      {/* <Wizard /> */}
      <Testimonial dictionary={dictionary} />
      <LogoCloud dictionary={dictionary} />
      <OpenSource dictionary={dictionary} />
      <FAQs dictionary={dictionary} />
      <LetsWorkTogether dictionary={dictionary} />
      <Boost dictionary={dictionary} />
    </main>
  )
}
