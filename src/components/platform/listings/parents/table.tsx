"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { CircleCheck, CircleX, Mail, Users } from "lucide-react"

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
import { ParentCreateForm } from "@/components/platform/listings/parents/form"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteParent, getParents, getParentsCSV } from "./actions"
import { getParentColumns, type ParentRow } from "./columns"

interface ParentsTableProps {
  initialData: ParentRow[]
  total: number
  dictionary?: Dictionary["school"]["parents"]
  lang: Locale
  perPage?: number
}

function ParentsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: ParentsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations with fallbacks
  const t = {
    name: dictionary?.name || (lang === "ar" ? "الاسم" : "Name"),
    email: dictionary?.email || (lang === "ar" ? "البريد الإلكتروني" : "Email"),
    status: dictionary?.status || (lang === "ar" ? "الحالة" : "Status"),
    actions: lang === "ar" ? "إجراءات" : "Actions",
    view: lang === "ar" ? "عرض" : "View",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
    allParents:
      dictionary?.allParents ||
      (lang === "ar" ? "جميع أولياء الأمور" : "All Parents"),
    addNewParent:
      dictionary?.addNewParent ||
      (lang === "ar"
        ? "أضف ولي أمر جديد إلى مدرستك"
        : "Add a new parent to your school"),
    search:
      dictionary?.search ||
      (lang === "ar" ? "بحث في أولياء الأمور..." : "Search parents..."),
    create: dictionary?.create || (lang === "ar" ? "إنشاء" : "Create"),
    export: dictionary?.export || (lang === "ar" ? "تصدير" : "Export"),
    reset: dictionary?.reset || (lang === "ar" ? "إعادة تعيين" : "Reset"),
    active: dictionary?.active || (lang === "ar" ? "نشط" : "Active"),
    inactive: dictionary?.inactive || (lang === "ar" ? "غير نشط" : "Inactive"),
  }

  // View mode (table/grid)
  const { view, toggleView } = usePlatformView({ defaultView: "table" })

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
  } = usePlatformData<ParentRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getParents(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows as ParentRow[], total: result.data.total }
    },
    filters: searchValue ? { name: searchValue } : undefined,
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

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (parent: ParentRow) => {
      try {
        const deleteMsg =
          lang === "ar" ? `حذف ${parent.name}؟` : `Delete ${parent.name}?`
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(parent.id)

        const result = await deleteParent({ id: parent.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(
            lang === "ar" ? "فشل حذف ولي الأمر" : "Failed to delete parent"
          )
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : lang === "ar"
              ? "فشل الحذف"
              : "Failed to delete"
        )
      }
    },
    [optimisticRemove, refresh, lang]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getParentColumns(dictionary, lang, {
        onDelete: handleDelete,
      }),
    [dictionary, lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<ParentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: name, emailAddress, status
        createdAt: false,
      },
    },
  })

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  // Handle view
  const handleView = useCallback(
    (parent: ParentRow) => {
      if (!parent.userId) {
        ErrorToast(
          lang === "ar"
            ? "هذا الوالد ليس لديه حساب مستخدم"
            : "This parent does not have a user account"
        )
        return
      }
      router.push(`/profile/${parent.userId}`)
    },
    [router, lang]
  )

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getParentsCSV(filters)
      if (!result.success || !result.data) {
        throw new Error("error" in result ? result.error : "Export failed")
      }
      return result.data
    },
    []
  )

  // Get status badge
  const getStatusBadge = (status: string) => {
    return {
      label: status === "active" ? t.active : t.inactive,
      variant:
        status === "active" ? ("default" as const) : ("secondary" as const),
    }
  }

  // Toolbar translations
  const toolbarTranslations = {
    search: t.search,
    create: t.create,
    reset: t.reset,
    export: t.export,
    exportCSV: lang === "ar" ? "تصدير CSV" : "Export CSV",
    exporting: lang === "ar" ? "جاري التصدير..." : "Exporting...",
  }

  return (
    <>
      <PlatformToolbar
        table={view === "table" ? table : undefined}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={() => openModal()}
        getCSV={handleExportCSV}
        entityName="parents"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
        />
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allParents}
              description={t.addNewParent}
              icon={
                <Image
                  src="/anthropic/users.svg"
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((parent) => {
                const initials = parent.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                return (
                  <GridCard
                    key={parent.id}
                    avatar={{ fallback: initials }}
                    title={parent.name}
                    description={parent.emailAddress}
                    subtitle={
                      parent.status === "active" ? t.active : t.inactive
                    }
                    onClick={() => handleView(parent)}
                  />
                )
              })}
            </GridContainer>
          )}

          {/* Load more for grid view */}
          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="hover:bg-accent rounded-md border px-4 py-2 text-sm disabled:opacity-50"
              >
                {isLoading
                  ? lang === "ar"
                    ? "جاري التحميل..."
                    : "Loading..."
                  : lang === "ar"
                    ? "تحميل المزيد"
                    : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal content={<ParentCreateForm onSuccess={refresh} />} />
    </>
  )
}

export const ParentsTable = React.memo(ParentsTableInner)
