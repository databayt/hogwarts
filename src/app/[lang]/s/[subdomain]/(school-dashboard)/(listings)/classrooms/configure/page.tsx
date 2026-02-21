import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigureContent } from "@/components/school-dashboard/listings/classrooms/configure/content"

export const metadata = { title: "Dashboard: Configure Sections" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ConfigureContent dictionary={dictionary.school} lang={lang} />
}
