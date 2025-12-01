import { Metadata } from "next"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { MeritContent } from '@/components/platform/admission/merit-content'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.admission?.nav?.meritList || "Merit List",
    description: "Generate and view merit lists based on configured criteria",
  }
}

export default async function MeritListPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <MeritContent
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
