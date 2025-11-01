import { auth } from "@/auth"
import { InvoiceTable } from "@/components/platform/finance/invoice/table"
import { invoiceColumns, type InvoiceRow } from "@/components/platform/finance/invoice/columns"
import { SearchParams } from 'nuqs/server'
import { invoiceSearchParams } from '@/components/platform/finance/invoice/list-params'
import { getInvoicesWithFilters } from '@/components/platform/finance/invoice/actions'
import { redirect } from "next/navigation"
import { checkCurrentUserPermission } from '../lib/permissions'

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string;
  email?: string | null;
  role?: string;
  schoolId?: string | null;
};

// Extended session type
type ExtendedSession = {
  user: ExtendedUser;
};

interface Props {
  searchParams: Promise<SearchParams>
}

export async function InvoiceContent({ searchParams }: Props) {
  const session = await auth() as ExtendedSession | null

  if (!session?.user?.id) {
    redirect("/login")
  }

  if (!session.user.schoolId) {
    redirect("/onboarding")
  }

  // Check permissions for current user
  const canView = await checkCurrentUserPermission(session.user.schoolId, 'invoice', 'view')

  // If user can't view invoices, show permission denied
  if (!canView) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <h1 className="text-xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">You don't have permission to view invoices</p>
        </div>
      </div>
    )
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
      <InvoiceTable initialData={data} columns={invoiceColumns} total={total} perPage={sp.perPage} />
    </div>
  )
}

export default InvoiceContent


