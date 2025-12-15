import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SystemContent from "@/components/platform/school/system/content"

export const metadata = { title: "School: System" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <SystemContent dictionary={dictionary} lang={lang} />
}
