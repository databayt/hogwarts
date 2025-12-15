/**
 * DataTableSeeMore Component
 * "See More" pagination controls to replace page flipping
 */

"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { paginationConfig } from "@/components/table/config"
import type { SeeMorePaginationState } from "@/components/table/types"

interface DataTableSeeMoreProps extends React.ComponentProps<"div"> {
  /**
   * Pagination state from useSeeMore hook
   */
  seeMoreState: SeeMorePaginationState
  /**
   * Handler for "See More" button click
   */
  onSeeMore: () => void
  /**
   * Loading state
   */
  isLoading?: boolean
  /**
   * Batch size options for the dropdown
   */
  batchSizeOptions?: readonly number[]
  /**
   * Handler for batch size change
   */
  onBatchSizeChange?: (batchSize: number) => void
  /**
   * Number of selected rows
   */
  selectedCount?: number
}

export function DataTableSeeMore({
  seeMoreState,
  onSeeMore,
  isLoading = false,
  batchSizeOptions = paginationConfig.batchSizeOptions,
  onBatchSizeChange,
  selectedCount = 0,
  className,
  ...props
}: DataTableSeeMoreProps) {
  const { loadedCount, batchSize, hasMore, total } = seeMoreState

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-between gap-4 overflow-auto p-1",
        className
      )}
      {...props}
    >
      {/* Summary row */}
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 sm:flex-row">
        {/* Selection count */}
        <div className="text-muted-foreground muted flex-1 whitespace-nowrap">
          {selectedCount > 0 ? (
            <>
              {selectedCount} of {loadedCount} row(s) selected
            </>
          ) : (
            <>
              Showing {loadedCount} of {total?.toLocaleString() ?? "..."}{" "}
              {total === 1 ? "row" : "rows"}
            </>
          )}
        </div>

        {/* Batch size selector */}
        {onBatchSizeChange && (
          <div className="flex items-center space-x-2">
            <p className="muted font-medium whitespace-nowrap">
              Load per batch
            </p>
            <Select
              value={`${batchSize}`}
              onValueChange={(value) => onBatchSizeChange(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-[4.5rem] [&[data-size]]:h-8">
                <SelectValue placeholder={batchSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {batchSizeOptions.map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* See More button */}
      {hasMore && (
        <Button
          variant="outline"
          size="lg"
          onClick={onSeeMore}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              See More ({Math.min(batchSize, total! - loadedCount)} more rows)
            </>
          )}
        </Button>
      )}

      {/* End of list message */}
      {!hasMore && total! > 0 && (
        <p className="text-muted-foreground muted">
          You've reached the end of the list
        </p>
      )}
    </div>
  )
}

/**
 * Simpler version without batch size selector
 */
export function DataTableSeeMoreSimple({
  seeMoreState,
  onSeeMore,
  isLoading = false,
  className,
  ...props
}: Omit<DataTableSeeMoreProps, "batchSizeOptions" | "onBatchSizeChange">) {
  const { loadedCount, batchSize, hasMore, total } = seeMoreState

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 p-4",
        className
      )}
      {...props}
    >
      {/* Summary */}
      <p className="text-muted-foreground muted">
        Showing {loadedCount} of {total?.toLocaleString() ?? "..."}{" "}
        {total === 1 ? "row" : "rows"}
      </p>

      {/* See More button */}
      {hasMore && (
        <Button
          variant="outline"
          size="lg"
          onClick={onSeeMore}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>See More ({Math.min(batchSize, total! - loadedCount)} more)</>
          )}
        </Button>
      )}

      {/* End of list message */}
      {!hasMore && total! > 0 && (
        <p className="text-muted-foreground text-sm">✓ All data loaded</p>
      )}
    </div>
  )
}
