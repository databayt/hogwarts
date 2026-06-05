"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { retryComplianceSubmission } from "./actions"
import { resolveComplianceError } from "./error-map"
import type { SubmissionRowDTO } from "./queries"

type ComplianceDict = NonNullable<Dictionary["compliance"]>

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  ACCEPTED: "default",
  SUBMITTED: "secondary",
  IN_FLIGHT: "secondary",
  QUEUED: "outline",
  PENDING: "outline",
  REJECTED: "destructive",
  FAILED: "destructive",
  CANCELLED: "outline",
}

interface SubmissionsTableProps {
  dict: ComplianceDict
  submissions: SubmissionRowDTO[]
}

export function SubmissionsTable({ dict, submissions }: SubmissionsTableProps) {
  const [pending, startTransition] = useTransition()

  function handleRetry(submissionId: string) {
    startTransition(async () => {
      const result = await retryComplianceSubmission({ submissionId })
      if (result.success) {
        toast.success(dict.submissions.retry)
      } else {
        toast.error(resolveComplianceError(dict, result.errorCode))
      }
    })
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-12 text-center">
        <h2 className="text-xl font-semibold">{dict.submissions.title}</h2>
        <p className="text-muted-foreground mt-2">{dict.submissions.empty}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">{dict.submissions.title}</h2>
      <div className="bg-card overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.submissions.dateColumn}</TableHead>
              <TableHead>{dict.submissions.attemptColumn}</TableHead>
              <TableHead>{dict.submissions.modeColumn}</TableHead>
              <TableHead>{dict.submissions.statusColumn}</TableHead>
              <TableHead>{dict.submissions.studentsColumn}</TableHead>
              <TableHead>{dict.submissions.receiptColumn}</TableHead>
              <TableHead className="text-end">
                {dict.submissions.actionsColumn}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => {
              const isTerminal =
                s.status === "REJECTED" ||
                s.status === "FAILED" ||
                s.status === "CANCELLED"
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {s.submissionDate.toISOString().slice(0, 10)}
                  </TableCell>
                  <TableCell>{s.attemptNumber}</TableCell>
                  <TableCell>{dict.modes[s.mode]}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[s.status] ?? "outline"}>
                      {dict.status[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {s.payloadAbsentCount}/{s.payloadStudentCount}
                  </TableCell>
                  <TableCell>
                    {s.receiptId ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-2">
                      {s.csvArtifactUrl ? (
                        <Button asChild size="sm" variant="ghost">
                          <a
                            href={s.csvArtifactUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {dict.submissions.downloadCsv}
                          </a>
                        </Button>
                      ) : null}
                      {isTerminal ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(s.id)}
                          disabled={pending}
                        >
                          {dict.submissions.retry}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
