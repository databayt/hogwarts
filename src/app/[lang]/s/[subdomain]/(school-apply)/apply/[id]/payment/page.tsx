import { type Locale } from "@/components/internationalization/config"
import PaymentContent from "@/components/school-marketing/apply/payment/content"

export const metadata = {
  title: "Payment | Apply",
  description: "Pay your application fee.",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
  searchParams: Promise<{
    number?: string
    appId?: string
    fee?: string
    currency?: string
    methods?: string
  }>
}

export default async function PaymentPage({ params, searchParams }: Props) {
  const resolvedParams = await searchParams
  await params

  const applicationNumber = resolvedParams.number ?? ""
  const applicationId = resolvedParams.appId ?? ""
  const fee = parseFloat(resolvedParams.fee ?? "0")
  const currency = resolvedParams.currency ?? "USD"
  const methods = resolvedParams.methods
    ? resolvedParams.methods.split(",").filter(Boolean)
    : ["stripe", "cash"]

  return (
    <PaymentContent
      applicationNumber={applicationNumber}
      applicationId={applicationId}
      fee={fee}
      currency={currency}
      methods={methods}
    />
  )
}
