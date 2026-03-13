"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { usePlatformData } from "@/hooks/use-platform-data"
import { usePlatformView } from "@/hooks/use-platform-view"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
  SuccessToast,
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

import {
  deleteTeacher,
  getTeachers,
  getTeachersCSV,
  updateTeacher,
} from "./actions"
import { getTeacherColumns, type TeacherRow } from "./columns"
import { createDraftTeacher } from "./wizard/actions"

interface TeachersTableProps {
  initialData: TeacherRow[]
  total: number
  dictionary?: Dictionary["school"]["teachers"]
  lang: Locale
  perPage?: number
}

function TeachersTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: TeachersTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Translations with fallbacks
  const t = {
    fullName: dictionary?.fullName || "Name",
    email: dictionary?.email || "Email",
    phone: dictionary?.phone || "Phone",
    department: dictionary?.department || "Department",
    subjects: dictionary?.subjects || "Subjects",
    classes: dictionary?.classes || "Classes",
    status: dictionary?.status || "Status",
    created: dictionary?.created || "Created",
    actions: dictionary?.actions || "Actions",
    view: dictionary?.view || "View Profile",
    edit: dictionary?.edit || "Edit",
    delete: dictionary?.delete || "Delete",
    allTeachers: dictionary?.allTeachers || "All Teachers",
    addNewTeacher:
      dictionary?.addNewTeacher || "Add a new teacher to your school",
    active: dictionary?.active || "Active",
    inactive: dictionary?.inactive || "Inactive",
    search: dictionary?.search || "Search teachers...",
    create: dictionary?.create || "Create",
    export: dictionary?.export || "Export",
    reset: dictionary?.reset || "Reset",
    noAccount: dictionary?.noAccount || "No Account",
    hasAccount: dictionary?.hasAccount || "Has Account",
    noDepartment: dictionary?.noDepartment || "Unassigned",
    statusUpdated: dictionary?.statusUpdated || "Status updated",
    activate: dictionary?.activate || "Activate",
    deactivate: dictionary?.deactivate || "Deactivate",
    joined: dictionary?.joined || "Joined",
    failedToDeleteTeacher:
      dictionary?.failedToDeleteTeacher || "Failed to delete teacher",
    failedToUpdateStatus:
      dictionary?.failedToUpdateStatus || "Failed to update status",
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
    optimisticUpdate,
  } = usePlatformData<TeacherRow, { name?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      // Note: getTeachers returns simplified format, but initialData from server has full format
      // For search/filter operations, we refresh from server which has the full data
      const result = await getTeachers(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      // Map old format to new format with defaults
      const rows = result.data.rows.map((r: any) => ({
        ...r,
        givenName: r.givenName || r.name?.split(" ")[0] || "",
        surname: r.surname || r.name?.split(" ").slice(1).join(" ") || "",
        phone: r.phone || null,
        department: r.department || null,
        departmentId: r.departmentId || null,
        subjectCount: r.subjectCount || 0,
        classCount: r.classCount || 0,
        employmentStatus: r.employmentStatus || "ACTIVE",
        employmentType: r.employmentType || "FULL_TIME",
        hasAccount: r.hasAccount ?? !!r.userId,
        userId: r.userId || null,
        profilePhotoUrl: r.profilePhotoUrl || null,
        joiningDate: r.joiningDate || null,
        wizardStep: r.wizardStep || null,
      })) as TeacherRow[]
      return { rows, total: result.data.total }
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

  // Handle delete with optimistic update
  const handleDelete = useCallback(
    async (teacher: TeacherRow) => {
      try {
        const deleteMsg = `${t.delete} ${teacher.name}?`
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(teacher.id)

        const result = await deleteTeacher({ id: teacher.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(t.failedToDeleteTeacher || "Failed to delete teacher")
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : t.failedToDeleteTeacher || "Failed to delete"
        )
      }
    },
    [optimisticRemove, refresh, t.failedToDeleteTeacher]
  )

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftTeacher()
    if (result.success && result.data) {
      router.push(`/${lang}/teachers/add/${result.data.id}/information`)
    } else {
      ErrorToast(result.error || "Failed to create")
    }
  }, [router, lang])

  // Handle edit
  const handleEdit = useCallback(
    (teacher: TeacherRow) => {
      router.push(`/${lang}/teachers/add/${teacher.id}/information`)
    },
    [router, lang]
  )

  // Handle toggle status
  const handleToggleStatus = useCallback(
    async (teacher: TeacherRow) => {
      try {
        const newStatus =
          teacher.employmentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE"

        // Optimistic update with callback function
        optimisticUpdate(teacher.id, (item) => ({
          ...item,
          employmentStatus: newStatus,
        }))

        const result = await updateTeacher({
          id: teacher.id,
          employmentStatus: newStatus as
            | "ACTIVE"
            | "ON_LEAVE"
            | "TERMINATED"
            | "RETIRED",
        })

        if (result.success) {
          SuccessToast(t.statusUpdated)
        } else {
          // Revert on error
          refresh()
          ErrorToast(
            result.error || t.failedToUpdateStatus || "Failed to update status"
          )
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : t.failedToUpdateStatus || "Failed to update"
        )
      }
    },
    [optimisticUpdate, refresh, t.statusUpdated, t.failedToUpdateStatus]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getTeacherColumns(dictionary, lang, {
        onEdit: handleEdit,
        onDelete: handleDelete,
        onToggleStatus: handleToggleStatus,
      }),
    [dictionary, lang, handleEdit, handleDelete, handleToggleStatus]
  )

  // Table instance
  const { table } = useDataTable<TeacherRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible columns
        name: true,
        department: true,
        phone: false, // Hidden by default
        workload: true,
        status: true,
        account: false, // Hidden by default
        joiningDate: false, // Hidden by default
        completion: false, // Hidden by default, visible via column toggle
      },
    },
  })

  // Get status badge for grid view
  const getStatusBadge = (
    status: string
  ): {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  } => {
    const isActive = status === "ACTIVE"
    return {
      label: isActive ? t.active : t.inactive,
      variant: isActive ? "default" : "outline",
    }
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getTeachersCSV(filters)
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
        entityName="teachers"
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
              title={t.allTeachers}
              description={t.addNewTeacher}
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
              {data.map((teacher) => {
                const initials = teacher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                return (
                  <GridCard
                    key={teacher.id}
                    avatar={{
                      src: teacher.profilePhotoUrl,
                      fallback: initials,
                    }}
                    title={teacher.name}
                    description={teacher.department || t.noDepartment}
                    subtitle={`${teacher.subjectCount} ${t.subjects} • ${teacher.classCount} ${t.classes}`}
                    onClick={() =>
                      router.push(`/${lang}/teachers/${teacher.id}`)
                    }
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

export const TeachersTable = React.memo(TeachersTableInner)
