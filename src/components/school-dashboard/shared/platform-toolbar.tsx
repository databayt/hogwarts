"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import type { Column, Table } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import type { ViewMode } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Toolbar, ToolbarGroup } from "@/components/atom/toolbar"
import { Icons } from "@/components/icons"
import { useOptionalDictionary } from "@/components/internationalization/dictionary-context"
import { useLocale } from "@/components/internationalization/use-locale"
// Simple filter component for select/multiSelect
import { DataTableFacetedFilter } from "@/components/table/data-table-faceted-filter"
import { DataTableViewOptions } from "@/components/table/data-table-view-options"

import { ExportButton, type ExportFormat } from "./export-button"
import { ViewToggle } from "./view-toggle"

/**
 * Stable empty array for columns without static `meta.options`.
 *
 * WHY: `options={meta.options || []}` allocated a fresh `[]` on every render,
 * which changed the prop identity passed into the `React.memo`'d
 * `DataTableFacetedFilter` and defeated its memoization entirely.
 */
const EMPTY_OPTIONS: ReadonlyArray<{ label: string; value: string }> = []

export interface PlatformToolbarTranslations {
  search?: string
  create?: string
  reset?: string
  tableView?: string
  gridView?: string
  switchToTable?: string
  switchToGrid?: string
  export?: string
  exportCSV?: string
  exporting?: string
  view?: string
  searchColumns?: string
  noColumns?: string
  all?: string
  toggleColumns?: string
}

interface PlatformToolbarProps<TData> {
  /** TanStack table instance (for table view) */
  table?: Table<TData>
  /** Current view mode */
  view: ViewMode
  /** Toggle view callback */
  onToggleView: () => void
  /** Search value */
  searchValue?: string
  /** Search change handler */
  onSearchChange?: (value: string) => void
  /** Search placeholder */
  searchPlaceholder?: string
  /** Create button click handler */
  onCreate?: () => void
  /** Export function */
  getCSV?: (filters?: Record<string, unknown>) => Promise<string>
  /** Entity name for export filename */
  entityName?: string
  /** Available export formats */
  exportFormats?: ExportFormat[]
  /** Current filters for export */
  filters?: Record<string, unknown>
  /** Show column visibility toggle (table view only) */
  showColumnToggle?: boolean
  /** Hide the grid/table view toggle (for table-only surfaces) */
  showViewToggle?: boolean
  /** Additional actions to render */
  additionalActions?: React.ReactNode
  /**
   * i18n overrides. Any key omitted falls back to `school.common.*` from the
   * dictionary context, so call sites only pass what genuinely differs.
   */
  translations?: PlatformToolbarTranslations
  /** Additional class names */
  className?: string
}

const DEFAULT_EXPORT_FORMATS: ExportFormat[] = ["csv"]

/**
 * Resolves toolbar labels from, in priority order:
 *   1. the explicit `translations` prop (per-call-site override)
 *   2. `school.common.*` in the dictionary context (the shared source)
 *   3. an English literal (only reachable outside a DictionaryProvider —
 *      tests, Storybook, standalone previews)
 *
 * WHY a hook: previously every call site had to hand-assemble all 14 keys, so
 * most passed only a partial object and the rest silently rendered English to
 * Arabic users. Defaulting from the dictionary makes the localized path the
 * one you get for free.
 */
/**
 * Last-resort strings for when no DictionaryProvider is mounted (tests,
 * Storybook, standalone previews). Mirrors the shape used by
 * `use-table-translations.ts`, which covers the load-more/empty-state chrome —
 * this hook covers the toolbar chrome. The two sets of keys are disjoint.
 */
