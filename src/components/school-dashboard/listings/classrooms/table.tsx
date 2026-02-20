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

import { deleteClassroom, getClassrooms } from "./actions"
import { getClassroomColumns, type ClassroomRow } from "./columns"
import { ClassroomForm } from "./form"

interface ClassroomsTableProps {
  initialData: ClassroomRow[]
  total: number
  lang: Locale
  perPage?: number
}

function ClassroomsTableInner({
  initialData,
  total,
  lang,
  perPage = 20,
}: ClassroomsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState("")
  const isAr = lang === "ar"

  const { data, hasMore, isLoading, loadMore, refresh, optimisticRemove } =
    usePlatformData<ClassroomRow, { name?: string }>({
      initialData,
      total,
      perPage,
      fetcher: async (params) => {
        const result = await getClassrooms({
          page: params.page ?? 1,
          perPage: params.perPage ?? 20,
          name: params.name ?? "",
          typeId: "",
          building: "",
        })
        if (!result.success || !result.data) return { rows: [], total: 0 }
        return { rows: result.data as ClassroomRow[], total: result.total ?? 0 }
      },
      filters: searchValue ? { name: searchValue } : undefined,
    })

  const handleDelete = useCallback(
    async (row: ClassroomRow) => {
      const ok = await confirmDeleteDialog(
        `${isAr ? "حذف" : "Delete"} ${row.roomName}?`
      )
      if (!ok) return
      optimisticRemove(row.id)
      const result = await deleteClassroom({ id: row.id })
      if (result.success) {
        DeleteToast()
      } else {
        refresh()
        ErrorToast(result.error)
      }
    },
    [optimisticRemove, refresh, isAr]
  )

  const handleEdit = useCallback((id: string) => openModal(id), [openModal])

  const columns = useMemo(
    () =>
      getClassroomColumns(lang, { onEdit: handleEdit, onDelete: handleDelete }),
    [lang, handleEdit, handleDelete]
  )

  const { table } = useDataTable<ClassroomRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: { pageIndex: 0, pageSize: data.length || perPage },
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
      startTransition(() => router.refresh())
    },
    [router]
  )

  return (
    <>
      <PlatformToolbar
        table={table}
        view="table"
        onToggleView={() => {}}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={isAr ? "بحث في الغرف..." : "Search rooms..."}
        onCreate={() => openModal()}
        entityName="classrooms"
        translations={{
          search: isAr ? "بحث..." : "Search...",
          create: isAr ? "إنشاء" : "Create",
          reset: isAr ? "إعادة تعيين" : "Reset",
        }}
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading || isPending}
        onLoadMore={loadMore}
      />

      <Modal content={<ClassroomForm onSuccess={refresh} />} />
    </>
  )
}

export const ClassroomsTable = React.memo(ClassroomsTableInner)
