"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { CardSize } from "./types"

interface TableColumn {
  /**
   * Column header label
   */
  header: string
  /**
   * Column accessor key
   */
  accessor: string
  /**
   * Column alignment
   */
  align?: "left" | "center" | "right"
  /**
   * Custom cell renderer
   */
  cell?: (value: any, row: any) => React.ReactNode
}

interface DataTableCardProps {
  /**
   * Card title
   */
  title?: string
  /**
   * Card description
   */
  description?: string
  /**
   * Table columns
   */
  columns: TableColumn[]
  /**
   * Table data rows
   */
  data: Record<string, any>[]
  /**
   * Maximum rows to display
   * @default 5
   */
  maxRows?: number
  /**
   * Card size variant
   * @default "md"
   */
  size?: CardSize
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Action button in header
   */
  action?: React.ReactNode
  /**
   * Empty state message
   */
  emptyMessage?: string
  /**
   * Row click handler
   */
  onRowClick?: (row: Record<string, any>) => void
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DataTableCard - Mini table preview card
 *
 * Perfect for displaying tabular data, reports, or data previews.
 * Shows a compact table with customizable columns and row click handling.
 *
 * @example
 * ```tsx
 * <DataTableCard
 *   title="Recent Enrollments"
 *   description="Last 5 student registrations"
 *   columns={[
 *     { header: "Student", accessor: "name" },
 *     { header: "Grade", accessor: "grade", align: "center" },
 *     { header: "Date", accessor: "date", align: "right" }
 *   ]}
 *   data={[
 *     { id: "1", name: "John Doe", grade: "10A", date: "2025-01-15" },
 *     { id: "2", name: "Jane Smith", grade: "9B", date: "2025-01-14" }
 *   ]}
 *   maxRows={5}
 *   onRowClick={(row) => router.push(`/students/${row.id}`)}
 *   action={<Button variant="ghost" size="sm">View All</Button>}
 * />
 * ```
 */
export function DataTableCard({
  title,
  description,
  columns,
  data,
  maxRows = 5,
  size = "md",
  loading = false,
  action,
  emptyMessage = "No data available",
  onRowClick,
  className,
}: DataTableCardProps) {
  const sizeClasses = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const alignClasses = {
    left: "text-start",
    center: "text-center",
    right: "text-end",
  }

  const displayedData = data.slice(0, maxRows)
  const isEmpty = !loading && data.length === 0

  return (
    <Card className={cn("transition-colors", className)}>
      {(title || description || action) && (
        <CardHeader className={cn(sizeClasses[size], "pb-3")}>
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              {loading ? (
                <>
                  {title && <Skeleton className="h-5 w-32" />}
                  {description && <Skeleton className="h-4 w-48" />}
                </>
              ) : (
                <>
                  {title && <CardTitle>{title}</CardTitle>}
                  {description && (
                    <CardDescription>{description}</CardDescription>
                  )}
                </>
              )}
            </div>
            {action && !loading && action}
          </div>
        </CardHeader>
      )}
      <CardContent
        className={cn(
          sizeClasses[size],
          (title || description || action) && "pt-0"
        )}
      >
        {loading ? (
          <div className="space-y-3">
            <div className="flex gap-4">
              {columns.map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {columns.map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="flex items-center justify-center py-8">
            <p className="muted text-center">{emptyMessage}</p>
          </div>
        ) : (
          <div className="border-border overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead
                      key={index}
                      className={cn(
                        "h-10 font-medium",
                        alignClasses[column.align || "left"]
                      )}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedData.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={cn(
                      onRowClick && "hover:bg-accent/50 cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell
                        key={colIndex}
                        className={cn(
                          "py-3",
                          alignClasses[column.align || "left"]
                        )}
                      >
                        {column.cell
                          ? column.cell(row[column.accessor], row)
                          : row[column.accessor]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
