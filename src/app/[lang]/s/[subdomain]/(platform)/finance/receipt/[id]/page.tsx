/**
 * Receipt Detail Page
 * Follows Hogwarts page pattern - server component that fetches single receipt
 */

import { notFound } from "next/navigation"

import { getReceiptById } from "@/components/platform/finance/receipt/actions"
import { ReceiptDetail } from "@/components/platform/finance/receipt/receipt-detail"

export const metadata = {
  title: "Receipt Details | Expense Tracker",
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReceiptDetailPage({ params }: Props) {
  const { id } = await params

  // Fetch receipt on the server
  const result = await getReceiptById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="py-8">
      <ReceiptDetail receipt={result.data} locale="en" />
    </div>
  )
}
