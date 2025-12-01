import { Metadata } from "next";
import BillingContent from "@/components/platform/billing/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";

export const metadata: Metadata = {
  title: "Billing | Hogwarts",
  description: "Manage your subscription and billing information",
};

interface Props {
  params: Promise<{
    lang: Locale;
    subdomain: string;
  }>;
}

export default async function BillingPage({ params }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <BillingContent dictionary={dictionary} lang={lang} />;
}
