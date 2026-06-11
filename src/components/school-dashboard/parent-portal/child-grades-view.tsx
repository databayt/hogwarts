// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { formatDate } from "@/lib/i18n-format"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getChildGrades } from "./actions"

interface Props {
  studentId: string
  lang?: Locale
  dictionary?: Dictionary
}

export async function ChildGradesView({
  studentId,
  lang = "ar",
  dictionary,
}: Props) {
  const t = dictionary?.parentPortal?.grades
  const { grades } = await getChildGrades({ studentId })

  const { examResults, classScores } = grades

  return (
    <div className="space-y-6">
      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exams">
            {t?.tabExams ?? "Exam Results"}
          </TabsTrigger>
          <TabsTrigger value="classes">
            {t?.tabClasses ?? "Class Scores"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.examResults ?? "Exam Results"}</CardTitle>
              <CardDescription>
                {examResults.length > 0
                  ? (t?.showingExams?.replace(
                      "{count}",
                      String(examResults.length)
                    ) ??
                    `Showing ${examResults.length} exam result${examResults.length !== 1 ? "s" : ""}`)
                  : (t?.noExamResults ?? "No exam results available")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {examResults.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  {t?.noExamResultsRecorded ?? "No exam results recorded yet"}
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t?.colExamTitle ?? "Exam Title"}</TableHead>
                        <TableHead>{t?.colSubject ?? "Subject"}</TableHead>
                        <TableHead>{t?.colDate ?? "Date"}</TableHead>
                        <TableHead>{t?.colType ?? "Type"}</TableHead>
                        <TableHead className="w-[120px]">
                          {t?.colMarks ?? "Marks"}
                        </TableHead>
                        <TableHead className="w-[120px]">
                          {t?.colPercentage ?? "Percentage"}
                        </TableHead>
                        <TableHead className="w-[100px]">
                          {t?.colGrade ?? "Grade"}
                        </TableHead>
                        <TableHead className="w-[100px]">
                          {t?.colStatus ?? "Status"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.examTitle}
                          </TableCell>
                          <TableCell>{result.name}</TableCell>
                          <TableCell>
                            {formatDate(result.examDate, lang)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.examType}</Badge>
                          </TableCell>
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
                                {t?.statusAbsent ?? "Absent"}
                              </Badge>
                            ) : result.percentage >= 50 ? (
                              <Badge variant="default" className="bg-green-600">
                                {t?.statusPass ?? "Pass"}
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                {t?.statusFail ?? "Fail"}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t?.classScores ?? "Class Scores"}</CardTitle>
              <CardDescription>
                {classScores.length > 0
                  ? (t?.showingClasses?.replace(
                      "{count}",
                      String(classScores.length)
                    ) ??
                    `Showing ${classScores.length} class${classScores.length !== 1 ? "es" : ""}`)
                  : (t?.noClassScores ?? "No class scores available")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classScores.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  {t?.noClassScoresRecorded ?? "No class scores recorded yet"}
                </p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t?.colClassName ?? "Class Name"}</TableHead>
                        <TableHead>{t?.colSubject ?? "Subject"}</TableHead>
                        <TableHead className="w-[150px]">
                          {t?.colScore ?? "Score"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classScores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell className="font-medium">
                            {score.className}
                          </TableCell>
                          <TableCell>{score.name}</TableCell>
                          <TableCell>
                            {score.score !== null ? (
                              <span className="font-medium">{score.score}</span>
                            ) : (
                              <span className="text-muted-foreground">
                                {t?.notGraded ?? "Not graded"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
