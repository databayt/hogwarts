"use client"

import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ClipboardCheck, TrendingUp } from "lucide-react"

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
import { ResultCreateForm } from "@/components/platform/grades/form"
import {
  GridCard,
  GridContainer,
  GridEmptyState,
  PlatformToolbar,
} from "@/components/platform/shared"
import { DataTable } from "@/components/table/data-table"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteResult, getResults, getResultsCSV } from "./actions"
import { resultColumns, type ResultRow } from "./columns"

interface ResultsTableProps {
  initialData: ResultRow[]
  total: number
  dictionary: Dictionary["school"]["grades"]
  lang: Locale
  perPage?: number
}

function ResultsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
}: ResultsTableProps) {
  const router = useRouter()
  const { openModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const t = dictionary

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
  } = usePlatformData<ResultRow, { studentName?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      const result = await getResults(params)
      if (result.success) {
        return {
          rows: result.data.rows as ResultRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters: searchValue ? { studentName: searchValue } : undefined,
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
    async (result: ResultRow) => {
      try {
        const ok = await confirmDeleteDialog(
          t.deleteResultConfirm.replace("{studentName}", result.studentName)
        )
        if (!ok) return

        // Optimistic remove
        optimisticRemove(result.id)

        const res = await deleteResult({ id: result.id })
        if (res.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(t.failedToUpdate)
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : t.failedToUpdate)
      }
    },
    [optimisticRemove, refresh, t]
  )

  // Generate columns on the client side with hooks and callbacks
  const columns = useMemo(
    () =>
      resultColumns(t, lang, {
        onDelete: handleDelete,
      }),
    [t, lang, handleDelete]
  )

  // Table instance
  const { table } = useDataTable<ResultRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length || perPage,
      },
      columnVisibility: {
        // Default visible: studentName, assignmentTitle, className, percentage, grade, actions
        score: false,
        maxScore: false,
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
      router.push(`/grades/${id}`)
    },
    [router]
  )

  // Export CSV wrapper
  const handleExportCSV = useCallback(
    async (filters?: Record<string, unknown>) => {
      const result = await getResultsCSV(filters)
      if (result.success) {
        return result.data
      }
      return ""
    },
    []
  )

  // Get grade color
  const getGradeColor = (grade: string) => {
    const gradeMap: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      "A+": "default",
      A: "default",
      "A-": "default",
      "B+": "secondary",
      B: "secondary",
      "B-": "secondary",
      "C+": "outline",
      C: "outline",
      "C-": "outline",
      "D+": "destructive",
      D: "destructive",
      F: "destructive",
    }
    return { label: grade, variant: gradeMap[grade] || "outline" }
  }

  // Toolbar translations
  const toolbarTranslations = {
    search: t.studentName || "Search results...",
    create: t.addGrade || "Add",
    reset: "Reset",
    export: "Export",
    exportCSV: t.exportCSV || "Export CSV",
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
        searchPlaceholder="Search results..."
        onCreate={() => openModal()}
        getCSV={handleExportCSV}
        entityName="grades"
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
              title={t.allResults || "All Results"}
              description={t.recordNewResult || "Record a new grade result"}
              icon={<ClipboardCheck className="h-12 w-12" />}
            />
          ) : (
            <GridContainer columns={3}>
              {data.map((result) => {
                const initials = result.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
                const gradeBadge = getGradeColor(result.grade)

                return (
                  <GridCard
                    key={result.id}
                    title={result.studentName}
                    subtitle={result.assignmentTitle}
                    avatarFallback={initials}
                    status={gradeBadge}
                    metadata={[
                      { label: t.class, value: result.className },
                      {
                        label: t.score,
                        value: `${result.score}/${result.maxScore}`,
                      },
                      {
                        label: t.percentage,
                        value: (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {result.percentage.toFixed(1)}%
                          </span>
                        ),
                      },
                    ]}
                    actions={[
                      {
                        label: t.viewGrade || "View",
                        onClick: () => handleView(result.id),
                      },
                      {
                        label: t.editGrade || "Edit",
                        onClick: () => handleEdit(result.id),
                      },
                      {
                        label: t.deleteGrade || "Delete",
                        onClick: () => handleDelete(result),
                        variant: "destructive",
                      },
                    ]}
                    actionsLabel={t.actions}
                    onClick={() => handleView(result.id)}
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
                {isLoading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      <Modal
        content={<ResultCreateForm dictionary={t} onSuccess={refresh} />}
      />
    </>
  )
}

export const ResultsTable = React.memo(ResultsTableInner)
