import DiscountContent from "@/components/onboarding/discount/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Discount | Onboarding",
  description: "Set up discount options for your school.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Discount({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <DiscountContent dictionary={dictionary.school} />;
}