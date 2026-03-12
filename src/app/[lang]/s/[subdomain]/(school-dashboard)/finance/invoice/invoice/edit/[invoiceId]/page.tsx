// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string; subdomain: string; invoiceId: string }>
}

export default async function EditInvoice({ params }: Props) {
  const { invoiceId } = await params
  redirect(`/finance/invoice/add/${invoiceId}/details`)
}
