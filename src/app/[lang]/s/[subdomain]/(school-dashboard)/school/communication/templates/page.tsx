import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import TemplatesContent from "@/components/school-dashboard/school/communication/templates/content"

export const metadata = { title: "Communication: Templates" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <TemplatesContent dictionary={dictionary} lang={lang} />
}
