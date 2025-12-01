import { getDictionary } from "@/components/internationalization/dictionaries"
import type { Locale } from "@/components/internationalization/config"
import UpcomingExamsContent from "@/components/platform/exams/upcoming/content"

export const metadata = { title: "Upcoming Exams" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function UpcomingExamsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <UpcomingExamsContent dictionary={dictionary} lang={lang} />
}
