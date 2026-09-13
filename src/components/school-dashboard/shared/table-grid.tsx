"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import { flexRender, type Row, type Table } from "@tanstack/react-table"

import { useTableTranslations } from "@/components/table/use-table-translations"

import { ItemGrid, ItemGridMore } from "./item-card"

/**
 * A DataTable's rows as a grid of `ItemCard`s — the grid half of a listing
 * that sits in `ListingViews`.
 *
 * It reads the rows from the table instance rather than the raw data, so a
 * status filter set in the toolbar narrows the cards exactly as it narrows the
 * rows. Empty and load-more copy come from the same place the table's own
 * footer reads them, so the two views never word the same state differently.
 */
export function TableGrid<TData>({
  table,
  hasMore,
  isLoading,
  onLoadMore,
  children,
}: {
  table: Table<TData>
  hasMore?: boolean
  isLoading?: boolean
  onLoadMore?: () => void
  /** One `ItemCard` per row; give it `key={row.id}`. */
  children: (row: Row<TData>) => ReactNode
}) {
  const t = useTableTranslations()
  const rows = table.getRowModel().rows

  return (
    <>
      {rows.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          {t.noResults}
        </p>
      ) : (
        <ItemGrid className="mt-2">{rows.map((row) => children(row))}</ItemGrid>
      )}
      {hasMore && onLoadMore ? (
        <ItemGridMore
          onClick={onLoadMore}
          loading={isLoading}
          label={t.loadMore}
          loadingLabel={t.loading}
        />
      ) : null}
    </>
  )
}

/**
 * A row's own actions cell, drawn on its card.
 *
 * Rendering the column's cell — instead of rebuilding the menu for the card —
 * keeps the two views from drifting: an item added to the row menu, or one a
 * permission hides, shows up (or doesn't) on the card the same way.
 */
export function RowActions<TData>({
  row,
  columnId = "actions",
}: {
  row: Row<TData>
  columnId?: string
}) {
  const cell = row.getAllCells().find((c) => c.column.id === columnId)
  if (!cell) return null
  return <>{flexRender(cell.column.columnDef.cell, cell.getContext())}</>
}
