// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Check, Circle, Clock } from "lucide-react"

import { formatCurrency, formatDate } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"

type Installment = {
  number: number
  dueDate: string
  amount: number
  description?: string
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE"
  paidAmount: number
}

interface InstallmentTimelineProps {
  installments: Installment[]
  totalAmount: number
  totalPaid: number
  lang: Locale
}

const STATUS_ICON = {
  PAID: Check,
  PARTIAL: Clock,
  PENDING: Circle,
  OVERDUE: Clock,
} as const

const STATUS_COLOR = {
  PAID: "text-green-500 bg-green-500/10 border-green-500/20",
  PARTIAL: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  PENDING: "text-muted-foreground bg-muted border-border",
  OVERDUE: "text-red-500 bg-red-500/10 border-red-500/20",
} as const

const LINE_COLOR = {
  PAID: "bg-green-500",
  PARTIAL: "bg-yellow-500",
  PENDING: "bg-border",
  OVERDUE: "bg-red-500",
} as const

export function InstallmentTimeline({
  installments,
  totalAmount,
  totalPaid,
  lang,
}: InstallmentTimelineProps) {
  if (installments.length <= 1) return null

  const progressPercent =
    totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Installment Plan</span>
          <Badge variant="outline" className="tabular-nums">
            {installments.filter((i) => i.status === "PAID").length}/
            {installments.length} paid
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="text-muted-foreground flex justify-between text-sm">
            <span>{formatCurrency(totalPaid, lang)} paid</span>
            <span>{formatCurrency(totalAmount, lang)} total</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Timeline */}
        <div className="relative space-y-0">
          {installments.map((inst, idx) => {
            const Icon = STATUS_ICON[inst.status]
            const isLast = idx === installments.length - 1

            return (
              <div key={inst.number} className="relative flex gap-4 pb-6">
                {/* Vertical line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute start-[15px] top-[32px] h-[calc(100%-24px)] w-0.5",
                      LINE_COLOR[inst.status]
                    )}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                    STATUS_COLOR[inst.status]
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      Installment {inst.number}
                      {inst.description && (
                        <span className="text-muted-foreground ms-2 text-sm font-normal">
                          {inst.description}
                        </span>
                      )}
                    </p>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(inst.amount, lang)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm tabular-nums">
                      Due: {formatDate(new Date(inst.dueDate), lang)}
                    </span>
                    {inst.status === "PARTIAL" && inst.paidAmount > 0 && (
                      <span className="text-muted-foreground text-sm tabular-nums">
                        Paid: {formatCurrency(inst.paidAmount, lang)}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("text-xs", STATUS_COLOR[inst.status])}
                    >
                      {inst.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Parse fee structure payment schedule into installment timeline data.
 * Allocates payments to installments in chronological order.
 */
export function buildInstallments(
  paymentSchedule: Array<{
    dueDate: string
    amount: number
    description?: string
  }> | null,
  installmentCount: number,
  totalAmount: number,
  payments: Array<{
    amount: number
    status: string
    paymentDate: Date | string
  }>,
  assignmentCreatedAt?: Date | string
): Installment[] {
  // If there's an explicit schedule, use it
  if (paymentSchedule?.length) {
    let remainingPaid = payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0)

    return paymentSchedule.map((sched, idx) => {
      const instAmount = Number(sched.amount)
      const allocated = Math.min(remainingPaid, instAmount)
      remainingPaid -= allocated

      const now = new Date()
      const due = new Date(sched.dueDate)
      let status: Installment["status"] = "PENDING"
      if (allocated >= instAmount) status = "PAID"
      else if (allocated > 0) status = "PARTIAL"
      else if (due < now) status = "OVERDUE"

      return {
        number: idx + 1,
        dueDate: sched.dueDate,
        amount: instAmount,
        description: sched.description,
        status,
        paidAmount: allocated,
      }
    })
  }

  // Otherwise generate equal installments
  if (installmentCount <= 1) return []

  const perInstallment = totalAmount / installmentCount
  let remainingPaid = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0)

  // Use assignment creation date as anchor for deterministic schedules
  const now = new Date()
  const anchorDate = assignmentCreatedAt ? new Date(assignmentCreatedAt) : now
  const startMonth = anchorDate.getMonth()
  const startYear = anchorDate.getFullYear()

  return Array.from({ length: installmentCount }, (_, idx) => {
    const dueDate = new Date(startYear, startMonth + idx, 1)
    const allocated = Math.min(remainingPaid, perInstallment)
    remainingPaid -= allocated

    let status: Installment["status"] = "PENDING"
    if (allocated >= perInstallment) status = "PAID"
    else if (allocated > 0) status = "PARTIAL"
    else if (dueDate < now) status = "OVERDUE"

    return {
      number: idx + 1,
      dueDate: dueDate.toISOString(),
      amount: perInstallment,
      status,
      paidAmount: allocated,
    }
  })
}
