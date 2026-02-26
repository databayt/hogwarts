// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { SearchParams } from "nuqs/server"

import { InvoiceContent } from "@/components/school-dashboard/finance/invoice/content"

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function List({ searchParams }: Props) {
  return <InvoiceContent searchParams={searchParams} />
}
