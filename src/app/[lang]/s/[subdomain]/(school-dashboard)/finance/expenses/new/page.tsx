// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Submit Expense" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewExpensePage({ params }: Props) {
  await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Submit Expense</h3>
        <p className="text-muted-foreground text-sm">
          Submit a new expense for approval
        </p>
      </div>
      <p className="text-muted-foreground">
        Expense submission form coming soon.
      </p>
    </div>
  )
}
