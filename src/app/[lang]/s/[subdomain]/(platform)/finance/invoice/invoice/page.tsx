import { InvoiceContent } from "@/components/platform/finance/invoice/invoice/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function Invoice({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <InvoiceContent dictionary={dictionary} lang={lang} />;
}
