
import Hero from "./hero";
// import Stack from "./stack";
import Testimonial from "./testimonial";
import LetsWorkTogether from "./lets-work-together";
// import Wizard from "@/components/wizard";
import Time from "./time";
import Boost from "./boost";
import OpenSource from "./open-source";
import StorySection from "./story-section";
// import Automated from "@/components/automated/featured";
// import Codebase from "@/components/landing/codebase";
import FAQs from "./faqs";
import LogoCloud from "./logo-cloud";
import MissionCards from "./mission-cards";
// import { Gallery } from "@/components/landing/gallery";
import type { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/config';

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>;
  lang: Locale;
}

export default function HomeContent(props: Props) {
  const { dictionary, lang } = props;
  return (
    <main className="flex min-h-screen flex-col bg-background">
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
  );
}
