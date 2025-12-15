"use client"

import { useMemo, useState, useCallback, useTransition } from "react"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"
import { getSchoolYearColumns, type SchoolYearColumnCallbacks } from "./columns"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import { SchoolYearForm } from "./form"
import { getSchoolYears, deleteSchoolYear } from "./actions"
import { usePlatformData } from "@/hooks/use-platform-data"
import { PlatformToolbar } from "@/components/platform/shared"
import { useRouter } from "next/navigation"
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { SchoolYearRow } from "./types"

interface SchoolYearTableProps {
  initialData: SchoolYearRow[]
  total: number
  lang: Locale
  perPage?: number
}

export function SchoolYearTable({
  initialData,
  total,
  lang,
  perPage = 20,
}: SchoolYearTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations
  const t = {
    search: lang === "ar" ? "بحث في الأعوام الدراسية..." : "Search academic years...",
    create: lang === "ar" ? "إضافة عام دراسي" : "Add Year",
    deleteYear: lang === "ar" ? "حذف العام الدراسي" : "Delete academic year",
    noYears: lang === "ar" ? "لا توجد أعوام دراسية" : "No academic years found",
    reset: lang === "ar" ? "إعادة تعيين" : "Reset",
  }

  // Search state
  const [searchValue, setSearchValue] = useState("")

  // Data management with optimistic updates
  const {
    data,
    total: dataTotal,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    optimisticRemove,
  } = usePlatformData<SchoolYearRow, { yearName?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getSchoolYears(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows, total: result.data.total }
    },
    filters: searchValue ? { yearName: searchValue } : undefined,
  })

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (yearItem: SchoolYearRow) => {
      try {
        const ok = await confirmDeleteDialog(
          `${t.deleteYear} "${yearItem.yearName}"?`
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(yearItem.id)

        const result = await deleteSchoolYear({ id: yearItem.id })
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
    [optimisticRemove, refresh, t.deleteYear]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getSchoolYearColumns(lang, {
        onDelete: handleDelete,
      } as SchoolYearColumnCallbacks),
    [lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<SchoolYearRow>({
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
        entityName="school-years"
        translations={toolbarTranslations}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={loadMore}
      />

      <Modal content={<SchoolYearForm onSuccess={refresh} lang={lang} />} />
    </>
  )
}
