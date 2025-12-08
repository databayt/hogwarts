import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSchoolBySubdomain } from "@/lib/subdomain-actions";
import SalesContent from "@/components/sales/content";
import { getCurrentDomain } from "@/components/site/utils";
import {
  generateSchoolMetadata,
  generateDefaultMetadata,
} from "@/components/site/metadata";
import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";

interface SalesProps {
  params: Promise<{ subdomain: string; lang: Locale }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: SalesProps): Promise<Metadata> {
  const { subdomain, lang } = await params;
  const result = await getSchoolBySubdomain(subdomain);
  const { rootDomain } = await getCurrentDomain();

  if (!result.success || !result.data) {
    return generateDefaultMetadata(rootDomain);
  }

  return {
    ...generateSchoolMetadata({
      school: result.data,
      subdomain,
      rootDomain,
    }),
    title: lang === "ar" ? "المبيعات | العملاء المحتملين" : "Sales | Leads",
  };
}

export default async function Sales({ params, searchParams }: SalesProps) {
  const { subdomain, lang } = await params;
  const dictionary = await getDictionary(lang);
  const result = await getSchoolBySubdomain(subdomain);

  if (!result.success || !result.data) {
    notFound();
  }

  const school = result.data;

  return (
    <div
      className="school-content"
      data-school-id={school.id}
      data-subdomain={subdomain}
    >
      <SalesContent
        searchParams={searchParams}
        dictionary={dictionary.sales}
        lang={lang}
      />
    </div>
  );
}
