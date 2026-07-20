"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"

import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deletePeriod, getPeriods } from "./actions"
import { getPeriodColumns, type PeriodColumnCallbacks } from "./columns"
import { PeriodForm } from "./form"
import type { PeriodRow } from "./types"

interface PeriodTableProps {
  initialData: PeriodRow[]
  total: number
  lang: Locale
  perPage?: number
}

function PeriodTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: PeriodTableProps) {
  const { openModal } = useModal()

  // Translations
  const t = {
    search: lang === "ar" ? "بحث في الحصص..." : "Search periods...",
    create: lang === "ar" ? "إضافة حصة" : "Add Period",
    deletePeriod: lang === "ar" ? "حذف الحصة" : "Delete period",
    reset: lang === "ar" ? "إعادة تعيين" : "Reset",
  }

  // Search state (debounced)
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)

  // Data management with optimistic updates
  const { data, isLoading, hasMore, loadMore, refresh, optimisticRemove } =
    usePlatformData<PeriodRow, { name?: string }>({
      initialData,
      total,
      perPage,
      fetcher: async (params) => {
        const result = await getPeriods(params)
        if (!result.success || !result.data) {
          return { rows: [], total: 0 }
        }
        return { rows: result.data.rows, total: result.data.total }
      },
      filters: debouncedSearch ? { name: debouncedSearch } : undefined,
    })

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (periodItem: PeriodRow) => {
      try {
        const ok = await confirmDeleteDialog(
          `${t.deletePeriod} "${periodItem.name}"?`
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(periodItem.id)

        const result = await deletePeriod({ id: periodItem.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(result.error || "Operation failed")
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [optimisticRemove, refresh, t.deletePeriod]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getPeriodColumns(lang, {
        onDelete: handleDelete,
      } as PeriodColumnCallbacks),
    [lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<PeriodRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
    },
  })

  // Handle search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
    },
    [setSearchValue]
  )

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view="table"
        onToggleView={() => {}} // Table view only
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={() => openModal()}
        entityName="periods"
        translations={toolbarTranslations}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
      />

      <Modal content={<PeriodForm onSuccess={refresh} lang={lang} />} />
    </>
  )
}

export const PeriodTable = React.memo(PeriodTableInner)
