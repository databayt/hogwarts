"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BookOpen, Users } from "lucide-react"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
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
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteClass, getClasses, getClassesCSV } from "./actions"
import {
  getClassColumns,
  getLocalizedClassName,
  getLocalizedSubjectName,
  type ClassRow,
} from "./columns"
import { createDraftClass } from "./wizard/actions"

interface ClassesTableProps {
  initialData: ClassRow[]
  total: number
  dictionary?: Dictionary["school"]["classes"]
  lang: Locale
  perPage?: number
}

function ClassesTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: ClassesTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Translations with fallbacks
  const t = {
    className: dictionary?.className || "Class Name",
    subject: dictionary?.subject || "Subject",
    teacher: dictionary?.teacher || "Teacher",
    term: dictionary?.term || "Term",
    enrolled: dictionary?.enrolled || "Enrolled",
    actions: dictionary?.actions || "Actions",
    editClass: dictionary?.editClass || "Edit Class",
    deleteClass: dictionary?.deleteClass || "Delete Class",
    viewClass: dictionary?.viewClass || "View Class",
    createClass: dictionary?.createClass || "Create Class",
    allClasses: dictionary?.allClasses || "All Classes",
    noClasses: dictionary?.noClasses || "No classes found",
    addNewClass: dictionary?.addNewClass || "Add a new class to your school",
    search: dictionary?.search || "Search classes...",
    create: dictionary?.create || "Create",
    export: dictionary?.export || "Export",
    reset: dictionary?.reset || "Reset",
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
  } = usePlatformData<ClassRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getClasses(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows as ClassRow[], total: result.data.total }
    },
    filters: searchValue ? { name: searchValue } : undefined,
  })

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (classItem: ClassRow) => {
      const displayName = getLocalizedClassName(classItem, lang)
      try {
        const ok = await confirmDeleteDialog(`${t.deleteClass} ${displayName}?`)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(classItem.id)

        const result = await deleteClass({ id: classItem.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(dictionary?.failedToDelete || "Failed to delete class")
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : dictionary?.failedToDelete || "Failed to delete"
        )
      }
    },
    [optimisticRemove, refresh, lang, t.deleteClass]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getClassColumns(dictionary, lang, {
        onDelete: handleDelete,
      }),
    [dictionary, lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<ClassRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: name, subjectName, teacherName, enrolledStudents
        termName: false,
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

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftClass()
    if (result.success && result.data) {
      router.push(`/${lang}/classes/add/${result.data.id}/information`)
    } else {
      ErrorToast(result.error || "Failed to create")
    }
  }, [router, lang])

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/${lang}/classes/add/${id}/information`)
    },
    [router, lang]
  )

  // Handle view
  const handleView = useCallback(
    (id: string) => {
      router.push(`/classrooms/${id}`)
    },
    [router]
  )

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getClassesCSV(filters)
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
    create: typeof t.create === "string" ? t.create : t.createClass,
    reset: t.reset,
    export: t.export,
    exportCSV: dictionary?.exportCSV || "Export CSV",
    exporting: dictionary?.exporting || "Exporting...",
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
        onCreate={handleCreate}
        getCSV={handleExportCSV}
        entityName="classes"
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
              title={t.allClasses}
              description={t.addNewClass}
              icon={
                <Image
                  src="/anthropic/book-open.svg"
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((classItem) => {
                const displayName = getLocalizedClassName(classItem, lang)
                const displaySubject = getLocalizedSubjectName(classItem, lang)

                return (
                  <GridCard
                    key={classItem.id}
                    icon="/anthropic/book-open.svg"
                    title={displayName}
                    description={displaySubject}
                    subtitle={`${classItem.enrolledStudents} ${dictionary?.studentCount || "students"}`}
                    onClick={() => handleView(classItem.id)}
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
                  ? dictionary?.loading || "Loading..."
                  : dictionary?.loadMore || "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export const ClassesTable = React.memo(ClassesTableInner)
