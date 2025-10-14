import { ReceiptsContent } from "@/components/operator/billing/receipts/content";
import type { Locale } from "@/components/internationalization/config";

interface Props {
  params: Promise<{
    lang: Locale;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function ReceiptsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const search = await searchParams;

  return <ReceiptsContent dictionary={{}} lang={lang} searchParams={search} />;
}
