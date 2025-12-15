import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import StandOutContent from "@/components/onboarding/stand-out/content"

export const metadata = {
  title: "Make Your School Stand Out | Onboarding",
  description: "Add amenities and photos to make your school stand out.",
}

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function StandOut({ params }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <StandOutContent dictionary={dictionary.school} />
}
