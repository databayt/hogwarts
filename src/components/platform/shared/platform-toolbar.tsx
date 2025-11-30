"use client";

import * as React from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "@/components/table/data-table-view-options";
import { ViewToggle } from "./view-toggle";
import { ExportButton, type ExportFormat } from "./export-button";
import type { Table } from "@tanstack/react-table";
import type { ViewMode } from "@/hooks/use-platform-view";
import { cn } from "@/lib/utils";

interface PlatformToolbarProps<TData> {
  /** TanStack table instance (for table view) */
  table?: Table<TData>;
  /** Current view mode */
  view: ViewMode;
  /** Toggle view callback */
  onToggleView: () => void;
  /** Search value */
  searchValue?: string;
  /** Search change handler */
  onSearchChange?: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Create button click handler */
  onCreate?: () => void;
  /** Export function */
  getCSV?: (filters?: Record<string, unknown>) => Promise<string>;
  /** Entity name for export filename */
  entityName?: string;
  /** Available export formats */
  exportFormats?: ExportFormat[];
  /** Current filters for export */
  filters?: Record<string, unknown>;
  /** Show column visibility toggle (table view only) */
  showColumnToggle?: boolean;
  /** Additional actions to render */
  additionalActions?: React.ReactNode;
  /** i18n translations */
  translations?: {
    search?: string;
    create?: string;
    reset?: string;
    tableView?: string;
    gridView?: string;
    switchToTable?: string;
    switchToGrid?: string;
    export?: string;
    exportCSV?: string;
    exporting?: string;
  };
  /** Additional class names */
  className?: string;
}

export function PlatformToolbar<TData>({
  table,
  view,
  onToggleView,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
  onCreate,
  getCSV,
  entityName = "data",
  exportFormats = ["csv"],
  filters,
  showColumnToggle = true,
  additionalActions,
  translations = {},
  className,
}: PlatformToolbarProps<TData>) {
  const t = {
    search: translations.search || "Search...",
    create: translations.create || "Create",
    reset: translations.reset || "Reset",
    tableView: translations.tableView || "Table View",
    gridView: translations.gridView || "Grid View",
    switchToTable: translations.switchToTable || "Switch to table view",
    switchToGrid: translations.switchToGrid || "Switch to grid view",
    export: translations.export || "Export",
    exportCSV: translations.exportCSV || "Export CSV",
    exporting: translations.exporting || "Exporting...",
  };

  // Check if there are active filters (from table state or search)
  const hasActiveFilters = React.useMemo(() => {
    if (searchValue) return true;
    if (table) {
      return table.getState().columnFilters.length > 0;
    }
    return false;
  }, [searchValue, table]);

  const handleReset = React.useCallback(() => {
    onSearchChange?.("");
    if (table) {
      table.resetColumnFilters();
    }
  }, [onSearchChange, table]);

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2 p-1",
        className
      )}
    >
      {/* Left side: Search and filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search input */}
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || t.search}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-40 pl-8 lg:w-56"
            />
          </div>
        )}

        {/* Table column filters (only in table view) */}
        {view === "table" && table && (
          <>
            {table
              .getAllColumns()
              .filter((column) => column.getCanFilter())
              .map((column) => {
                const meta = column.columnDef.meta;
                if (!meta?.variant || meta.variant === "text") return null;

                // Render select/multiSelect filters
                return (
                  <DataTableFilter
                    key={column.id}
                    column={column}
                    title={meta.label || column.id}
                    options={meta.options || []}
                    multiple={meta.variant === "multiSelect"}
                  />
                );
              })}
          </>
        )}

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-dashed"
            onClick={handleReset}
          >
            <X className="h-4 w-4 mr-1" />
            {t.reset}
          </Button>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Column visibility (table view only) */}
        {view === "table" && table && showColumnToggle && (
          <DataTableViewOptions table={table} />
        )}

        {/* View toggle */}
        <ViewToggle
          view={view}
          onToggle={onToggleView}
          translations={{
            tableView: t.tableView,
            gridView: t.gridView,
            switchToTable: t.switchToTable,
            switchToGrid: t.switchToGrid,
          }}
        />

        {/* Export button */}
        {getCSV && (
          <ExportButton
            getCSV={getCSV}
            filters={filters}
            entityName={entityName}
            formats={exportFormats}
            size="icon"
            translations={{
              export: t.export,
              exportCSV: t.exportCSV,
              exporting: t.exporting,
            }}
          />
        )}

        {/* Additional actions */}
        {additionalActions}

        {/* Create button */}
        {onCreate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onCreate}
            aria-label={t.create}
            title={t.create}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Simple filter component for select/multiSelect
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter";
import type { Column } from "@tanstack/react-table";

interface DataTableFilterProps<TData> {
  column: Column<TData>;
  title: string;
  options: Array<{ label: string; value: string }>;
  multiple?: boolean;
}

function DataTableFilter<TData>({
  column,
  title,
  options,
  multiple = false,
}: DataTableFilterProps<TData>) {
  return (
    <DataTableFacetedFilter
      column={column}
      title={title}
      options={options as any}
      multiple={multiple}
    />
  );
}
