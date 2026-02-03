import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import EnrollStudentContent from "@/components/school-dashboard/listings/students/enroll/content"

export const metadata = { title: "Dashboard: Enroll Student" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <EnrollStudentContent dictionary={dictionary.school} lang={lang} />
}
