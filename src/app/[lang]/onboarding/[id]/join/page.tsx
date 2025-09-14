import JoinContent from "@/components/onboarding/join/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Join | Onboarding",
  description: "Join your school community.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Join({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <JoinContent dictionary={dictionary.school} />;
}