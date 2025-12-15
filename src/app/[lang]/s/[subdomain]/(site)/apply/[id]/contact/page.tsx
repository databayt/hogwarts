import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ContactContent from "@/components/site/apply/contact/content"

export const metadata = {
  title: "Contact Information | Apply",
  description: "Enter your contact information for your application.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ContactContent dictionary={dictionary} />
}
