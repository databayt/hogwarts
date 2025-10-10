import AllFeatures from "@/components/marketing/features/all";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Features",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Features({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <AllFeatures dictionary={dictionary} lang={lang} />;
}