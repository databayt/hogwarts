import LegalContent from "@/components/onboarding/legal/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Legal | Onboarding",
  description: "Review and accept legal terms.",
};

interface Props {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function Legal({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return <LegalContent dictionary={dictionary} lang={lang} id={id} />;
}