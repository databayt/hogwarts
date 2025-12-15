import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BulkContent from "@/components/platform/school/bulk/content"

export const metadata = { title: "School: Bulk Operations" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BulkContent dictionary={dictionary} lang={lang} />
}
