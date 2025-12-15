"use client"

import { useCallback, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { DataTable } from "@/components/table/data-table"
import { DataTableToolbar } from "@/components/table/data-table-toolbar"
import { useDataTable } from "@/components/table/use-data-table"

import { getTemplateColumns, type ExamTemplateRow } from "./columns"
import { ExamTemplateForm } from "./form"

interface TemplatesTableProps {
  initialData: ExamTemplateRow[]
  total: number
  dictionary?: Dictionary
}

export function TemplatesTable({
  initialData,
  total,
  dictionary,
}: TemplatesTableProps) {
  const router = useRouter()
  const columns = useMemo(() => getTemplateColumns(dictionary), [dictionary])
  const [isPending, startTransition] = useTransition()

  // Refresh function for Modal callback
  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const { table } = useDataTable<ExamTemplateRow>({
    data: initialData,
    columns,
    pageCount: Math.ceil(total / initialData.length) || 1,
  })

  const { openModal } = useModal()

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={() => openModal()}
            aria-label={
              dictionary?.generate?.actions?.createTemplate || "Create Template"
            }
            title={
              dictionary?.generate?.actions?.createTemplate || "Create Template"
            }
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">
              {dictionary?.generate?.actions?.createTemplate ||
                "Create Template"}
            </span>
          </Button>
        </div>
      </DataTableToolbar>
      <Modal
        content={
          <ExamTemplateForm dictionary={dictionary} onSuccess={refresh} />
        }
      />
    </DataTable>
  )
}
