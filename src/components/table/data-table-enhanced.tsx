"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExportButton, type ExportButtonProps } from "@/components/export"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { DataTableLoadMore } from "@/components/table/data-table-load-more"
import { DataTablePagination } from "@/components/table/data-table-pagination"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { getCommonPinningStyles } from "@/components/table/utils"
import { ViewToggle, type ViewMode } from "@/components/view-toggle"

export interface DataTableEnhancedProps<TData> {
  /** TanStack table instance */
  table: TanstackTable<TData>
  /** Toolbar configuration */
  toolbar?: {
    searchKey?: string
    searchPlaceholder?: string
    filters?: any[]
    showViewToggle?: boolean
    showExport?: boolean
    customActions?: React.ReactNode
  }
  /** Export configuration */
  exportConfig?: Omit<ExportButtonProps, "variant" | "size">
  /** View mode configuration */
  viewMode?: {
    enabled?: boolean
    defaultMode?: ViewMode
    storageKey?: string
    renderCard?: (item: TData) => React.ReactNode
  }
  /** Pagination configuration */
  paginationMode?: "pagination" | "load-more"
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  /** Auto-refresh configuration */
  autoRefresh?: {
    enabled?: boolean
    interval?: number
    onRefresh?: () => void | Promise<void>
  }
  /** Action bar for bulk operations */
  actionBar?: React.ReactNode
  /** Additional class names */
  className?: string
  /** Empty state message */
  emptyMessage?: string
}

function DataTableEnhancedInner<TData>({
  table,
  toolbar,
  exportConfig,
  viewMode,
  paginationMode = "pagination",
  hasMore = false,
  isLoading = false,
  onLoadMore,
  autoRefresh,
  actionBar,
  className,
  emptyMessage,
}: DataTableEnhancedProps<TData>) {
  const { dictionary } = useDictionary()
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(
    viewMode?.defaultMode || "list"
  )

  // Handle auto-refresh
  useEffect(() => {
    if (!autoRefresh?.enabled || !autoRefresh?.onRefresh) return

    const interval = setInterval(() => {
      autoRefresh.onRefresh?.()
    }, autoRefresh.interval || 30000) // Default 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setCurrentViewMode(mode)
  }, [])

  // Render grid view
  const renderGridView = () => {
    const data = table.getRowModel().rows

    if (!data.length) {
      return (
        <div className="flex h-32 items-center justify-center">
          <p className="text-muted-foreground">
            {emptyMessage || "No results found."}
          </p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.map((row) => {
          const item = row.original

          if (viewMode?.renderCard) {
            return <div key={row.id}>{viewMode.renderCard(item)}</div>
          }

          // Default card rendering
          return (
            <Card key={row.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="text-sm">
                      <span className="text-muted-foreground font-medium">
                        {cell.column.columnDef.header as string}:
                      </span>{" "}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Render list view
  const renderListView = () => (
    <div className="overflow-x-auto rounded-md">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{
                    ...getCommonPinningStyles({ column: header.column }),
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      ...getCommonPinningStyles({ column: cell.column }),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="h-24 text-center"
              >
                {emptyMessage || "No results found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {/* Toolbar */}
      {toolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DataTableToolbar table={table}>
            {/* Custom actions */}
            {toolbar.customActions}

            {/* Export button */}
            {toolbar.showExport && exportConfig && (
              <ExportButton {...exportConfig} variant="outline" size="sm" />
            )}

            {/* View toggle */}
            {toolbar.showViewToggle && viewMode?.enabled && (
              <ViewToggle
                value={currentViewMode}
                onChange={handleViewModeChange}
                storageKey={viewMode.storageKey}
                defaultValue={viewMode.defaultMode}
              />
            )}
          </DataTableToolbar>
        </div>
      )}

      {/* Content */}
      {viewMode?.enabled && currentViewMode === "grid"
        ? renderGridView()
        : renderListView()}

      {/* Pagination or Load More */}
      <div className="flex flex-col gap-2.5">
        {paginationMode === "pagination" ? (
          <DataTablePagination table={table} />
        ) : (
          <DataTableLoadMore
            table={table}
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={onLoadMore}
          />
        )}

        {/* Action bar for bulk operations */}
        {actionBar &&
          table.getFilteredSelectedRowModel().rows.length > 0 &&
          actionBar}
      </div>
    </div>
  )
}

export const DataTableEnhanced = React.memo(
  DataTableEnhancedInner
) as typeof DataTableEnhancedInner
