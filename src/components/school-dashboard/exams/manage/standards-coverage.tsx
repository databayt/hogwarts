"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { CheckCircle, Loader2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface StandardCoverage {
  id: string
  code: string
  name: string
  subjectArea: string | null
  questionCount: number
  covered: boolean
}

interface StandardsCoverageProps {
  examId: string
}

export function StandardsCoverage({ examId }: StandardsCoverageProps) {
  const { dictionary } = useDictionary()
  const ts = dictionary?.school?.exams?.manage?.standards
  const t = ts?.headers
  const [loading, setLoading] = useState(true)
  const [standards, setStandards] = useState<StandardCoverage[]>([])
  const [totalStandards, setTotalStandards] = useState(0)
  const [coveredCount, setCoveredCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const { getExamStandardsCoverage } = await import("./actions/analytics")
        const result = await getExamStandardsCoverage(examId)
        if (result.success && result.data) {
          setStandards(result.data.standards)
          setTotalStandards(result.data.total)
          setCoveredCount(result.data.covered)
        }
      } catch {
        // Error state handled by empty standards
      }
      setLoading(false)
    }
    load()
  }, [examId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  if (standards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground text-sm">
          {ts?.noStandards ??
            "No curriculum standards configured. Link standards to questions to see coverage."}
        </p>
      </div>
    )
  }

  const coveragePercent =
    totalStandards > 0 ? Math.round((coveredCount / totalStandards) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {ts?.coverage ?? "Coverage"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{coveragePercent}%</div>
            <p className="text-muted-foreground text-xs">
              {(ts?.ofStandards ?? "{covered} of {total} standards")
                .replace("{covered}", String(coveredCount))
                .replace("{total}", String(totalStandards))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {ts?.covered ?? "Covered"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {coveredCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {ts?.missing ?? "Missing"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">
              {totalStandards - coveredCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t?.status ?? "Status"}</TableHead>
            <TableHead>{t?.code ?? "Code"}</TableHead>
            <TableHead>{t?.standard ?? "Standard"}</TableHead>
            <TableHead>{t?.subject ?? "Subject"}</TableHead>
            <TableHead>{t?.questions ?? "Questions"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standards.map((s) => (
            <TableRow key={s.id}>
              <TableCell>
                {s.covered ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="text-destructive h-4 w-4" />
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {s.code}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {s.subjectArea || "-"}
              </TableCell>
              <TableCell>{s.questionCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
