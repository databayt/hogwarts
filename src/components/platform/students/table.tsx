"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
import { StudentCreateForm } from "@/components/platform/students/form"
import {
  BulkActionsToolbar,
  createDeleteAction,
  createExportAction,
  createMessageAction,
} from "@/components/table/bulk-actions-toolbar"
import { DataTable } from "@/components/table/data-table"
import { getSelectColumn } from "@/components/table/select-column"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteStudent, getStudents, getStudentsCSV } from "./actions"
import { getStudentColumns, type StudentRow } from "./columns"

interface StudentsTableProps {
  initialData: StudentRow[]
  total: number
  dictionary?: Dictionary["school"]["students"]
  lang: Locale
  perPage?: number
}

function StudentsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: StudentsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations with fallbacks
  const t = {
    fullName: dictionary?.fullName || (lang === "ar" ? "الاسم" : "Name"),
    class: dictionary?.class || (lang === "ar" ? "الفصل" : "Class"),
    status: dictionary?.status || (lang === "ar" ? "الحالة" : "Status"),
    created:
      dictionary?.created || (lang === "ar" ? "تاريخ الإنشاء" : "Created"),
    actions: lang === "ar" ? "إجراءات" : "Actions",
    view: lang === "ar" ? "عرض" : "View",
    edit: lang === "ar" ? "تعديل" : "Edit",
    delete: lang === "ar" ? "حذف" : "Delete",
    allStudents:
      dictionary?.allStudents ||
      (lang === "ar" ? "جميع الطلاب" : "All Students"),
    addNewStudent:
      dictionary?.addNewStudent ||
      (lang === "ar"
        ? "أضف طالباً جديداً إلى مدرستك"
        : "Add a new student to your school"),
    active: dictionary?.active || (lang === "ar" ? "نشط" : "Active"),
    inactive: dictionary?.inactive || (lang === "ar" ? "غير نشط" : "Inactive"),
    search:
      dictionary?.search ||
      (lang === "ar" ? "بحث في الطلاب..." : "Search students..."),
    create: dictionary?.create || (lang === "ar" ? "إنشاء" : "Create"),
    export: dictionary?.export || (lang === "ar" ? "تصدير" : "Export"),
    reset: dictionary?.reset || (lang === "ar" ? "إعادة تعيين" : "Reset"),
    noAccount: lang === "ar" ? "لا يوجد حساب" : "No Account",
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
  } = usePlatformData<StudentRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getStudents(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return {
        rows: result.data.rows as StudentRow[],
        total: result.data.total,
      }
    },
    filters: searchValue ? { name: searchValue } : undefined,
  })

  // Callback for column delete success - triggers optimistic remove
  const handleColumnDeleteSuccess = useCallback(
    (id: string) => {
      optimisticRemove(id)
    },
    [optimisticRemove]
  )

  // Generate columns on the client side with dictionary, lang, and delete callback
  const columns = useMemo(
    () => [
      getSelectColumn<StudentRow>(),
      ...getStudentColumns(dictionary, lang, {
        onDeleteSuccess: handleColumnDeleteSuccess,
      }),
    ],
    [dictionary, lang, handleColumnDeleteSuccess]
  )

  // Table instance
  const { table } = useDataTable<StudentRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: name, className, status
        createdAt: false,
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

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (student: StudentRow) => {
      try {
        const deleteMsg =
          lang === "ar" ? `حذف ${student.name}؟` : `Delete ${student.name}?`
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(student.id)

        const result = await deleteStudent({ id: student.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(
            lang === "ar" ? "فشل حذف الطالب" : "Failed to delete student"
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

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  // Handle view
  const handleView = useCallback(
    (student: StudentRow) => {
      if (!student.userId) {
        ErrorToast(
          lang === "ar"
            ? "هذا الطالب ليس لديه حساب مستخدم"
            : "This student does not have a user account"
        )
        return
      }
      router.push(`/profile/${student.userId}`)
    },
    [router, lang]
  )

  // Bulk delete handler
  const handleBulkDelete = useCallback(
    async (rows: StudentRow[]) => {
      const deleteMsg =
        lang === "ar"
          ? `حذف ${rows.length} طالب؟`
          : `Delete ${rows.length} students?`
      const ok = await confirmDeleteDialog(deleteMsg)
      if (!ok) return

      // Optimistically remove all selected rows
      rows.forEach((row) => optimisticRemove(row.id))

      // Delete each student
      const results = await Promise.all(
        rows.map((row) => deleteStudent({ id: row.id }))
      )

      const failures = results.filter((r) => !r.success)
      if (failures.length === 0) {
        DeleteToast()
        table.toggleAllPageRowsSelected(false)
      } else {
        refresh()
        ErrorToast(
          lang === "ar"
            ? `فشل حذف ${failures.length} طالب`
            : `Failed to delete ${failures.length} students`
        )
      }
    },
    [lang, optimisticRemove, refresh, table]
  )

  // Bulk export handler
  const handleBulkExport = useCallback(
    async (rows: StudentRow[]) => {
      // Export selected rows as CSV
      const csv = rows
        .map((r) => `${r.name},${r.className},${r.status},${r.createdAt}`)
        .join("\n")
      const header =
        lang === "ar"
          ? "الاسم,الفصل,الحالة,تاريخ الإنشاء"
          : "Name,Class,Status,Created"
      const csvContent = `${header}\n${csv}`

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "selected-students.csv"
      link.click()
      table.toggleAllPageRowsSelected(false)
    },
    [lang, table]
  )

  // Bulk actions
  const bulkActions = useMemo(
    () => [
      createDeleteAction<StudentRow>(handleBulkDelete, lang),
      createExportAction<StudentRow>(handleBulkExport, lang),
    ],
    [handleBulkDelete, handleBulkExport, lang]
  )

  // Get status badge
  const getStatusBadge = (status: string) => {
    return status === "active"
      ? { label: t.active || "Active", variant: "default" as const }
      : { label: t.inactive || "Inactive", variant: "outline" as const }
  }

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getStudentsCSV(filters)
      if (!result.success || !result.data) {
        throw new Error("error" in result ? result.error : "Export failed")
      }
      return result.data
    },
    []
  )

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
        entityName="students"
        translations={toolbarTranslations}
      />

      {view === "table" ? (
        <>
          <DataTable
            table={table}
            paginationMode="load-more"
            hasMore={hasMore}
            isLoading={isLoading || isPending}
            onLoadMore={loadMore}
          />
          <BulkActionsToolbar table={table} actions={bulkActions} lang={lang} />
        </>
      ) : (
        <>
          {data.length === 0 ? (
            <GridEmptyState
              title={t.allStudents}
              description={t.addNewStudent}
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
              {data.map((student) => {
                const initials = student.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                return (
                  <GridCard
                    key={student.id}
                    avatar={{ fallback: initials }}
                    title={student.name}
                    description={
                      student.className !== "-" ? student.className : undefined
                    }
                    subtitle={
                      student.status === "active" ? t.active : t.inactive
                    }
                    onClick={() => handleView(student)}
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

      <Modal
        content={
          <StudentCreateForm dictionary={dictionary} onSuccess={refresh} />
        }
      />
    </>
  )
}

export const StudentsTable = React.memo(StudentsTableInner)
