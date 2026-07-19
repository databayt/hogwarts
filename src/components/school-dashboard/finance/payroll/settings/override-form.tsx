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

interface Props {
  /** Current saved override (nulls = inheriting the country default). */
  current: {
    countryOverride: string | null
    socialSecurityEmployeeRate: number | null
    socialSecurityEmployerRate: number | null
  }
  /** finance.payrollSettings slice. */
  labels?: Record<string, string>
}

export function PayrollOverrideForm({ current, labels }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    try {
      const fd = new FormData(e.currentTarget)
      const { saveSchoolPayrollPolicy } = await import("./actions")
      const res = await saveSchoolPayrollPolicy({
        countryOverride: String(fd.get("countryOverride") ?? ""),
        socialSecurityEmployeeRate: String(fd.get("employeeRate") ?? ""),
        socialSecurityEmployerRate: String(fd.get("employerRate") ?? ""),
      })
      if (res.success) {
        toast.success(labels?.saved || "Saved")
        router.refresh()
      } else {
        toast.error(labels?.saveFailed || "Could not save")
      }
    } catch {
      toast.error(labels?.saveFailed || "Could not save")
    } finally {
      setBusy(false)
    }
  }

  const inherit = labels?.inherit || "inherit"

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-1">
        <Label htmlFor="countryOverride">{labels?.countryOverride}</Label>
        <Input
          id="countryOverride"
          name="countryOverride"
          defaultValue={current.countryOverride ?? ""}
          placeholder={inherit}
          maxLength={2}
          className="uppercase"
        />
        <p className="text-muted-foreground text-xs">
          {labels?.countryOverrideHint}
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="employeeRate">{labels?.employeeRatePct}</Label>
        <Input
          id="employeeRate"
          name="employeeRate"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={current.socialSecurityEmployeeRate ?? ""}
          placeholder={inherit}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="employerRate">{labels?.employerRatePct}</Label>
        <Input
          id="employerRate"
          name="employerRate"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={current.socialSecurityEmployerRate ?? ""}
          placeholder={inherit}
        />
      </div>
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        {busy ? labels?.saving : labels?.save}
      </Button>
    </form>
  )
}