const FALLBACK: Record<"ar" | "en", Required<PlatformToolbarTranslations>> = {
  en: {
    search: "Search...",
    create: "Create",
    reset: "Reset",
    tableView: "Table View",
    gridView: "Grid View",
    switchToTable: "Switch to table view",
    switchToGrid: "Switch to grid view",
    export: "Export",
    exportCSV: "Export CSV",
    exporting: "Exporting...",
    view: "View",
    searchColumns: "Search columns...",
    noColumns: "No columns found.",
    all: "All",
    toggleColumns: "Toggle columns",
  },
  ar: {
    search: "بحث...",
    create: "إنشاء",
    reset: "إعادة تعيين",
    tableView: "عرض الجدول",
    gridView: "عرض الشبكة",
    switchToTable: "التبديل إلى عرض الجدول",
    switchToGrid: "التبديل إلى عرض الشبكة",
    export: "تصدير",
    exportCSV: "تصدير CSV",
    exporting: "جاري التصدير...",
    view: "عرض",
    searchColumns: "البحث في الأعمدة...",
    noColumns: "لم يتم العثور على أعمدة.",
    all: "الكل",
    toggleColumns: "تبديل الأعمدة",
  },
}

function useToolbarTranslations(
  overrides: PlatformToolbarTranslations | undefined
): Required<PlatformToolbarTranslations> {
  const { locale } = useLocale()
  const dictionary = useOptionalDictionary()
  const common = dictionary?.school?.common as
    | Record<string, string>
    | undefined

  // WHY PER-KEY DEPS (not the object identity): nearly every call site builds
  // `translations={{ ... }}` as a fresh literal each render. Depending on the
  // object would recompute — and hand fresh prop objects to the memoized
  // children — on every keystroke. Depending on the values keeps `t` stable.
  return React.useMemo(() => {
    const base = FALLBACK[locale === "ar" ? "ar" : "en"]
    const pick = (key: keyof PlatformToolbarTranslations): string =>
      overrides?.[key] || common?.[key] || base[key]

    return {
      search: pick("search"),
      create: pick("create"),
      reset: pick("reset"),
      tableView: pick("tableView"),
      gridView: pick("gridView"),
      switchToTable: pick("switchToTable"),
      switchToGrid: pick("switchToGrid"),
      export: pick("export"),
      exportCSV: pick("exportCSV"),
      exporting: pick("exporting"),
      view: pick("view"),
      searchColumns: pick("searchColumns"),
      noColumns: pick("noColumns"),
      all: pick("all"),
      toggleColumns: pick("toggleColumns"),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    locale,
    common,
    overrides?.search,
    overrides?.create,
    overrides?.reset,
    overrides?.tableView,
    overrides?.gridView,
    overrides?.switchToTable,
    overrides?.switchToGrid,
    overrides?.export,
    overrides?.exportCSV,
    overrides?.exporting,
    overrides?.view,
    overrides?.searchColumns,
    overrides?.noColumns,
    overrides?.all,
    overrides?.toggleColumns,
  ])
}

function PlatformToolbarInner<TData>({
  table,
  view,
  onToggleView,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
  onCreate,
  getCSV,
  entityName = "data",
  exportFormats = DEFAULT_EXPORT_FORMATS,
  filters,
  showColumnToggle = true,
  showViewToggle = true,
  additionalActions,
  translations,
  className,
}: PlatformToolbarProps<TData>) {
  const t = useToolbarTranslations(translations)

  // WHY memoized: this ran a .filter().map() plus a JSX allocation per column
  // on every render — i.e. on every keystroke, for tables with 15-30 columns.
  const filterableColumns = React.useMemo(
    () =>
      table
        ? table
            .getAllColumns()
            .filter((column) => column.getCanFilter())
            .filter((column) => {
              const meta = column.columnDef.meta
              return Boolean(meta?.variant) && meta?.variant !== "text"
            })
        : [],
    [table]
  )

  // WHY NOT useMemo: `table` is referentially stable and its filter state
  // mutates in place, so a `[searchValue, table]` dep list never invalidates on
  // a column-filter change — the Reset button stayed hidden forever. Same trap
  // as `allVisible` in DataTableViewOptions. This read is trivially cheap.
  const hasActiveFilters = Boolean(
    searchValue || (table && table.getState().columnFilters.length > 0)
  )

  const handleReset = React.useCallback(() => {
    onSearchChange?.("")
    if (table) {
      table.resetColumnFilters()
    }
  }, [onSearchChange, table])

  const handleSearchChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange?.(event.target.value)
    },
    [onSearchChange]
  )

  // Stable prop objects for the memoized children below. Without these, each
  // render handed them a fresh object and their React.memo never held.
  const viewOptionsTranslations = React.useMemo(
    () => ({
      view: t.view,
      searchColumns: t.searchColumns,
      noColumns: t.noColumns,
      all: t.all,
      toggleColumns: t.toggleColumns,
    }),
    [t.view, t.searchColumns, t.noColumns, t.all, t.toggleColumns]
  )

  const viewToggleTranslations = React.useMemo(
    () => ({
      tableView: t.tableView,
      gridView: t.gridView,
      switchToTable: t.switchToTable,
      switchToGrid: t.switchToGrid,
    }),
    [t.tableView, t.gridView, t.switchToTable, t.switchToGrid]
  )

  const exportTranslations = React.useMemo(
    () => ({
      export: t.export,
      exportCSV: t.exportCSV,
      exporting: t.exporting,
    }),
    [t.export, t.exportCSV, t.exporting]
  )

  return (
    <Toolbar className={cn("flex-wrap p-1", className)}>
      {/* Start: search and filters */}
      <ToolbarGroup>
        {onSearchChange && (
          <div className="relative">
            <Icons.search className="text-muted-foreground absolute start-2.5 top-2.5 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder || t.search}
              value={searchValue}
              onChange={handleSearchChange}
              className="h-9 w-40 ps-8 lg:w-56"
            />
          </div>
        )}

        {/* Column filters (available in both table and grid views) */}
        {filterableColumns.map((column) => (
          <PlatformToolbarFilter key={column.id} column={column} />
        ))}

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-dashed"
            onClick={handleReset}
          >
            <Icons.x className="me-1 h-4 w-4" />
            {t.reset}
          </Button>
        )}
      </ToolbarGroup>

      {/* End: actions */}
      <ToolbarGroup position="end">
        {view === "table" && table && showColumnToggle && (
          <DataTableViewOptions
            table={table}
            translations={viewOptionsTranslations}
          />
        )}

        {showViewToggle && (
          <ViewToggle
            view={view}
            onToggle={onToggleView}
            translations={viewToggleTranslations}
          />
        )}

        {getCSV && (
          <ExportButton
            getCSV={getCSV}
            filters={filters}
            entityName={entityName}
            formats={exportFormats}
            size="icon"
            translations={exportTranslations}
          />
        )}

        {additionalActions}

        {onCreate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={onCreate}
            aria-label={t.create}
            title={t.create}
          >
            <Icons.plus className="h-4 w-4" />
          </Button>
        )}
      </ToolbarGroup>
    </Toolbar>
  )
}

