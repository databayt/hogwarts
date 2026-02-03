import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GenerateContent from "@/components/school-dashboard/exams/generate/content"

interface PageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function GeneratePage({ params }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <GenerateContent dictionary={dictionary} lang={lang} />
}
