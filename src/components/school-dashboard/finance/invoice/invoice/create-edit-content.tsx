"use client"

import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { InvoiceCreateForm } from "@/components/school-dashboard/finance/invoice/form"

interface Props {
  invoiceId?: string
  defaults?: {
    firstName?: string | null
    lastName?: string | null
    email?: string | null
    currency?: string | null
  }
  dictionary: Dictionary
  lang: Locale
}

export default function CreateEditInvoiceModalContent({
  invoiceId,
  defaults,
  dictionary,
  lang,
}: Props) {
  return (
    <div className="h-full">
      <InvoiceCreateForm
        invoiceId={invoiceId}
        firstName={defaults?.firstName || undefined}
        lastName={defaults?.lastName || undefined}
        email={defaults?.email || undefined}
        currency={defaults?.currency || undefined}
      />
    </div>
  )
}
