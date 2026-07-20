"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ClipboardCheck, TrendingUp } from "lucide-react"

import { asset } from "@/lib/asset-url"
import {
  FULL_UI_PERMISSIONS,
  type UIPermissions,
} from "@/lib/rbac/ui-permissions"
import { useDebouncedSearch } from "@/hooks/use-debounced-search"
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

import { deleteResult, getResults, getResultsCSV } from "./actions"
import { resultColumns, type ResultRow } from "./columns"
import { createDraftResult } from "./wizard/actions"

interface ResultsTableProps {
  initialData: ResultRow[]
  total: number
  dictionary: Dictionary["school"]["grades"]
  lang: Locale
  perPage?: number
  permissions?: UIPermissions
}

function ResultsTableInner({
  initialData,
  total,
  dictionary,
  lang,
  perPage = 20,
  permissions = FULL_UI_PERMISSIONS,
}: ResultsTableProps) {
  const router = useRouter()
  const t = dictionary

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
  } = usePlatformData<ResultRow, { search?: string }>({
    initialData,
    total,
    perPage,
    fetcher: async (params) => {
      // Pass the route locale so search/load-more translate to the SAME
      // language as the initial server render (content.tsx) — the
      // NEXT_LOCALE cookie can disagree with the URL.
      const result = await getResults({ ...params, lang })
      if (result.success) {
        return {
          rows: result.data.rows as ResultRow[],
          total: result.data.total,
        }
      }
      return { rows: [], total: 0 }
    },
    filters: debouncedSearch ? { search: debouncedSearch } : undefined,
  })

  // Handle search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)
    },
    [setSearchValue]
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
        permissions,
      }),
    [t, lang, handleDelete, permissions]
  )

  // Table instance
  const { table } = useDataTable<ResultRow>({
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
        // Default visible: studentName, assignmentTitle, className, percentage, grade, actions
        score: false,
        maxScore: false,
        createdAt: false,
      },
    },
  })

  // Handle create via wizard
  const handleCreate = useCallback(async () => {
    const result = await createDraftResult()
    if (result.success && result.data) {
      router.push(`/${lang}/grades/add/${result.data.id}/selection`)
    } else {
      ErrorToast(result.error || t.failedToCreateResult)
    }
  }, [router, lang])

  // Handle edit
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/${lang}/grades/add/${id}/selection`)
    },
    [router, lang]
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
    search: t.searchResults || t.studentName,
    create: t.addGrade,
    reset: t.reset,
    export: t.export,
    exportCSV: t.exportCSV,
    exporting: t.exporting,
  }

  return (
    <>
      <PlatformToolbar
        table={table}
        view={view}
        onToggleView={toggleView}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        searchPlaceholder={t.searchResults}
        onCreate={permissions.showAddButton ? handleCreate : undefined}
        getCSV={permissions.showExportButton ? handleExportCSV : undefined}
        entityName="grades"
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
              title={t.allResults}
              description={t.recordNewResult}
              icon={
                <Image
                  src={asset("/icons/graduation-cap.svg")}
                  alt=""
                  width={48}
                  height={48}
                />
              }
            />
          ) : (
            <GridContainer columns={4} className="mt-4">
              {data.map((result) => (
                <GridCard
                  key={result.id}
                  icon={asset("/icons/graduation-cap.svg")}
                  title={result.studentName}
                  description={`${result.score}/${result.maxScore} (${result.percentage.toFixed(0)}%)`}
                  subtitle={result.grade}
                  onClick={() => handleView(result.id)}
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
                {isLoading ? t.loading : t.loadMore}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}

export const ResultsTable = React.memo(ResultsTableInner)
