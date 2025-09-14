import VisibilityContent from "@/components/onboarding/visibility/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Visibility | Onboarding",
  description: "Set your school's visibility settings.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Visibility({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <VisibilityContent dictionary={dictionary.school} />;
}