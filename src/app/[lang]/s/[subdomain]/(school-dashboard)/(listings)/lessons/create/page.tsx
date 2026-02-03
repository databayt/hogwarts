import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import CreateLessonContent from "@/components/school-dashboard/listings/lessons/create/content"

export const metadata = { title: "Dashboard: Create Lesson" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CreateLessonContent dictionary={dictionary.school} lang={lang} />
}
