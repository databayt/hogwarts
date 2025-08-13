import { auth } from "@/auth"
import InvoiceClientPage from "@/components/invoice/invoice/InvoiceClientPage"
import { Suspense } from "react"
import Loading from "@/components/invoice/Loading"

export async function InvoiceContent() {
  const session = await auth()
  return (
    <Suspense fallback={<Loading />}> 
      <InvoiceClientPage userId={session?.user.id} currency={undefined} />
    </Suspense>
  )
}

export default InvoiceContent


