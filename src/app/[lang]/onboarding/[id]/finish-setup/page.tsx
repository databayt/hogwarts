import FinishSetupContent from "@/components/onboarding/finish-setup/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Finish Setup | Onboarding",
  description: "Complete your school setup.",
};

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function FinishSetup({ params }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return <FinishSetupContent dictionary={dictionary.school} />;
} 