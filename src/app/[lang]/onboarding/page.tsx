import OnboardingContent from '@/components/onboarding/content';
import { getDictionary } from '@/components/internationalization/dictionaries';
import { type Locale } from '@/components/internationalization/config';

export const metadata = {
  title: "School Onboarding | Hogwarts SaaS",
  description: "Create and manage your school in our multi-tenant platform. Start with templates or build from scratch.",
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Onboarding({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <OnboardingContent dictionary={dictionary.school} locale={lang} />;
}