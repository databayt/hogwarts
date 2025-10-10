import FeatureDetails from "@/components/marketing/features/details";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Feature Details",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function Feature({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <FeatureDetails dictionary={dictionary} lang={lang} />;
}