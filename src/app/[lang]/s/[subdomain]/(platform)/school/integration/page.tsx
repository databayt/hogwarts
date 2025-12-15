import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import IntegrationContent from "@/components/platform/school/integration/content"

export const metadata = { title: "School: Integration" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <IntegrationContent dictionary={dictionary} lang={lang} />
}
