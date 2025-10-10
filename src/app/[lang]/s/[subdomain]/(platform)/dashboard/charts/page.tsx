import ChartsContent from "@/components/platform/dashboard/charts/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function Charts({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ChartsContent dictionary={dictionary} lang={lang} />;
}