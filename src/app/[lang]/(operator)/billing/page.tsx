import { BillingContent } from "@/components/operator/billing/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

export const metadata = {
  title: "Billing",
  description: "Operator billing and invoice management"
};

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function Billing({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <BillingContent dictionary={dictionary} lang={lang} />;
}


