"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

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

import { deleteYearLevel, getYearLevels } from "./actions"
import { getYearLevelColumns, type YearLevelColumnCallbacks } from "./columns"
import { YearLevelForm } from "./form"
import type { YearLevelRow } from "./types"

interface YearLevelTableProps {
  initialData: YearLevelRow[]
  total: number
  lang: Locale
  perPage?: number
}

function YearLevelTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: YearLevelTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations
  const t = {
    search:
      lang === "ar" ? "بحث في المراحل الدراسية..." : "Search year levels...",
    create: lang === "ar" ? "إضافة مرحلة" : "Add Level",
    deleteLevel: lang === "ar" ? "حذف المرحلة الدراسية" : "Delete year level",
    reset: lang === "ar" ? "إعادة تعيين" : "Reset",
  }

  // Search state
  const [searchValue, setSearchValue] = useState("")

  // Data management with optimistic updates
  const { data, isLoading, hasMore, loadMore, refresh, optimisticRemove } =
    usePlatformData<YearLevelRow, { levelName?: string }>({
      initialData,
      total,
      perPage,
      fetcher: async (params) => {
        const result = await getYearLevels(params)
        if (!result.success || !result.data) {
          return { rows: [], total: 0 }
        }
        return { rows: result.data.rows, total: result.data.total }
      },
      filters: searchValue ? { levelName: searchValue } : undefined,
    })

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (levelItem: YearLevelRow) => {
      const displayName =
        lang === "ar" && levelItem.levelNameAr
          ? levelItem.levelNameAr
          : levelItem.levelName
      try {
        const ok = await confirmDeleteDialog(
          `${t.deleteLevel} "${displayName}"?`
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(levelItem.id)

        const result = await deleteYearLevel({ id: levelItem.id })
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
    [optimisticRemove, refresh, t.deleteLevel, lang]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getYearLevelColumns(lang, {
        onDelete: handleDelete,
      } as YearLevelColumnCallbacks),
    [lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<YearLevelRow>({
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
        entityName="year-levels"
        translations={toolbarTranslations}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={loadMore}
      />

      <Modal content={<YearLevelForm onSuccess={refresh} lang={lang} />} />
    </>
  )
}

export const YearLevelTable = React.memo(YearLevelTableInner)
