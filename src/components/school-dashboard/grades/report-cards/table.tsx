"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { BULK_MAX_ENTITIES } from "../../documents/config"
import { downloadBase64 } from "../../documents/download"
import { generateFromDefaultTemplateBulk } from "../../documents/generate"
import { GenerateWithTemplateButton } from "../../documents/generate-with-template-button"
import {
  generateReportCards,
  getReportCardIdsForTemplate,
  getReportCards,
  publishReportCards,
} from "../actions/report-cards"

interface ReportCardsTableProps {
  initialData: any[]
  total: number
  terms: Array<{ id: string; termNumber: number }>
  grades: Array<{ id: string; name: string; gradeNumber: number }>
  defaultTermId?: string
  dictionary: Dictionary
}

export function ReportCardsTable({
  initialData,
  total,
  terms,
  grades,
  defaultTermId,
  dictionary,
}: ReportCardsTableProps) {
  const dict = dictionary.results.reportCards
  const docs = dictionary.school?.documents
  const [data, setData] = useState(initialData)
  const [count, setCount] = useState(total)
  const [termId, setTermId] = useState(defaultTermId || "")
  const [gradeId, setGradeId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [bulkTotal, setBulkTotal] = useState(0)
  const [bulkDone, setBulkDone] = useState(0)
  const [bulkError, setBulkError] = useState<string | null>(null)

  const handleTermChange = (newTermId: string) => {
    setTermId(newTermId)
    startTransition(async () => {
      const result = await getReportCards({
        termId: newTermId,
        gradeId: gradeId || undefined,
      })
      setData(result.items)
      setCount(result.total)
    })
  }

  const handleGradeChange = (newGradeId: string) => {
    setGradeId(newGradeId)
    if (termId) {
      startTransition(async () => {
        const result = await getReportCards({
          termId,
          gradeId: newGradeId === "all" ? undefined : newGradeId,
        })
        setData(result.items)
        setCount(result.total)
      })
    }
  }

  const handleGenerate = () => {
    if (!termId) return
    startTransition(async () => {
      const result = await generateReportCards({
        termId,
        gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
      })
      if (result.success) {
        // Refresh data
        const refreshed = await getReportCards({
          termId,
          gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
        })
        setData(refreshed.items)
        setCount(refreshed.total)
      }
    })
  }

  const handlePublish = () => {
    if (!termId) return
    startTransition(async () => {
      await publishReportCards({
        termId,
        gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
      })
      const refreshed = await getReportCards({
        termId,
        gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
      })
      setData(refreshed.items)
      setCount(refreshed.total)
    })
  }

  /**
   * Fill the school's own `.docx` for EVERY card in the current filter.
   *
   * Chunked on purpose: each filled document is zipped and base64'd into the
   * action response, so a whole term in one call is tens of megabytes. One zip
   * part per `BULK_MAX_ENTITIES` cards, downloaded as it lands, with the count
   * shown — the per-row button below is still there for a single student.
   */
  const handleGenerateAll = async () => {
    if (!termId) return
    setBulkError(null)
    const listed = await getReportCardIdsForTemplate({
      termId,
      gradeId: gradeId && gradeId !== "all" ? gradeId : undefined,
    })
    if (!listed.success || !listed.data?.ids.length) {
      setBulkError(
        listed.success ? (dict.empty ?? null) : (docs?.generateFailed ?? null)
      )
      return
    }

    const ids = listed.data.ids
    setBulkTotal(ids.length)
    setBulkDone(0)

    for (let i = 0; i < ids.length; i += BULK_MAX_ENTITIES) {
      const slice = ids.slice(i, i + BULK_MAX_ENTITIES)
      const res = await generateFromDefaultTemplateBulk("REPORT_CARD", slice)
      if (!res.success || !res.data) {
        // `error` carries an ACTION CODE, not a sentence — surfacing it raw
        // prints "TEMPLATE_NOT_FOUND" at an Arabic admin.
        setBulkError(
          res.error === "TEMPLATE_NOT_FOUND"
            ? (docs?.noTemplate ?? null)
            : (docs?.generateFailed ?? null)
        )
        break
      }
      downloadBase64(res.data.filename, res.data.base64, res.data.mime)
      setBulkDone(i + slice.length)
    }

    setBulkTotal(0)
  }

  const unpublishedCount = data.filter((d: any) => !d.isPublished).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={termId} onValueChange={handleTermChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={dict.filters.selectTerm} />
          </SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {dict.filters.term} {t.termNumber}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={gradeId || "all"} onValueChange={handleGradeChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={dict.filters.allGrades} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.filters.allGrades}</SelectItem>
            {grades.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!termId || isPending}
            variant="outline"
          >
            {isPending ? dict.actions.generating : dict.actions.generate}
          </Button>
          <Button
            onClick={handleGenerateAll}
            disabled={!termId || isPending || bulkTotal > 0}
            variant="outline"
            title={docs?.generateAllHint?.replace(
              "{size}",
              String(BULK_MAX_ENTITIES)
            )}
          >
            {bulkTotal > 0
              ? (docs?.generateAllProgress ?? "{done} / {total}")
                  .replace("{done}", String(bulkDone))
                  .replace("{total}", String(bulkTotal))
              : (docs?.generateAll ?? "Generate all")}
          </Button>
          {unpublishedCount > 0 && (
            <Button onClick={handlePublish} disabled={isPending}>
              {dict.actions.publish} ({unpublishedCount})
            </Button>
          )}
        </div>
      </div>

      {bulkError && <p className="text-destructive text-sm">{bulkError}</p>}

      <div className="text-muted-foreground text-sm">
        {count} {dict.count}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.columns.rank}</TableHead>
              <TableHead>{dict.columns.student}</TableHead>
              <TableHead>{dict.columns.gpa}</TableHead>
              <TableHead>{dict.columns.grade}</TableHead>
              <TableHead>{dict.columns.subjects}</TableHead>
              <TableHead>{dict.columns.attendance}</TableHead>
              <TableHead>{dict.columns.status}</TableHead>
              <TableHead className="w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-8 text-center"
                >
                  {dict.empty}
                </TableCell>
              </TableRow>
            ) : (
              data.map((rc: any) => (
                <TableRow key={rc.id}>
                  <TableCell className="font-medium">
                    {rc.rank || "-"}
                    {rc.totalStudents && (
                      <span className="text-muted-foreground">
                        /{rc.totalStudents}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {rc.student.firstName} {rc.student.lastName}
                    </div>
                    {rc.student.studentId && (
                      <div className="text-muted-foreground text-xs">
                        {rc.student.studentId}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {rc.overallGPA ? Number(rc.overallGPA).toFixed(2) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{rc.overallGrade || "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    {rc.grades?.length || 0} {dict.subjectsCount}
                  </TableCell>
                  <TableCell className="text-sm">
                    {rc.daysPresent != null && (
                      <span>
                        P:{rc.daysPresent} A:{rc.daysAbsent || 0} L:
                        {rc.daysLate || 0}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rc.isPublished ? "default" : "secondary"}>
                      {rc.isPublished
                        ? dict.status.published
                        : dict.status.draft}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <GenerateWithTemplateButton
                      category="REPORT_CARD"
                      entityId={rc.id}
                      variant="ghost"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
