import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { type SearchParams } from "nuqs/server";
import ResultsAnalyticsContent from "@/components/platform/exams/results/analytics";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function ResultsAnalyticsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <ResultsAnalyticsContent
      dictionary={dictionary}
      lang={lang}
      searchParams={searchParams}
    />
  );
}
