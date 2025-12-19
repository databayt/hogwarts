import { Metadata } from "next"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { verifyPaymentAndActivateEnrollment } from "@/components/stream/courses/enrollment/actions"
import { StreamPaymentSuccessContent } from "@/components/stream/payment/success-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
  searchParams?: Promise<{ session_id?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.payment?.success?.title || "Payment Successful",
    description:
      dictionary.stream?.payment?.success?.description ||
      "Your enrollment payment was successful",
  }
}

export default async function StreamPaymentSuccessPage({
  params,
  searchParams,
}: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const search = await searchParams

  // Verify payment and activate enrollment server-side
  let verificationResult = null
  if (search?.session_id) {
    verificationResult = await verifyPaymentAndActivateEnrollment(
      search.session_id
    )
  }

  return (
    <StreamPaymentSuccessContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      sessionId={search?.session_id}
      verificationResult={verificationResult}
    />
  )
}
