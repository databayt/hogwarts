"use client"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface UsageResource {
  name: string
  used: number
  limit: number
  percentage?: number
  unit?: string
}

export interface DetailedUsageTableProps {
  className?: string
  title?: string
  description?: string
  resources: UsageResource[]
}

export function DetailedUsageTable({
  className,
  title = "Detailed Usage",
  description,
  resources,
}: DetailedUsageTableProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const getPercentageBar = (percentage: number) => {
    let bgColor = "bg-emerald-500"
    if (percentage >= 90) bgColor = "bg-destructive"
    else if (percentage >= 75) bgColor = "bg-orange-500"

    return (
      <div className="flex min-w-[120px] items-center gap-2">
        <div className="bg-secondary h-2 flex-1 rounded-full">
          <div
            className={cn("h-2 rounded-full transition-all", bgColor)}
            style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }}
          />
        </div>
        <span className="w-10 text-end text-xs font-medium tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableCaption className="sr-only">
            Detailed usage of resources
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] px-6">Resource</TableHead>
              <TableHead className="px-6 text-end">Used</TableHead>
              <TableHead className="px-6 text-end">Limit</TableHead>
              <TableHead className="min-w-[160px] px-6 text-end">
                Usage
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground h-24 text-center"
                >
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              resources.map((resource, index) => {
                const percentage =
                  resource.percentage ??
                  (resource.limit > 0
                    ? (resource.used / resource.limit) * 100
                    : 0)

                const unit = resource.unit ? ` ${resource.unit}` : ""

                return (
                  <TableRow key={resource.name || index}>
                    <TableCell className="px-6 font-medium">
                      {resource.name}
                    </TableCell>
                    <TableCell className="px-6 text-end tabular-nums">
                      {formatNumber(resource.used)}
                      {unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground px-6 text-end tabular-nums">
                      {formatNumber(resource.limit)}
                      {unit}
                    </TableCell>
                    <TableCell className="px-6 text-end">
                      {getPercentageBar(percentage)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
