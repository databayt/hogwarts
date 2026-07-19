// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Receipts List Page
 * Follows Hogwarts page pattern - server component that fetches data and passes to content component
 */

import type { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getReceipts } from "@/components/school-dashboard/finance/receipt/actions"
import { ReceiptsContent } from "@/components/school-dashboard/finance/receipt/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.finance?.cards?.receipts?.title ||
      "Receipts | Expense Tracker",
    description:
      dictionary?.finance?.receiptPage?.description ||
      "Manage and track your expense receipts with AI-powered extraction",
  }
}

export default async function ReceiptsPage({ params }: Props) {
  const { lang } = await params

  // Fetch receipts on the server
  const result = await getReceipts({ limit: 50 })
  const initialReceipts =
    result.success && result.data ? result.data.receipts : []

  return (
    <div className="py-8">
      <ReceiptsContent initialReceipts={initialReceipts} locale={lang} />
    </div>
  )
}
