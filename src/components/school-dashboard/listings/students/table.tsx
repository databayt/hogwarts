"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import type { ArchiveScope } from "@/lib/archive-scope"
import { asset } from "@/lib/asset-url"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { cn } from "@/lib/utils"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import { Button } from "@/components/ui/button"
import { SeeMore } from "@/components/atom/see-more"
import { ErrorToast } from "@/components/atom/toast"
import { Icons } from "@/components/icons"
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

import { CredentialsDialog, openCredentialsDialog } from "../credentials"
import { AccessCodeDialog } from "./access-code-dialog"
import { openAccessCodeDialog } from "./access-code-store"
import { bulkSyncStudentGrades, getStudents, getStudentsCSV } from "./actions"
import { getStudentColumns, type StudentRow } from "./columns"
import { PurgeDialog } from "./purge-dialog"
import { createDraftStudent } from "./wizard/actions"

interface StudentsTableProps {
  initialData: StudentRow[]
  total: number
  dictionary?: Dictionary["school"]["students"]
  lang: Locale
  perPage?: number
  gradeOptions?: Array<{ label: string; value: string }>
  scope?: ArchiveScope
  permissions?: UIPermissions
}

function StudentsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  gradeOptions = [],
  scope = "active",
  permissions = FULL_UI_PERMISSIONS,
}: StudentsTableProps) {
  const router = useRouter()

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

  // Search state (debounced)
  const [searchValue, debouncedSearch, setSearchValue] = useDebouncedSearch(300)

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
      // Pass the route locale so search/load-more translate to the SAME language as
      // the initial server render (the NEXT_LOCALE cookie can disagree with the URL).
      const result = await getStudents({ ...params, lang })
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return {
        rows: result.data.rows as StudentRow[],
        total: result.data.total,
      }
    },
    filters: debouncedSearch ? { name: debouncedSearch } : undefined,
  })

  // Access-code ("Link Parent") dialog open-state lives in a module store
  // (./access-code-store), NOT useState — the generate Server Action remounts
  // this table on completion, which wiped a local flag and closed the dialog
  // the instant it opened. Same remount-survival fix the credentials dialog uses.
  const handleGenerateAccessCode = useCallback(
    (studentId: string, studentName: string) => {
      openAccessCodeDialog([studentId], { [studentId]: studentName })
    },
    []
  )

  // Credentials dialog state lives in a module-level store so it survives
  // the StudentsTable remount triggered by Next.js server-action revalidation
  // inside `getStudentCredentials`.
  const handleGenerateCredentials = useCallback(
    (studentId: string, studentName: string, badge?: string) => {
      openCredentialsDialog("student", studentId, studentName, badge)
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

  // Purge dialog state
  const [purgeOpen, setPurgeOpen] = useState(false)
  const [purgeStudentId, setPurgeStudentId] = useState<string | null>(null)
  const [purgeStudentName, setPurgeStudentName] = useState("")

  const handlePurge = useCallback((studentId: string, studentName: string) => {
    setPurgeStudentId(studentId)
    setPurgeStudentName(studentName)
    // Delay lets Radix DropdownMenu dismiss events fully settle before Dialog opens
    setTimeout(() => setPurgeOpen(true), 150)
  }, [])

  const handlePurgeSuccess = useCallback(
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
        onGenerateCredentials: handleGenerateCredentials,
        onPurge: handlePurge,
        gradeOptions,
        scope,
        permissions,
      }),
    [
      dictionary,
      lang,
      handleColumnDeleteSuccess,
      handleGenerateAccessCode,
      handleGenerateCredentials,
      handlePurge,
      gradeOptions,
      scope,
      permissions,
    ]
  )

  // Table instance
  const { table } = useDataTable<StudentRow>({
    data,
    columns,
    pageCount: 1,
    enableClientFiltering: true,
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
    },
    [setSearchValue]
  )

  // Archive/restore happen inside column cells; purge opens the dialog.
  // No top-level delete handler needed anymore.

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
            (dictionary as any)?.syncGradesFailed ||
            "Failed to sync grades"
        )
      }
    } catch {
      ErrorToast(
        (dictionary as any)?.syncGradesFailed || "Failed to sync grades"
      )
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
        throw new Error(
          "error" in result
            ? result.error
            : (dictionary as any)?.exportFailed || "Export failed"
        )
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
    tableView: dictionary?.tableView || "Table",
    gridView: dictionary?.gridView || "Grid",
    switchToTable: dictionary?.switchToTable || "Switch to table view",
    switchToGrid: dictionary?.switchToGrid || "Switch to grid view",
    searchColumns: dictionary?.searchColumns || "Search columns...",
    noColumns: dictionary?.noColumns || "No columns found.",
    all: dictionary?.all || "All",
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.search}
        onCreate={permissions.showAddButton ? handleCreate : undefined}
        getCSV={permissions.showExportButton ? handleExportCSV : undefined}
        entityName="students"
        translations={toolbarTranslations}
        additionalActions={
          permissions.showBulkActions && hasUnassigned ? (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={handleSyncGrades}
              disabled={isSyncing}
              aria-label={(dictionary as any)?.syncGrades || "Sync Grades"}
              title={(dictionary as any)?.syncGrades || "Sync Grades"}
            >
              <Icons.refresh
                className={cn("h-4 w-4", isSyncing && "animate-spin")}
              />
            </Button>
          ) : undefined
        }
      />

      {view === "table" ? (
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
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
                  src={asset("/icons/users.svg")}
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

      <AccessCodeDialog />

      <CredentialsDialog
        labels={dictionary?.credentials as Record<string, string> | undefined}
        onClosed={() => router.refresh()}
      />

      <PurgeDialog
        open={purgeOpen}
        onOpenChange={setPurgeOpen}
        studentId={purgeStudentId}
        studentName={purgeStudentName}
        dictionary={dictionary}
        onSuccess={handlePurgeSuccess}
      />
    </>
  )
}

export const StudentsTable = React.memo(StudentsTableInner)
