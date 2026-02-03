import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import CommunicationContent from "@/components/school-dashboard/school/communication/content"

export const metadata = { title: "School: Communication" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CommunicationContent dictionary={dictionary} lang={lang} />
}
