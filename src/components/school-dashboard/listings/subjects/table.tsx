"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { BookOpen } from "lucide-react"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { SubjectCreateForm } from "@/components/school-dashboard/listings/subjects/form"
import { SubjectCard } from "@/components/school-dashboard/listings/subjects/subject-card"
import {
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteSubject, getSubjects } from "./actions"
import {
  getLocalizedSubjectName,
  getSubjectColumns,
  type SubjectRow,
} from "./columns"

interface SubjectsTableProps {
  initialData: SubjectRow[]
  total: number
  dictionary?: Dictionary["school"]["subjects"]
  lang: Locale
  perPage?: number
}

// Export CSV function
async function getSubjectsCSV(
  filters?: Record<string, unknown>
): Promise<string> {
  const result = await getSubjects({ page: 1, perPage: 1000, ...filters })
  if (!result.success || !result.data) {
    return ""
  }
  const rows = result.data.rows
  const headers = [
    "ID",
    "Subject Name",
    "المادة",
    "Department",
    "القسم",
    "Created At",
  ]
  const csvRows = rows.map((row: SubjectRow) =>
    [
      row.id,
      `"${row.subjectName.replace(/"/g, '""')}"`,
      `"${(row.subjectNameAr || "").replace(/"/g, '""')}"`,
      `"${row.departmentName.replace(/"/g, '""')}"`,
      `"${(row.departmentNameAr || "").replace(/"/g, '""')}"`,
      row.createdAt,
    ].join(",")
  )

  return [headers.join(","), ...csvRows].join("\n")
}

function SubjectsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: SubjectsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const t = dictionary

  // Translations with fallbacks
  const translations = {
    allSubjects:
      t?.allSubjects || (lang === "ar" ? "جميع المواد" : "All Subjects"),
    addNewSubject:
      t?.addNewSubject ||
      (lang === "ar" ? "أضف مادة جديدة" : "Add a new subject to your school"),
    search:
      t?.search || (lang === "ar" ? "بحث في المواد..." : "Search subjects..."),
    create: t?.create || (lang === "ar" ? "إنشاء" : "Create"),
    export: t?.export || (lang === "ar" ? "تصدير" : "Export"),
    reset: t?.reset || (lang === "ar" ? "إعادة تعيين" : "Reset"),
    department: t?.department || (lang === "ar" ? "القسم" : "Department"),
    created: t?.created || (lang === "ar" ? "تاريخ الإنشاء" : "Created"),
    view: t?.view || (lang === "ar" ? "عرض" : "View"),
    edit: t?.edit || (lang === "ar" ? "تعديل" : "Edit"),
    delete: t?.delete || (lang === "ar" ? "حذف" : "Delete"),
    actions: t?.actions || (lang === "ar" ? "إجراءات" : "Actions"),
  }

  // View mode (table/grid) - default to grid for visual subject cards
  const { view, toggleView } = usePlatformView({ defaultView: "grid" })

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
  } = usePlatformData<SubjectRow, { subjectName?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getSubjects(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows, total: result.data.total }
    },
    filters: searchValue ? { subjectName: searchValue } : undefined,
  })

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (subject: SubjectRow) => {
      const displayName = getLocalizedSubjectName(subject, lang)
      try {
        const ok = await confirmDeleteDialog(
          `${translations.delete} ${displayName}?`
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(subject.id)

        const result = await deleteSubject({ id: subject.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast("Failed to delete subject")
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [optimisticRemove, refresh, lang, translations.delete]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getSubjectColumns(dictionary, lang, {
        onDelete: handleDelete,
      }),
    [dictionary, lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<SubjectRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: subjectName, departmentName
        subjectNameAr: false,
        departmentNameAr: false,
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

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      openModal(id)
    },
    [openModal]
  )

  // Handle view
  const handleView = useCallback(
    (id: string) => {
      router.push(`/subjects/${id}`)
    },
    [router]
  )

  // Toolbar translations
  const toolbarTranslations = {
    search: translations.search,
    create: translations.create,
    reset: translations.reset,
    export: translations.export,
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
        searchPlaceholder={translations.search}
        onCreate={() => openModal()}
        getCSV={getSubjectsCSV}
        entityName="subjects"
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
              title={translations.allSubjects}
              description={translations.addNewSubject}
              icon={<BookOpen className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={4}>
              {data.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  id={subject.id}
                  name={subject.subjectName}
                  nameAr={subject.subjectNameAr}
                  lang={lang}
                />
              ))}
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
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal content={<SubjectCreateForm onSuccess={refresh} />} />
    </>
  )
}

export const SubjectsTable = React.memo(SubjectsTableInner)
