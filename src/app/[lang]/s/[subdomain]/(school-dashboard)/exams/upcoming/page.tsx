import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import UpcomingExamsContent from "@/components/school-dashboard/exams/upcoming/content"

export const metadata = { title: "Upcoming Exams" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function UpcomingExamsPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const sp = await searchParams
  const dictionary = await getDictionary(lang)
  const catalogSubjectId =
    typeof sp.catalogSubjectId === "string" ? sp.catalogSubjectId : undefined

  return (
    <UpcomingExamsContent
      dictionary={dictionary}
      lang={lang}
      catalogSubjectId={catalogSubjectId}
    />
  )
}
