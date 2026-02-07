import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BroadcastContent from "@/components/school-dashboard/school/communication/broadcast/content"

export const metadata = { title: "Communication: Broadcast" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BroadcastContent dictionary={dictionary} lang={lang} />
}
