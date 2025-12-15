"use client"

import { useMemo, useState, useCallback, useTransition } from "react"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"
import { getScoreRangeColumns, type ScoreRangeColumnCallbacks } from "./columns"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import { ScoreRangeForm } from "./form"
import { getScoreRanges, deleteScoreRange } from "./actions"
import { usePlatformData } from "@/hooks/use-platform-data"
import { PlatformToolbar } from "@/components/platform/shared"
import { useRouter } from "next/navigation"
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { ScoreRangeRow } from "./types"

interface ScoreRangeTableProps {
  initialData: ScoreRangeRow[]
  total: number
  lang: Locale
  perPage?: number
}

export function ScoreRangeTable({
  initialData,
  total,
  lang,
  perPage = 20,
}: ScoreRangeTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations
  const t = {
    search: lang === "ar" ? "بحث في نطاقات الدرجات..." : "Search grade ranges...",
    create: lang === "ar" ? "إضافة نطاق" : "Add Range",
    deleteRange: lang === "ar" ? "حذف نطاق الدرجات" : "Delete grade range",
    reset: lang === "ar" ? "إعادة تعيين" : "Reset",
  }

  // Search state
  const [searchValue, setSearchValue] = useState("")

  // Data management with optimistic updates
  const {
    data,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<ScoreRangeRow, { grade?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getScoreRanges(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows, total: result.data.total }
    },
    filters: searchValue ? { grade: searchValue } : undefined,
  })

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (rangeItem: ScoreRangeRow) => {
      try {
        const ok = await confirmDeleteDialog(
          `${t.deleteRange} "${rangeItem.grade}" (${rangeItem.minScore}-${rangeItem.maxScore}%)?`
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(rangeItem.id)

        const result = await deleteScoreRange({ id: rangeItem.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(result.error)
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [optimisticRemove, refresh, t.deleteRange]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getScoreRangeColumns(lang, {
        onDelete: handleDelete,
      } as ScoreRangeColumnCallbacks),
    [lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<ScoreRangeRow>({
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
      startTransition(() => {
        router.refresh()
      })
    },
    [router]
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
        entityName="score-ranges"
        translations={toolbarTranslations}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={loadMore}
      />

      <Modal content={<ScoreRangeForm onSuccess={refresh} lang={lang} />} />
    </>
  )
}
