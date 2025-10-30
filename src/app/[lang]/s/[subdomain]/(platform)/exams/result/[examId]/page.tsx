import { getDictionary } from "@/components/internationalization/dictionaries";
import { type Locale } from "@/components/internationalization/config";
import ResultDetailContent from "@/components/platform/exams/results/detail";

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; examId: string }>;
}

export default async function ExamResultDetailPage({ params }: Props) {
  const { lang, examId } = await params;
  const dictionary = await getDictionary(lang);

  return <ResultDetailContent dictionary={dictionary} lang={lang} examId={examId} />;
}
