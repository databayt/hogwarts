"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useDeferredValue, useMemo, useState } from "react"
import Image from "next/image"

import { asset } from "@/lib/asset-url"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Badge } from "@/components/ui/badge"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteLiveClass, getLiveClasses } from "./actions"
import type { LiveClassRow } from "./columns"
import { getLiveClassColumns } from "./columns"
import { LiveClassForm } from "./form"

interface LiveClassesTableProps {
  initialData: LiveClassRow[]
  total: number
  dictionary: Dictionary["school"]["liveClasses"]
  lang: Locale
  perPage?: number
  permissions?: UIPermissions
}

function LiveClassesTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  permissions = FULL_UI_PERMISSIONS,
}: LiveClassesTableProps) {
  const t = dictionary
  const { openModal } = useModal()

  const { view, toggleView } = usePlatformView({ defaultView: "table" })
  const [searchInput, setSearchInput] = useState("")
  const deferredSearch = useDeferredValue(searchInput)

  const filters = useMemo(() => {
    const f: Record<string, unknown> = {}
    if (deferredSearch) f.title = deferredSearch
    return f
  }, [deferredSearch])

  const { data, isLoading, hasMore, loadMore, refresh, optimisticRemove } =
    usePlatformData<LiveClassRow, Record<string, unknown>>({
      initialData,
      total,
      perPage,
      fetcher: async (params) => {
        const result = await getLiveClasses({
          ...params,
          title: deferredSearch || undefined,
        })
        if (result.success && result.data) {
          return {
            rows: result.data.rows as LiveClassRow[],
            total: result.data.total,
          }
        }
        return { rows: [], total: 0 }
      },
      filters,
    })

  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  const handleDelete = useCallback(
    async (liveClass: LiveClassRow) => {
      try {
        const ok = await confirmDeleteDialog(
          t.confirmDelete.replace("{title}", liveClass.title || "")
        )
        if (!ok) return

        optimisticRemove(liveClass.id)

        const result = await deleteLiveClass({ id: liveClass.id })
        if (result.success) {
          DeleteToast(t.toasts.deleted)
        } else {
          refresh()
          ErrorToast(t.toasts.deleteFailed)
        }
      } catch {
        refresh()
        ErrorToast(t.toasts.deleteFailed)
      }
    },
    [t, optimisticRemove, refresh]
  )

  const columns = useMemo(
    () =>
      getLiveClassColumns(t, lang, {
        onEdit: handleEdit,
        onDelete: handleDelete,
        permissions,
      }),
    [t, lang, handleEdit, handleDelete, permissions]
  )

  const { table } = useDataTable<LiveClassRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
    },
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
  }, [])

  const getStatusBadge = (status: string) => {
    const label = t.status[status as keyof typeof t.status] || status
    const variant =
      status === "live"
        ? "default"
        : status === "failed"
          ? "destructive"
          : status === "scheduled"
            ? "outline"
            : "secondary"
    return {
      label,
      variant: variant as
        | "default"
        | "outline"
        | "secondary"
        | "destructive",
    }
  }

  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.cancel,
    tableView: t.tableView,
    gridView: t.gridView,
    export: t.export,
    view: t.view,
    searchColumns: t.searchColumns,
    noColumns: t.noColumns,
    all: t.all,
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchInput}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={permissions.showAddButton ? () => openModal() : undefined}
        entityName="live-classes"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.emptyTitle}
              description={t.emptyDescription}
              icon={
                <Image
                  src={asset("/icons/video.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((liveClass) => {
                const statusBadge = getStatusBadge(liveClass.status)
                return (
                  <div
                    key={liveClass.id}
                    className="bg-background hover:border-primary cursor-pointer rounded-lg border p-4 transition-[border-color] duration-200"
                    onClick={() => handleEdit(liveClass.id)}
                  >
                    <div className="space-y-3">
                      <h4 className="text-foreground line-clamp-2 font-medium">
                        {liveClass.title}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                        {liveClass.subjectName && (
                          <Badge variant="outline">
                            {liveClass.subjectName}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {new Date(
                          liveClass.scheduledStart
                        ).toLocaleDateString(
                          lang === "ar" ? "ar-SA" : "en-US"
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </GridContainer>
          )}

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        hideClose
        content={
          <LiveClassForm onSuccess={refresh} lang={lang} dictionary={t} />
        }
      />
    </>
  )
}

export const LiveClassesTable = React.memo(LiveClassesTableInner)
