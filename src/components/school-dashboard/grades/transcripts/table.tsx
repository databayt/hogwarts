"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { generateTranscript, getTranscripts } from "../actions/transcripts"

interface TranscriptsTableProps {
  initialData: any[]
  dictionary: Dictionary
}

export function TranscriptsTable({
  initialData,
  dictionary,
}: TranscriptsTableProps) {
  const dict = dictionary.results.transcripts
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState("")
  const [studentId, setStudentId] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    startTransition(async () => {
      const result = await getTranscripts({ search: search || undefined })
      setData(result)
    })
  }

  const handleGenerate = () => {
    if (!studentId) return
    startTransition(async () => {
      const result = await generateTranscript({ studentId })
      if (result.success) {
        const refreshed = await getTranscripts()
        setData(refreshed)
        setStudentId("")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder={dict.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-64"
        />
        <Button variant="outline" onClick={handleSearch} disabled={isPending}>
          {dict.search}
        </Button>
        <div className="ms-auto flex items-center gap-2">
          <Input
            placeholder={dict.studentIdPlaceholder}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleGenerate} disabled={!studentId || isPending}>
            {isPending ? dict.generating : dict.generate}
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground text-sm">
        {data.length} {dict.count}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.columns.number}</TableHead>
              <TableHead>{dict.columns.student}</TableHead>
              <TableHead>{dict.columns.gpa}</TableHead>
              <TableHead>{dict.columns.credits}</TableHead>
              <TableHead>{dict.columns.pdf}</TableHead>
              <TableHead>{dict.columns.date}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  {dict.empty}
                </TableCell>
              </TableRow>
            ) : (
              data.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm">
                    {t.transcriptNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{t.studentName}</div>
                    {t.student?.studentId && (
                      <div className="text-muted-foreground text-xs">
                        {t.student.studentId}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {t.cumulativeGPA ? Number(t.cumulativeGPA).toFixed(2) : "-"}
                  </TableCell>
                  <TableCell>
                    {t.totalCredits ? Number(t.totalCredits) : "-"}
                  </TableCell>
                  <TableCell>
                    {t.pdfUrl ? (
                      <a
                        href={t.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        {dict.download}
                      </a>
                    ) : (
                      <Badge variant="secondary">{dict.pending}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(t.createdAt).toLocaleDateString()}
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
