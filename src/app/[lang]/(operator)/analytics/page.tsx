import { AnalyticsContent } from "@/components/operator/analytics/content";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{
    lang: Locale;
  }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const { lang } = await params;

  return <AnalyticsContent dictionary={{}} lang={lang} />;
}
