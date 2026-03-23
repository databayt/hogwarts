// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getExamResults } from "./actions"
import type { ExamResultRow } from "./actions/types"

interface Props {
  examId: string
  dictionary?: Dictionary
}

export async function ExamResultsList({ examId, dictionary }: Props) {
  const t = dictionary?.school?.exams?.manage?.resultsList
  const response = await getExamResults({ examId })
  const results = response.success && response.data ? response.data : []

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t?.title ?? "Exam Results"}</CardTitle>
          <CardDescription>
            {t?.description ?? "Student performance overview"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground py-8 text-center">
            {t?.noResults ?? "No results available yet"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t?.title ?? "Exam Results"}</CardTitle>
        <CardDescription>
          {(t?.showingStudents ?? "Showing {count} student(s)").replace(
            "{count}",
            String(results.length)
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>
                  {t?.headers?.studentName ?? "Student Name"}
                </TableHead>
                <TableHead className="w-[120px]">
                  {dictionary?.school?.exams?.marks ?? "Marks"}
                </TableHead>
                <TableHead className="w-[120px]">
                  {dictionary?.school?.exams?.percentage ?? "Percentage"}
                </TableHead>
                <TableHead className="w-[100px]">
                  {dictionary?.school?.exams?.grade ?? "Grade"}
                </TableHead>
                <TableHead className="w-[100px]">
                  {dictionary?.school?.exams?.status ?? "Status"}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result: ExamResultRow, index: number) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>{result.studentId || "-"}</TableCell>
                  <TableCell>{result.studentName}</TableCell>
                  <TableCell>
                    {result.isAbsent ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <span className="font-medium">
                        {result.marksObtained}/{result.totalMarks}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.isAbsent ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <span className="font-medium">
                        {result.percentage.toFixed(2)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.grade ? (
                      <Badge variant="outline">{result.grade}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {result.isAbsent ? (
                      <Badge variant="destructive">
                        {t?.absent ?? "Absent"}
                      </Badge>
                    ) : result.percentage >= 50 ? (
                      <Badge variant="default" className="bg-green-600">
                        {dictionary?.school?.exams?.passed ?? "Pass"}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">{t?.fail ?? "Fail"}</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
