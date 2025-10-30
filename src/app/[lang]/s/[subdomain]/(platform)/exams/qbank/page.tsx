import QuestionBankContent from "@/components/platform/exams/qbank/content";
import { getDictionary } from "@/components/internationalization/dictionaries";
import type { Locale } from "@/components/internationalization/config";
import type { SearchParams } from "nuqs/server";

interface PageProps {
  params: Promise<{
    lang: Locale;
    subdomain: string;
  }>;
  searchParams: Promise<SearchParams>;
}

export default async function QBankPage({ params, searchParams }: PageProps) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <QuestionBankContent
      searchParams={searchParams}
      dictionary={dictionary}
      lang={lang}
    />
  );
}