interface PlatformToolbarFilterProps<TData> {
  column: Column<TData>
}

function PlatformToolbarFilterInner<TData>({
  column,
}: PlatformToolbarFilterProps<TData>) {
  const meta = column.columnDef.meta

  return (
    <DataTableFacetedFilter
      column={column}
      title={meta?.label || column.id}
      options={(meta?.options ?? EMPTY_OPTIONS) as never}
      multiple={meta?.variant === "multiSelect"}
    />
  )
}

/**
 * DELIBERATELY NOT React.memo'd — see the note on PlatformToolbar below. This
 * wrapper receives a TanStack `Column`, which has the same stable-identity
 * hazard as `table`.
 */
const PlatformToolbarFilter = PlatformToolbarFilterInner

/**
 * DELIBERATELY NOT wrapped in React.memo.
 *
 * TanStack's `table` object is referentially STABLE and mutates in place, so a
 * shallow prop compare cannot see a state change. Now that `translations` and
 * `options` are identity-stable, memoizing here would make every prop compare
 * equal after a facet-filter change — and `hasActiveFilters` (which reads
 * `table.getState().columnFilters`) would silently render stale, leaving the
 * Reset button stuck. The same trap was found empirically on DataTable /
 * DataTableLoadMore, where the memo swallowed newly loaded rows.
 *
 * The per-keystroke win comes from the memoized `filterableColumns` and the
 * stable child prop objects below, not from memoizing this component.
 */
export const PlatformToolbar = PlatformToolbarInner
