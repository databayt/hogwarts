import MarketingContent from "@/components/marketing/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface HomePageProps {
  params: Promise<{ lang: Locale }>
}

export default async function HomePage({ params }: HomePageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <MarketingContent dictionary={dictionary} />;
}