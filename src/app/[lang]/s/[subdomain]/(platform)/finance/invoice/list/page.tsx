import { SearchParams } from "nuqs/server"

import { InvoiceContent } from "@/components/platform/finance/invoice/content"

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function List({ searchParams }: Props) {
  return <InvoiceContent searchParams={searchParams} />
}
