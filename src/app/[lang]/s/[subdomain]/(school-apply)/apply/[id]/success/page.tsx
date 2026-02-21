import { notFound } from "next/navigation"

import { db } from "@/lib/db"
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
  const { lang, subdomain } = await params
  const { number: applicationNumber } = await searchParams
  const dictionary = await getDictionary(lang)
  const schoolResult = await getSchoolBySubdomain(subdomain)

  if (!schoolResult.success || !schoolResult.data) {
    notFound()
  }

  // Fetch payment status if we have an application number
  let paymentMethod: string | null = null
  let paymentReference: string | null = null
  let applicationFeePaid = false

  if (applicationNumber) {
    const application = await db.application.findFirst({
      where: {
        applicationNumber,
        schoolId: schoolResult.data.id,
      },
      select: {
        paymentMethod: true,
        paymentReference: true,
        applicationFeePaid: true,
      },
    })
    if (application) {
      paymentMethod = application.paymentMethod
      paymentReference = application.paymentReference
      applicationFeePaid = application.applicationFeePaid
    }
  }

  return (
    <SuccessContent
      dictionary={dictionary}
      applicationNumber={applicationNumber}
      schoolName={schoolResult.data.name}
      paymentMethod={paymentMethod}
      paymentReference={paymentReference}
      applicationFeePaid={applicationFeePaid}
    />
  )
}
