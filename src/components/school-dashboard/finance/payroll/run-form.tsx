// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  lang: string
  /** finance.payrollWorkflow slice. */
  labels?: Record<string, string>
}

/** Create-a-payroll-run form — starts the DRAFT run the disbursement flow acts on. */
export function PayrollRunForm({ lang, labels }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    try {
      const fd = new FormData(e.currentTarget)
      const { createPayrollRun } = await import("./actions")
      const res = await createPayrollRun(fd)
      if (res.success && res.data) {
        router.push(`/${lang}/finance/payroll/runs/${res.data}`)
      } else {
        toast.error(labels?.actionFailed || res.error || "")
        setBusy(false)
      }
    } catch {
      toast.error(labels?.actionFailed || "")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-1">
        <Label htmlFor="payPeriodStart">{labels?.periodStart}</Label>
        <Input id="payPeriodStart" name="payPeriodStart" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="payPeriodEnd">{labels?.periodEnd}</Label>
        <Input id="payPeriodEnd" name="payPeriodEnd" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="payDate">{labels?.payDate}</Label>
        <Input id="payDate" name="payDate" type="date" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">{labels?.notes}</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {busy ? labels?.creating : labels?.createRun}
      </Button>
    </form>
  )
}
