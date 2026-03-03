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

import { generateTranscript, getTranscripts } from "../actions/transcripts"

interface TranscriptsTableProps {
  initialData: any[]
}

export function TranscriptsTable({ initialData }: TranscriptsTableProps) {
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
          placeholder="Search by student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-64"
        />
        <Button variant="outline" onClick={handleSearch} disabled={isPending}>
          Search
        </Button>
        <div className="ms-auto flex items-center gap-2">
          <Input
            placeholder="Student ID (for generation)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-64"
          />
          <Button onClick={handleGenerate} disabled={!studentId || isPending}>
            {isPending ? "Generating..." : "Generate Transcript"}
          </Button>
        </div>
      </div>

      <div className="text-muted-foreground text-sm">
        {data.length} transcripts
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>GPA</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>PDF</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No transcripts found. Enter a student ID and click "Generate
                  Transcript".
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
                        Download
                      </a>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
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
