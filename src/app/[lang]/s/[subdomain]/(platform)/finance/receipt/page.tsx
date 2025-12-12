/**
 * Receipts List Page
 * Follows Hogwarts page pattern - server component that fetches data and passes to content component
 */

import { ReceiptsContent } from '@/components/platform/finance/receipt/content'
import { getReceipts } from '@/components/platform/finance/receipt/actions'

export const metadata = {
  title: 'Receipts | Expense Tracker',
  description: 'Manage and track your expense receipts with AI-powered extraction',
}

export default async function ReceiptsPage() {
  // Fetch receipts on the server
  const result = await getReceipts({ limit: 50 })
  const initialReceipts = result.success && result.data ? result.data.receipts : []

  return (
    <div className="py-8">
      <ReceiptsContent initialReceipts={initialReceipts} locale="en" />
    </div>
  )
}
