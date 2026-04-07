// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Receipt Detail Page
 * Follows Hogwarts page pattern - server component that fetches single receipt
 */

import { notFound } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getReceiptById } from "@/components/school-dashboard/finance/receipt/actions"
import { ReceiptDetail } from "@/components/school-dashboard/finance/receipt/receipt-detail"

export const metadata = {
  title: "Receipt Details | Expense Tracker",
}

interface Props {
  params: Promise<{ id: string; lang: Locale }>
}

export default async function ReceiptDetailPage({ params }: Props) {
  const { id, lang } = await params
  const dictionary = await getDictionary(lang)

  // Fetch receipt on the server
  const result = await getReceiptById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="py-8">
      <ReceiptDetail receipt={result.data} locale={lang} />
    </div>
  )
}
