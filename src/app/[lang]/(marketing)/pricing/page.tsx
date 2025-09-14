import PricingContent from "@/components/marketing/pricing/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Pricing",
}

interface PricingPageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Pricing({ params }: PricingPageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <PricingContent />;
}