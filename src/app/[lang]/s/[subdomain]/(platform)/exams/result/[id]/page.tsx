import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ResultDetailContent from "@/components/platform/exams/results/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ExamResultDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <ResultDetailContent dictionary={dictionary} lang={lang} examId={id} />
}
