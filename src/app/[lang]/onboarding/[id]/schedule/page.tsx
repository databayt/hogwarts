import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ScheduleContent from "@/components/onboarding/schedule/content"

export const metadata = {
  title: "School Schedule",
}

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Schedule({ params }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ScheduleContent dictionary={dictionary.school} />
}
