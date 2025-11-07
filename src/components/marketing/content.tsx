
import Hero from "./hero";
// import Stack from "./stack";
import Testimonial from "./testimonial";
import LetsWorkTogether from "./lets-work-together";
// import Wizard from "@/components/wizard";
import Time from "./time";
import Boost from "./boost";
// import OpenSource from "./open-source";
// import Automated from "@/components/automated/featured";
// import Codebase from "@/components/landing/codebase";
import FAQs from "./faqs";
import LogoCloud from "./logo-cloud";
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
    <main className="flex min-h-screen flex-col">
        <h1>dfshdgsh</h1>
      <Hero dictionary={dictionary} lang={lang} />
      {/* <Gallery />
      <Stack />
      <Automated />
      <OpenSource />
      <Codebase /> */}
      <Time dictionary={dictionary} />
      {/* <Wizard /> */}
      <Testimonial dictionary={dictionary} />
      <LogoCloud dictionary={dictionary} />
      <FAQs dictionary={dictionary} />
      <LetsWorkTogether dictionary={dictionary} />
      <Boost dictionary={dictionary} />
    </main>
  );
}
