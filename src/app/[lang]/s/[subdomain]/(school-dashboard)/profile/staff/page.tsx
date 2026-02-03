import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { StaffDirectoryContent } from "@/components/school-dashboard/profile/staff/directory"

export const metadata = { title: "Staff Directory" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <StaffDirectoryContent dictionary={dictionary} lang={lang} />
}
