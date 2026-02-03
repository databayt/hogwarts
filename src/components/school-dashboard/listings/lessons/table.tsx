"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BookOpen, Clock, User } from "lucide-react"

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
import { LessonCreateForm } from "@/components/school-dashboard/listings/lessons/form"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/school-dashboard/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteLesson, getLessons, getLessonsCSV } from "./actions"
import { getLessonColumns, type LessonRow } from "./columns"

interface LessonsTableProps {
  initialData: LessonRow[]
  total: number
  dictionary?: Dictionary["school"]["lessons"]
  common?: Dictionary["school"]["common"]
  lang: Locale
  perPage?: number
}

function LessonsTableInner({
  initialData,
  total,
  dictionary,
  common,
  lang,
  perPage = 20,
}: LessonsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()

  // Translations with fallbacks
  const t = {
    title: dictionary?.title || "Title",
    class: dictionary?.class || "Class",
    teacher: dictionary?.teacher || "Teacher",
    subject: dictionary?.subject || "Subject",
    date: dictionary?.date || "Date",
    time: dictionary?.time || "Time",
    status: dictionary?.status || "Status",
    actions: "Actions",
    view: common?.actions?.view || "View",
    edit: common?.actions?.edit || "Edit",
    delete: common?.actions?.delete || "Delete",
    allLessons: dictionary?.allLessons || "All Lessons",
    addNewLesson:
      dictionary?.addNewLesson || "Plan a new lesson for your class",
    search: dictionary?.search || "Search lessons...",
    create: "Create",
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
  } = usePlatformData<LessonRow, { title?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getLessons(params)
      if (!result.success || !result.data) {
        return { rows: [], total: 0 }
      }
      return { rows: result.data.rows as LessonRow[], total: result.data.total }
    },
    filters: searchValue ? { title: searchValue } : undefined,
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
    async (lesson: LessonRow) => {
      try {
        const deleteMsg = `${t.delete} "${lesson.title}"?`
        const ok = await confirmDeleteDialog(deleteMsg)
        if (!ok) return

        // Optimistic remove
        optimisticRemove(lesson.id)

        const result = await deleteLesson({ id: lesson.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast("Failed to delete lesson")
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [optimisticRemove, refresh, t.delete]
  )

  // Generate columns on the client side with dictionary, lang, and callbacks
  const columns = useMemo(
    () =>
      getLessonColumns({
        dictionary,
        common,
        lang,
        callbacks: {
          onDelete: handleDelete,
        },
      }),
    [dictionary, common, lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<LessonRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: title, className, teacherName, lessonDate, status
        subjectName: false,
        startTime: false,
        endTime: false,
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
    (id: string) => {
      router.push(`/lessons/${id}`)
    },
    [router]
  )

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getLessonsCSV(filters)
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
    create: t.create || t.addNewLesson,
    reset: t.reset,
    export: t.export,
    exportCSV: "Export CSV",
    exporting: "Exporting...",
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
        entityName="lessons"
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
              title={t.allLessons}
              description={t.addNewLesson}
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
              {data.map((lesson) => (
                <GridCard
                  key={lesson.id}
                  icon="/anthropic/book-open.svg"
                  title={lesson.title}
                  description={lesson.subjectName}
                  subtitle={lesson.className}
                  onClick={() => handleView(lesson.id)}
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

      <Modal content={<LessonCreateForm onSuccess={refresh} />} />
    </>
  )
}

export const LessonsTable = React.memo(LessonsTableInner)
