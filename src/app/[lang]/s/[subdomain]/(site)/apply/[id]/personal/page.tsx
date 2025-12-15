import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PersonalContent from "@/components/site/apply/personal/content"

export const metadata = {
  title: "Personal Information | Apply",
  description: "Enter your personal information to start your application.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function PersonalPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <PersonalContent dictionary={dictionary} />
}
