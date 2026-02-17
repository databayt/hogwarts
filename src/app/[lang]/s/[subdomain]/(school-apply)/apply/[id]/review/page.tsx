import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ReviewContent from "@/components/school-marketing/apply/review/content"

export const metadata = {
  title: "Review & Submit | Apply",
  description: "Review your application before submission.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function ReviewPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ReviewContent dictionary={dictionary} />
}
