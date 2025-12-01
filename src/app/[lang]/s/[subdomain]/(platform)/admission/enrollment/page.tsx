import { Metadata } from "next"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { EnrollmentContent } from '@/components/platform/admission/enrollment-content'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary?.school?.admission?.nav?.enrollment || "Enrollment",
    description: "Process and manage student enrollments",
  }
}

export default async function EnrollmentPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <EnrollmentContent
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
