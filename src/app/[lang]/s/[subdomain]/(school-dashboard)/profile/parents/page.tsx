import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ParentDirectoryContent } from "@/components/school-dashboard/profile/parent/directory"

export const metadata = { title: "Parent Portal" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ParentDirectoryContent dictionary={dictionary} lang={lang} />
}
