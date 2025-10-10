import MarketingContent from "@/components/marketing/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Home({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <MarketingContent dictionary={dictionary} />;
}