import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import { StreamPaymentSuccessContent } from "@/components/stream/payment/success-content";
import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenant-context";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams?: Promise<{ session_id?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return {
    title: dictionary.stream?.payment?.success?.title || "Payment Successful",
    description: dictionary.stream?.payment?.success?.description || "Your enrollment payment was successful",
  };
}

export default async function StreamPaymentSuccessPage({ params, searchParams }: Props) {
  const { lang, subdomain } = await params;
  const dictionary = await getDictionary(lang);
  const { schoolId } = await getTenantContext(subdomain);
  const search = await searchParams;

  return (
    <StreamPaymentSuccessContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      sessionId={search?.session_id}
    />
  );
}