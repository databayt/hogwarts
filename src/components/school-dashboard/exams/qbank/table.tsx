"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import {
  confirmDeleteDialog,
  DeleteToast,
  ErrorToast,
} from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { deleteQuestion, getQuestions } from "./actions"
import { getQuestionBankColumns, type QuestionBankRow } from "./columns"
import { QuestionBankForm } from "./form"
import { QuestionCard } from "./question-card"
import { qbankT } from "./t"

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
  const fullDict = useDictionaryFallback<any>(dictionary)
  const { locale } = useLocale()
  const t = qbankT(fullDict)

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
        const ok = await confirmDeleteDialog(t.deleteConfirm ?? "")
        if (!ok) return

        // Optimistic remove
        setData((prev) => prev.filter((q) => q.id !== question.id))

        const result = await deleteQuestion(question.id)
        if (result.success) {
          DeleteToast()
        } else {
          // Revert on error
          refresh()
          ErrorToast(result.error || (t.deleteFailed ?? ""))
        }
      } catch (e) {
        refresh()
        ErrorToast(e instanceof Error ? e.message : (t.deleteFailed ?? ""))
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
        t,
      }),
    [handleDelete, subjects, locale, t]
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
            subjectName: q.subject?.name || (t.list?.unknownSubject ?? ""),
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
  }, [currentPage, perPage, isLoading, hasMore, t])

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

  const addLabel = dictionary?.generate?.actions?.addQuestion ?? ""
  const aiLabel = dictionary?.generate?.actions?.generateWithAI ?? ""

  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* Filters + add/generate. On a phone the controls grow to 44px and the
          search takes a full row. */}
      <DataTableToolbar
        table={table}
        className="max-md:[&_button]:min-h-11 max-md:[&_input]:h-11 max-md:[&_input]:w-full"
      >
        {!readOnly && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2 max-md:min-h-11"
              onClick={() => openModal()}
              aria-label={addLabel}
              title={addLabel}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{addLabel}</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-8 gap-2 max-md:min-h-11"
              onClick={handleAIGenerate}
              aria-label={aiLabel}
              title={aiLabel}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{aiLabel}</span>
            </Button>
          </div>
        )}
      </DataTableToolbar>

      {/* Phone: stacked cards. md and up: the table. Same `table` state. */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center text-sm">
            {t.list?.empty ?? ""}
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {table.getRowModel().rows.map((row) => (
              <QuestionCard
                key={row.id}
                row={row.original}
                t={t}
                readOnly={readOnly}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11 w-full"
            onClick={handleLoadMore}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading && <Loader2 className="me-2 size-4 animate-spin" />}
            {t.list?.loadMore ?? ""}
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          table={table}
          paginationMode="load-more"
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
        />
      </div>

      <Modal
        content={
          <QuestionBankForm
            dictionary={dictionary}
            subjects={subjectOptions}
            onSuccess={refresh}
          />
        }
      />
    </div>
  )
}

export const QuestionBankTable = React.memo(QuestionBankTableInner)
