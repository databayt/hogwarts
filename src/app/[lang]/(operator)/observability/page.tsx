import { ObservabilityContent } from "@/components/operator/observability/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Observability",
  description: "System logs and audit trails"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Observability({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <ObservabilityContent dictionary={dictionary} lang={lang} />;
}


