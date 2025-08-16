import { auth } from "@/auth"
import { InvoiceTable } from "@/components/invoice/table"
import { invoiceColumns, type InvoiceRow } from "@/components/invoice/columns"
import { SearchParams } from 'nuqs/server'
import { invoiceSearchParams } from '@/components/invoice/list-params'
import { getInvoicesWithFilters } from '@/components/invoice/actions'
import { redirect } from "next/navigation"

interface InvoiceContentProps {
  searchParams: Promise<SearchParams>
}

export async function InvoiceContent({ searchParams }: InvoiceContentProps) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }
  
  if (!session.user.schoolId) {
    redirect("/onboarding")
  }
  
  const sp = await invoiceSearchParams.parse(await searchParams)
  let data: InvoiceRow[] = []
  let total = 0
  
  try {
    const result = await getInvoicesWithFilters(sp)
    if (result.success) {
      data = result.data
      total = result.total
    }
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
  }
  
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">Manage and track your invoices</p>
      </div>
      <InvoiceTable data={data} columns={invoiceColumns} pageCount={Math.max(1, Math.ceil(total / (sp.perPage || 20)))} />
    </div>
  )
}

export default InvoiceContent


