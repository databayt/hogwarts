import { notFound } from "next/navigation"

import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import SuccessContent from "@/components/school-marketing/apply/success/content"

export const metadata = {
  title: "Application Submitted",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{ number?: string }>
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const { lang, subdomain, id } = await params
  const { number: applicationNumber } = await searchParams
  const dictionary = await getDictionary(lang)
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  return (
    <SuccessContent
      dictionary={dictionary}
      applicationNumber={applicationNumber}
      schoolName={schoolResult.data.name}
    />
  )
}
