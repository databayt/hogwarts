import { Metadata } from "next"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { SettingsContent } from '@/components/platform/admission/settings-content'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.admission?.nav?.settings || "Admission Settings",
    description: "Configure admission criteria, documents, and policies",
  }
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <SettingsContent
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
