"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteQuestion, getQuestions } from "./actions"
import { getQuestionBankColumns, type QuestionBankRow } from "./columns"
import { QuestionBankForm } from "./form"

interface QuestionBankTableProps {
  initialData: QuestionBankRow[]
  total: number
  perPage?: number
  dictionary?: Dictionary
  readOnly?: boolean
  subjects?: { label: string; value: string }[]
  subjectOptions?: { label: string; value: string }[]
}

function QuestionBankTableInner({
  initialData,
  total,
  perPage = 20,
  dictionary,
  readOnly,
  subjects,
  subjectOptions,
}: QuestionBankTableProps) {
  const router = useRouter()
  const { dictionary: hookDict } = useDictionary()
  const { locale } = useLocale()
  const t = hookDict?.school?.exams?.qbankUi

  // State for incremental loading
  const [data, setData] = useState<QuestionBankRow[]>(initialData)
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

  // Handle delete with optimistic update (must be before columns useMemo)
  const handleDelete = useCallback(
    async (question: QuestionBankRow) => {
      try {
        // Never build the sentence from the question text — that mixes
        // scripts mid-string and breaks bidi rendering in Arabic.
        const ok = await confirmDeleteDialog(
          t?.deleteConfirm ?? "Delete this question?"
        )
        if (!ok) return

        // Optimistic remove
        setData((prev) => prev.filter((q) => q.id !== question.id))

        const result = await deleteQuestion(question.id)
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(result.error || (t?.deleteFailed ?? "Failed to delete"))
        }
      } catch (e) {
        refresh()
        ErrorToast(
          e instanceof Error
            ? e.message
            : (t?.deleteFailed ?? "Failed to delete")
        )
      }
    },
    [refresh, t]
  )

  // Generate columns with callbacks
  const columns = useMemo(
    () =>
      getQuestionBankColumns({
        // Without this the columns fall back to their "en" default, so the
        // whole table rendered English on /ar even though every header has
        // an Arabic string ready.
        lang: locale,
        onDelete: handleDelete,
        subjects,
      }),
    [handleDelete, subjects, locale]
  )

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = currentPage + 1
      const questions = await getQuestions({})

      if (questions.length > 0) {
        const newRows: QuestionBankRow[] = questions
          .slice(currentPage * perPage, (currentPage + 1) * perPage)
          .map((q: any) => ({
            id: q.id,
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            bloomLevel: q.bloomLevel,
            subjectName: q.subject?.name || "Unknown",
            points: Number(q.points),
            source: q.source,
            timesUsed: q.analytics?.timesUsed || 0,
            successRate: q.analytics?.successRate || null,
            avgScore: q.analytics?.avgScore || null,
            qualityFlags: [],
            createdAt: q.createdAt.toISOString(),
          }))

        setData((prev) => [...prev, ...newRows])
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error("Failed to load more questions:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, perPage, isLoading, hasMore])

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<QuestionBankRow>({
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

  const handleAIGenerate = () => {
    const qs = typeof window !== "undefined" ? window.location.search || "" : ""
    window.location.href = `/generate/questions/ai-generate${qs}`
  }

  return (
    <div className="w-full">
      <DataTable
        table={table}
        paginationMode="load-more"
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={handleLoadMore}
      >
        <DataTableToolbar table={table}>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={() => openModal()}
                aria-label={
                  dictionary?.generate?.actions?.addQuestion || "Add Question"
                }
                title={
                  dictionary?.generate?.actions?.addQuestion || "Add Question"
                }
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {dictionary?.generate?.actions?.addQuestion || "Add Question"}
                </span>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-8 gap-2"
                onClick={handleAIGenerate}
                aria-label={
                  dictionary?.generate?.actions?.generateWithAI || "AI Generate"
                }
                title={
                  dictionary?.generate?.actions?.generateWithAI || "AI Generate"
                }
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {dictionary?.generate?.actions?.generateWithAI ||
                    "AI Generate"}
                </span>
              </Button>
            </div>
          )}
        </DataTableToolbar>
        <Modal
          content={
            <QuestionBankForm
              dictionary={dictionary}
              subjects={subjectOptions}
              onSuccess={refresh}
            />
          }
        />
      </DataTable>
    </div>
  )
}

export const QuestionBankTable = React.memo(QuestionBankTableInner)
