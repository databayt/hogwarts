"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import { SeeMore } from "@/components/atom/see-more"
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

import { AccessCodeDialog } from "./access-code-dialog"
import {
  bulkSyncStudentGrades,
  deleteStudent,
  getStudents,
  getStudentsCSV,
} from "./actions"
import { getStudentColumns, type StudentRow } from "./columns"
import { createDraftStudent } from "./wizard/actions"

interface StudentsTableProps {
  initialData: StudentRow[]
  total: number
  dictionary?: Dictionary["school"]["students"]
  lang: Locale
  perPage?: number
  gradeOptions?: Array<{ label: string; value: string }>
}

function StudentsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  gradeOptions = [],
}: StudentsTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Translations with fallbacks
  const t = {
    fullName: dictionary?.fullName || "Name",
    section: dictionary?.section || "Section",
    status: dictionary?.status || "Status",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
    allStudents: dictionary?.allStudents || "All Students",
    addNewStudent:
      dictionary?.addNewStudent || "Add a new student to your school",
    active: dictionary?.active || "Active",
    inactive: dictionary?.inactive || "Inactive",
    search: dictionary?.searchPlaceholder || "Search students...",
    create: dictionary?.create || "Create",
    export: dictionary?.export || "Export",
    reset: dictionary?.reset || "Reset",
    noAccount: dictionary?.noAccount || "No Account",
    cancel: (dictionary as any)?.cancel || "Cancel",
    deleteItem: (dictionary as any)?.deleteItem || "Delete item",
    cannotBeUndone:
      (dictionary as any)?.cannotBeUndone || "This action cannot be undone.",
    loadMore: dictionary?.loadMore || "Load More",
    loading: dictionary?.loading || "Loading...",
    noResults: (dictionary as any)?.noResults || "No results.",
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

  // Access code dialog state
  const [accessCodeOpen, setAccessCodeOpen] = useState(false)
  const [accessCodeStudentIds, setAccessCodeStudentIds] = useState<string[]>([])
  const [accessCodeStudentNames, setAccessCodeStudentNames] = useState<
    Record<string, string>
  >({})

  const handleGenerateAccessCode = useCallback(
    (studentId: string, studentName: string) => {
      setAccessCodeStudentIds([studentId])
      setAccessCodeStudentNames({ [studentId]: studentName })
      setAccessCodeOpen(true)
    },
    []
  )

  // Callback for column delete success - triggers optimistic remove
  const handleColumnDeleteSuccess = useCallback(
    (id: string) => {
      optimisticRemove(id)
    },
    [optimisticRemove]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getStudentColumns(dictionary, lang, {
        onDeleteSuccess: handleColumnDeleteSuccess,
        onGenerateAccessCode: handleGenerateAccessCode,
        gradeOptions,
      }),
    [
      dictionary,
      lang,
      handleColumnDeleteSuccess,
      handleGenerateAccessCode,
      gradeOptions,
    ]
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
        studentId: false,
        createdAt: false,
        email: false,
        dateOfBirth: false,
        enrollmentDate: false,
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
        const ok = await confirmDeleteDialog(undefined, {
          title: `${t.delete} ${student.name}?`,
          description: t.cannotBeUndone,
          confirmText: t.delete,
          cancelText: t.cancel,
        })
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
            dictionary?.failedToDeleteStudent || "Failed to delete student"
          )
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : dictionary?.failedToDeleteStudent || "Failed to delete"
        )
      }
    },
    [optimisticRemove, refresh, lang]
  )

  // Sync grades for students with yearLevel but no academicGradeId
  const [isSyncing, setIsSyncing] = useState(false)
  const hasUnassigned = data.some((s) => s.status === "unassigned")

  const handleSyncGrades = useCallback(async () => {
    setIsSyncing(true)
    try {
      const result = await bulkSyncStudentGrades()
      if (result.success && result.data) {
        const count = result.data.updated
        if (count > 0) {
          refresh()
        }
      } else {
        ErrorToast(
          ("error" in result ? result.error : undefined) ||
            "Failed to sync grades"
        )
      }
    } catch {
      ErrorToast("Failed to sync grades")
    } finally {
      setIsSyncing(false)
    }
  }, [refresh])

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftStudent()
    if (result.success && result.data) {
      router.push(`/${lang}/students/add/${result.data.id}/attachments`)
    } else {
      ErrorToast(
        result.error ||
          (dictionary as Record<string, string> | undefined)?.failedToCreate ||
          "Failed to create"
      )
    }
  }, [router, lang])

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/${lang}/students/add/${id}/attachments`)
    },
    [router, lang]
  )

  // Handle view
  const handleView = useCallback(
    (student: StudentRow) => {
      router.push(`/${lang}/profile/${student.userId || student.id}`)
    },
    [router, lang]
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
    exportCSV: dictionary?.exportCSV || "Export CSV",
    exporting: dictionary?.exporting || "Exporting...",
    view: t.view,
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
        entityName="students"
        translations={toolbarTranslations}
        additionalActions={
          hasUnassigned ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncGrades}
              disabled={isSyncing}
            >
              {isSyncing ? "Syncing..." : "Sync Grades"}
            </Button>
          ) : undefined
        }
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading || isPending}
          onLoadMore={loadMore}
          translations={{
            loadMore: t.loadMore,
            loading: t.loading,
            noResults: t.noResults,
          }}
        />
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
                    description={student.classroom || undefined}
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
          <SeeMore
            hasMore={hasMore}
            isLoading={isLoading}
            onClick={loadMore}
            label={dictionary?.loadMore || "Load More"}
            className="mt-4"
          />
        </>
      )}

      <AccessCodeDialog
        open={accessCodeOpen}
        onOpenChange={setAccessCodeOpen}
        studentIds={accessCodeStudentIds}
        studentNames={accessCodeStudentNames}
      />
    </>
  )
}

export const StudentsTable = React.memo(StudentsTableInner)
