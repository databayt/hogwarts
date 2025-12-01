import { constructMetadata } from "@/components/marketing/pricing/lib/utils";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import BillingContentWrapper from "@/components/platform/billing/content";

export const metadata = constructMetadata({
  title: "Billing – School Administration",
  description: "Manage billing, subscription, and payment information.",
});

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
}

export default async function Billing({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <BillingContentWrapper dictionary={dictionary} />;
}
