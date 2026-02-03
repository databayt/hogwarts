import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaidInvoiceContent from "@/components/school-dashboard/finance/invoice/invoice/paid-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; invoiceId: string }>
}

export default async function PaidInvoice({ params }: Props) {
  const { lang, invoiceId } = await params
  const dictionary = await getDictionary(lang)

  return (
    <PaidInvoiceContent
      invoiceId={invoiceId}
      dictionary={dictionary}
      lang={lang}
    />
  )
}
