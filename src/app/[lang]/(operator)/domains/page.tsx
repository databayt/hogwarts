import { DomainsContent } from "@/components/operator/domains/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Domains",
  description: "Manage domain requests and configurations"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Domains({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <DomainsContent dictionary={dictionary} lang={lang} />;
}


