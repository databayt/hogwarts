/**
 * Receipt Detail Page
 * Follows Hogwarts page pattern - server component that fetches single receipt
 */

import { notFound } from 'next/navigation'
import { ReceiptDetail } from '@/components/receipts/receipt-detail'
import { getReceiptById } from '@/components/receipts/actions'

export const metadata = {
  title: 'Receipt Details | Expense Tracker',
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
    <div className="container mx-auto py-8">
      <ReceiptDetail receipt={result.data} locale="en" />
    </div>
  )
}
