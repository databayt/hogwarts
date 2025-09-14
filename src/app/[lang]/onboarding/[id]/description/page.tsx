import DescriptionContent from "@/components/onboarding/description/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "School Description | Onboarding",
  description: "Describe your school and what makes it unique.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Description({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <DescriptionContent dictionary={dictionary.school} />;
}