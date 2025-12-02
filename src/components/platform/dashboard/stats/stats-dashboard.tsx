"use client"

import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Box, Pencil } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  limit: string
  percentage: number
  status?: string
  statusColor?: string
  progressColor: string
  details?: Array<{ label: string; value: string; color: string }>
  actionLabel: string
  actionIcon: React.ReactNode
  warningMessage?: string
  onActionClick?: () => void
}

function MetricCard({
  title,
  value,
  limit,
  percentage,
  status,
  statusColor = "text-emerald-600 dark:text-emerald-400",
  progressColor,
  details,
  actionLabel,
  actionIcon,
  warningMessage,
  onActionClick,
}: MetricCardProps) {
  const renderProgressBar = () => {
    if (details && title === "Commands") {
      const writes = Number.parseInt(details[0].value.replace(/,/g, ""))
      const reads = Number.parseInt(details[1].value.replace(/,/g, ""))
      const total = writes + reads
      const writesPercentage = (writes / total) * 100
      const readsPercentage = (reads / total) * 100

      return (
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute left-0 h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${writesPercentage}%` }}
          />
          <div
            className="absolute h-full bg-blue-500 transition-all duration-300"
            style={{
              left: `${writesPercentage}%`,
              width: `${readsPercentage}%`,
            }}
          />
        </div>
      )
    }

    return (
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    )
  }

  return (
    <Card className="relative overflow-hidden max-w-[280px]">
      <CardContent className="p-4 py-0">
        <p className="text-xs font-normal leading-none tracking-wide text-muted-foreground dark:text-foreground/80 uppercase">
          {title}
        </p>

        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-[1.2rem] font-medium leading-none text-foreground tabular-nums">
            {value}
          </span>
          <span className="text-xs leading-none text-muted-foreground">/ {limit}</span>
        </div>

        <div className="mt-3">
          {renderProgressBar()}

          {details && (
            <div className="my-6 mb-8">
              <div className="flex flex-col gap-3">
                {details.map((detail, index) => (
                  <div
                    key={index}
                    className="flex w-full items-center text-xs leading-none text-muted-foreground dark:text-foreground/70"
                  >
                    <div className={`mr-[6px] h-2 w-2 rounded-full ${detail.color}`} />
                    <span className="mr-1">{detail.label}</span>
                    <span className="h-[9px] flex-1 border-b-2 border-dotted border-border" />
                    <span className="ml-1 tabular-nums">{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status && (
            <div className="pt-2">
              <span className={statusColor}>{status}</span>
            </div>
          )}

          {warningMessage && (
            <div className="pt-2">
              <span className="text-sm text-amber-700 dark:text-amber-400">{warningMessage}</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <Button
            variant="ghost"
            className="h-8 w-full rounded-none text-blue-500 gap-0 justify-start hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 bg-muted/50"
            onClick={onActionClick}
          >
            {actionIcon}
            <span className="ml-1 text-xs">{actionLabel}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function BudgetDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [budget, setBudget] = useState("150")

  const handleUpdate = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update budget</DialogTitle>
          <DialogDescription>
            When your monthly cost reaches the max budget, we send an email and throttle your
            database. You will not be charged beyond your set budget for this database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="budget">Max budget per month</Label>
          <Input
            id="budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            type="number"
            placeholder="150"
          />
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Update</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function StatsDashboard() {
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Commands"
          value="13.8M"
          limit="Unlimited"
          percentage={67}
          progressColor="bg-blue-500"
          details={[
            { label: "Writes", value: "11,276,493", color: "bg-emerald-500" },
            { label: "Reads", value: "2,548,921", color: "bg-blue-500" },
          ]}
          actionLabel="Upgrade"
          actionIcon={<Box className="h-4 w-4" />}
        />

        <MetricCard
          title="Bandwidth"
          value="141 GB"
          limit="150 GB"
          percentage={94}
          progressColor="bg-orange-500"
          warningMessage="There will be a charge for the excessive bandwidth over the limit."
          actionLabel="Upgrade"
          actionIcon={<Box className="h-4 w-4" />}
        />

        <MetricCard
          title="Storage"
          value="37 GB"
          limit="500 GB"
          percentage={7.4}
          progressColor="bg-emerald-500"
          status="It's all right."
          actionLabel="Upgrade"
          actionIcon={<Box className="h-4 w-4" />}
        />

        <MetricCard
          title="Cost"
          value="$73.42"
          limit="$150 Budget"
          percentage={48.95}
          progressColor="bg-emerald-500"
          status="It's all right."
          actionLabel="Change Budget"
          actionIcon={<Pencil className="h-4 w-4" />}
          onActionClick={() => setBudgetDialogOpen(true)}
        />
      </div>

      <BudgetDialog open={budgetDialogOpen} onOpenChange={setBudgetDialogOpen} />
    </>
  )
}
