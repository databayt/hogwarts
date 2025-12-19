import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getLesson } from "@/components/platform/lessons/actions"
import { LessonDetailContent } from "@/components/platform/lessons/detail"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function LessonDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const result = await getLesson({ id })

  return (
    <LessonDetailContent
      data={result.success ? result.data : null}
      error={result.success ? null : result.error}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
