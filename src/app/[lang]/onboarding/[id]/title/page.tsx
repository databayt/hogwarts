import TitleContent from "@/components/onboarding/title/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "School Name | Onboarding",
  description: "Set your school name to get started with the onboarding process.",
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Title({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <TitleContent dictionary={dictionary.school} />;
}