"use client"

import { useMemo, useState, useCallback, useTransition } from "react"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"
import { getTermColumns, type TermColumnCallbacks } from "./columns"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import { TermForm } from "./form"
import { getTerms, deleteTerm, setActiveTerm } from "./actions"
import { usePlatformData } from "@/hooks/use-platform-data"
import { PlatformToolbar } from "@/components/platform/shared"
import { useRouter } from "next/navigation"
import { DeleteToast, SuccessToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { TermRow } from "./types"

interface TermTableProps {
  initialData: TermRow[]
  total: number
  lang: Locale
  perPage?: number
}

export function TermTable({
  initialData,
  total,
  lang,
  perPage = 20,
}: TermTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations
  const t = {
    search: lang === "ar" ? "بحث في الفصول الدراسية..." : "Search terms...",
    create: lang === "ar" ? "إضافة فصل" : "Add Term",
    deleteTerm: lang === "ar" ? "حذف الفصل الدراسي" : "Delete term",
    setActiveSuccess: lang === "ar" ? "تم تعيين الفصل كنشط" : "Term set as active",
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
  } = usePlatformData<TermRow, { yearId?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getTerms(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows, total: result.data.total }
    },
    filters: searchValue ? { yearId: searchValue } : undefined,
  })

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (termItem: TermRow) => {
      const termName = lang === "ar" ? `الفصل ${termItem.termNumber}` : `Term ${termItem.termNumber}`
      try {
        const ok = await confirmDeleteDialog(
          `${t.deleteTerm} "${termName}" (${termItem.yearName})?`
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(termItem.id)

        const result = await deleteTerm({ id: termItem.id })
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
    [optimisticRemove, refresh, t.deleteTerm, lang]
  )

  // Handle set active
  const handleSetActive = useCallback(
    async (termItem: TermRow) => {
      startTransition(async () => {
        const result = await setActiveTerm({ id: termItem.id })
        if (result.success) {
          SuccessToast(t.setActiveSuccess)
          refresh()
        } else {
          ErrorToast(result.error)
        }
      })
    },
    [refresh, t.setActiveSuccess]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getTermColumns(lang, {
        onDelete: handleDelete,
        onSetActive: handleSetActive,
      } as TermColumnCallbacks),
    [lang, handleDelete, handleSetActive]
  )

  // Table instance
  const { table } = useDataTable<TermRow>({
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
        entityName="terms"
        translations={toolbarTranslations}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={loadMore}
      />

      <Modal content={<TermForm onSuccess={refresh} lang={lang} />} />
    </>
  )
}
