import type { Metadata } from "next";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { PageHeadingSetter } from "@/components/platform/context/page-heading-setter";
import { OperatorSalesContent } from "@/components/operator/sales/content";

export const metadata: Metadata = {
  title: "Sales | Leads",
  description: "Manage B2B sales leads and CRM",
};

interface Props {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function OperatorSales({ params, searchParams }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={dictionary?.sales?.title || "Sales"} />
      <OperatorSalesContent
        searchParams={searchParams}
        dictionary={dictionary.sales}
        lang={lang}
      />
    </div>
  );
}
