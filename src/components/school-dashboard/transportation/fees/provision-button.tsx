"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Receipt } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { provisionTransportFees } from "@/components/school-dashboard/finance/fees/transport-provisioning"

interface Props {
  dictionary: Dictionary
}

/**
 * "Provision to billing" — turns the read-only transport fee preview into real
 * FeeAssignment + UserInvoice rows for a chosen billing month, via the
 * finance-owned provisionTransportFees action. Idempotent server-side, so
 * re-running a month is safe.
 */
export function FeesProvisionButton({ dictionary }: Props) {
  const tp = (dictionary as Record<string, any>)?.finance
    ?.transportProvisioning as Record<string, string> | undefined
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await provisionTransportFees({ billingMonth: month })
      if (result.success && result.data) {
        const { studentsProvisioned, invoicesCreated } = result.data
        if (studentsProvisioned === 0 && invoicesCreated === 0) {
          toast.info(tp?.nothingNew || "Already provisioned — nothing new.")
        } else {
          toast.success(
            (
              tp?.successSummary ||
              "Provisioned {students} students, {invoices} invoices created."
            )
              .replace("{students}", String(studentsProvisioned))
              .replace("{invoices}", String(invoicesCreated))
          )
        }
        setOpen(false)
      } else {
        toast.error(tp?.error || "Provisioning failed. Try again.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Receipt className="me-2 h-4 w-4" />
          {tp?.button || "Provision to billing"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tp?.title || "Provision transport fees"}</DialogTitle>
          <DialogDescription>
            {tp?.description ||
              "Creates fee assignments and invoices for every student actively assigned to a fee-bearing route, for the selected month. Safe to re-run."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="billing-month">
            {tp?.monthLabel || "Billing month"}
          </Label>
          <Input
            id="billing-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {tp?.cancel || "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || !month}>
            {isPending
              ? tp?.provisioning || "Provisioning…"
              : tp?.confirm || "Provision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
