import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { ApplicationDetail } from '@/components/platform/admission/application-detail'
import { getApplicationById } from '@/components/platform/admission/actions'

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const application = await getApplicationById(id)

  return {
    title: application?.applicationNumber
      ? `Application ${application.applicationNumber}`
      : dictionary?.school?.admission?.nav?.applications || "Application Details",
    description: `Review admission application details`,
  }
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  const application = await getApplicationById(id)

  if (!application) {
    notFound()
  }

  return (
    <ApplicationDetail
      application={application}
      dictionary={dictionary?.school?.admission}
      lang={lang}
    />
  )
}
