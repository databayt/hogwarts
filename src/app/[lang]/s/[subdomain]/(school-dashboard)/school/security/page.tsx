import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SecurityContent from "@/components/school-dashboard/school/security/content"

export const metadata = { title: "School: Security" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SecurityContent dictionary={dictionary} lang={lang} />
}
