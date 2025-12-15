"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteExam, getExams } from "./actions"
import { getExamColumns, type ExamRow } from "./columns"
import { ExportButton } from "./export-button"
import { ExamCreateForm } from "./form"

interface ExamsTableProps {
  initialData: ExamRow[]
  total: number
  perPage?: number
}

export function ExamsTable({
  initialData,
  total,
  perPage = 20,
}: ExamsTableProps) {
  const router = useRouter()

  // State for incremental loading
  const [data, setData] = useState<ExamRow[]>(initialData)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Refresh function for Modal callback
  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const hasMore = data.length < total

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const result = await getExams({ page: nextPage, perPage })

      if (result.rows.length > 0) {
        setData((prev) => [...prev, ...result.rows])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error("Failed to load more exams:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, perPage, isLoading, hasMore])

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (exam: ExamRow) => {
      try {
        const ok = await confirmDeleteDialog(`Delete "${exam.title}"?`)
        if (!ok) return

        // Optimistic remove
        setData((prev) => prev.filter((e) => e.id !== exam.id))

        const result = await deleteExam({ id: exam.id })
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast("Failed to delete exam")
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : "Failed to delete")
      }
    },
    [refresh]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getExamColumns({
        onDelete: handleDelete,
      }),
    [handleDelete]
  )

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<ExamRow>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      },
    },
  })

  const { openModal } = useModal()

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => openModal()}
            aria-label="Create"
            title="Create"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <ExportButton />
        </div>
      </DataTableToolbar>
      <Modal content={<ExamCreateForm onSuccess={refresh} />} />
    </DataTable>
  )
}
