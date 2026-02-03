import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { TimetableContent } from "@/components/school-dashboard/timetable/content"

export const metadata = { title: "Dashboard: Timetable" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <TimetableContent dictionary={dictionary.school} />
}
