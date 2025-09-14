import LegalContent from "@/components/onboarding/legal/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Legal | Onboarding",
  description: "Review and accept legal terms.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Legal({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <LegalContent dictionary={dictionary.school} />;
}