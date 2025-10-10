import VisibilityContent from "@/components/onboarding/visibility/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Visibility | Onboarding",
  description: "Set your school's visibility settings.",
};

interface Props {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function Visibility({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return <VisibilityContent dictionary={dictionary} lang={lang} id={id} />;
}