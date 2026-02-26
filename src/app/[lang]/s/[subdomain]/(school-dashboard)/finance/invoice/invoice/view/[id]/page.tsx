// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import RouteModal from "@/components/atom/modal/route-modal"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ViewInvoiceModalContent from "@/components/school-dashboard/finance/invoice/invoice/view-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ViewInvoice({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)
  return (
    <RouteModal
      returnTo={`/${lang}/invoice`}
      content={
        <ViewInvoiceModalContent
          invoiceId={id}
          dictionary={dictionary}
          lang={lang}
        />
      }
    />
  )
}
