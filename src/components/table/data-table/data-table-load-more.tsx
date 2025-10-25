import type { Table } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        "flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8",
        className,
      )}
      {...props}
    >
      <div className="flex-1 whitespace-nowrap text-muted-foreground muted">
        {selectedRows} of {totalRows} row(s) selected.
      </div>

      {hasMore && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Load More"
          )}
        </Button>
      )}
    </div>
  );
}
