import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import { type SearchParams } from "nuqs/server";
import ResultsContent from "@/components/platform/exams/results/content";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function ResultsPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <ResultsContent
      dictionary={dictionary}
      lang={lang}
      searchParams={searchParams}
    />
  );
}
