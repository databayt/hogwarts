import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import MembershipContent from "@/components/platform/school/membership/content"

export const metadata = { title: "School: Membership" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <MembershipContent dictionary={dictionary} lang={lang} />
}
