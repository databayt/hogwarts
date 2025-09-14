import BrandingContent from "@/components/onboarding/branding/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Branding",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Branding({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <BrandingContent dictionary={dictionary.school} />;
}