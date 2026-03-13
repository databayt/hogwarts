// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Create Payroll Run" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function NewPayrollRunPage({ params }: Props) {
  const { lang } = await params
  const { schoolId } = await getTenantContext()

  if (!schoolId) {
    return <p className="text-muted-foreground">School context not found</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Create Payroll Run</h3>
        <p className="text-muted-foreground text-sm">
          Start a new payroll processing run for the current period
        </p>
      </div>
      <p className="text-muted-foreground">Payroll run form coming soon.</p>
    </div>
  )
}
