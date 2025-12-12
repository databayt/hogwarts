import { AdmissionHero } from "./sections/hero";
import { AdmissionValues } from "./sections/values";
import { AdmissionProcess } from "./sections/process";
import { AdmissionRequirements } from "./sections/requirements";
import { AdmissionDates } from "./sections/dates";
import { AdmissionCTA } from "./sections/cta";
import type { School } from "../types";
import type { Dictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  school: School;
  dictionary: Dictionary;
  lang: Locale;
  subdomain: string;
}

export default function AdmissionContent({ school, dictionary, lang }: Props) {
  return (
    <main className="flex flex-col bg-background">
      <AdmissionHero lang={lang} dictionary={dictionary} />
      <AdmissionValues lang={lang} dictionary={dictionary} />
      <AdmissionProcess lang={lang} dictionary={dictionary} />
      <AdmissionRequirements lang={lang} dictionary={dictionary} />
      <AdmissionDates lang={lang} dictionary={dictionary} />
      <AdmissionCTA lang={lang} dictionary={dictionary} />
    </main>
  );
}
