import SubdomainContent from "@/components/onboarding/subdomain/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "School Subdomain",
};

interface Props {
  params: Promise<{ lang: Locale; id: string }>;
}

export default async function Subdomain({ params }: Props) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return <SubdomainContent dictionary={dictionary} lang={lang} id={id} />;
}
