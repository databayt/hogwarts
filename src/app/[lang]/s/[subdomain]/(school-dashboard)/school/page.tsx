import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SchoolOverviewContent from "@/components/school-dashboard/school/content"

export const metadata = { title: "School Overview" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SchoolOverviewContent dictionary={dictionary} lang={lang} />
}
