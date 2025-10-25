import type { Table } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface DataTableLoadMoreProps<TData> extends React.ComponentProps<"div"> {
  table: Table<TData>;
  hasMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function DataTableLoadMore<TData>({
  table,
  hasMore = false,
  isLoading = false,
  onLoadMore,
  className,
  ...props
}: DataTableLoadMoreProps<TData>) {
  const totalRows = table.getFilteredRowModel().rows.length;
  const selectedRows = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center gap-4 overflow-auto p-1",
        className,
      )}
      {...props}
    >
      {selectedRows > 0 && (
        <div className="whitespace-nowrap text-muted-foreground muted">
          {selectedRows} of {totalRows} row(s) selected.
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoading}
          className="text-sm text-foreground hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </button>
      )}
    </div>
  );
}
