"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo } from "react"

import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { useModal } from "@/components/atom/modal/context"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { PlatformToolbar } from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteClassroom, getClassrooms } from "./actions"
import { getClassroomColumns, type ClassroomRow } from "./columns"
import { resolveClassroomError } from "./errors"
import { ClassroomForm } from "./form"
import { SyncClassroomsButton } from "./sync-classrooms-button"

interface ClassroomsTableProps {
  initialData: ClassroomRow[]
  total: number
  lang: Locale
  subdomain: string
  perPage?: number
  permissions?: UIPermissions
  types: { id: string; name: string }[]
  grades: { id: string; name: string }[]
}

function ClassroomsTableInner({
  initialData,
  total,
  lang,
  subdomain,
  perPage = 20,
  permissions = FULL_UI_PERMISSIONS,
  types,
  grades,
}: ClassroomsTableProps) {
  const { openModal, modal } = useModal()
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classrooms as Record<string, string> | undefined

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
          lang,
        })
        if (!result.success || !result.data) return { rows: [], total: 0 }
        return { rows: result.data as ClassroomRow[], total: result.total ?? 0 }
      },
      filters: debouncedSearch ? { name: debouncedSearch } : undefined,
    })

  const handleDelete = useCallback(
    async (row: ClassroomRow) => {
      const ok = await confirmDeleteDialog(
        `${d?.delete || "Delete"} ${row.roomName}?`
      )
      if (!ok) return
      optimisticRemove(row.id)
      const result = await deleteClassroom({ id: row.id })
      if (result.success) {
        DeleteToast()
      } else {
        refresh()
        ErrorToast(
          resolveClassroomError(
            result.error,
            (result as { details?: string }).details,
            (d?.errors as never) ?? undefined,
            d?.failedToDelete || "Failed to delete classroom"
          )
        )
      }
    },
    [optimisticRemove, refresh, d]
  )

  const handleEdit = useCallback((id: string) => openModal(id), [openModal])

  // Source the edit form's values from the rows already loaded in the table,
  // so the dialog opens fully populated without an on-open fetch.
  const editValues = useMemo(() => {
    if (!modal.id) return null
    const row = data.find((r) => r.id === modal.id)
    if (!row) return null
    return {
      roomName: row.roomName,
      typeId: row.typeId,
      capacity: row.capacity,
      gradeId: row.gradeId ?? undefined,
    }
  }, [modal.id, data])

  const columns = useMemo(
    () =>
      getClassroomColumns(
        lang,
        subdomain,
        { onEdit: handleEdit, onDelete: handleDelete, permissions },
        d
      ),
    [lang, subdomain, handleEdit, handleDelete, d, permissions]
  )

  const { table } = useDataTable<ClassroomRow>({
    data,
    columns,
    pageCount: 1,
    enableClientSorting: true,
    initialState: {
      sorting: [{ id: "gradeNumber", desc: false }],
      pagination: { pageIndex: 0, pageSize: data.length || perPage },
    },
  })

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
    },
    [setSearchValue]
  )

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={d?.search || "Search rooms..."}
        onCreate={permissions.showAddButton ? () => openModal() : undefined}
        entityName="classrooms"
        translations={{
          search: d?.search || "Search...",
          create: d?.create || "Create",
          reset: d?.reset || "Reset",
        }}
        additionalActions={
          permissions.showBulkActions ? <SyncClassroomsButton /> : undefined
        }
      />

      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={loadMore}
      />

      <ClassroomForm
        onSuccess={refresh}
        types={types}
        grades={grades}
        editValues={editValues}
      />
    </>
  )
}

export const ClassroomsTable = React.memo(ClassroomsTableInner)
