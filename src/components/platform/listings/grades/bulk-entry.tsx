"use client"

import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { Download, Save, Upload } from "lucide-react"
import { toast } from "sonner"

import { formatNumber, formatPercentage } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

interface Student {
  id: string
  givenName: string
  surname: string
  studentId?: string
}

interface BulkGradeEntry {
  studentId: string
  score: number | ""
  grade: string
  feedback?: string
}

interface BulkGradeEntryProps {
  classId: string
  assignmentId?: string
  examId?: string
  maxScore: number
  students: Student[]
  gradeScale?: Array<{ min: number; max: number; grade: string }>
  onSave: (entries: BulkGradeEntry[]) => Promise<void>
  dictionary: Dictionary
  locale: Locale
}

export function BulkGradeEntry({
  classId,
  assignmentId,
  examId,
  maxScore,
  students,
  gradeScale = [
    { min: 90, max: 100, grade: "A" },
    { min: 80, max: 89, grade: "B" },
    { min: 70, max: 79, grade: "C" },
    { min: 60, max: 69, grade: "D" },
    { min: 0, max: 59, grade: "F" },
  ],
  onSave,
  dictionary,
  locale,
}: BulkGradeEntryProps) {
  const [entries, setEntries] = useState<Map<string, BulkGradeEntry>>(
    new Map(
      students.map((s) => [
        s.id,
        { studentId: s.id, score: "", grade: "", feedback: "" },
      ])
    )
  )
  const [saving, setSaving] = useState(false)
  const [autoCalculateGrades, setAutoCalculateGrades] = useState(true)

  // Calculate grade based on score
  const calculateGrade = useCallback(
    (score: number): string => {
      const percentage = (score / maxScore) * 100
      for (const scale of gradeScale) {
        if (percentage >= scale.min && percentage <= scale.max) {
          return scale.grade
        }
      }
      return "F"
    },
    [maxScore, gradeScale]
  )

  // Update a single entry
  const updateEntry = useCallback(
    (studentId: string, field: keyof BulkGradeEntry, value: any) => {
      setEntries((prev) => {
        const newEntries = new Map(prev)
        const entry = newEntries.get(studentId) || {
          studentId,
          score: "",
          grade: "",
          feedback: "",
        }

        if (field === "score" && autoCalculateGrades) {
          const scoreNum = parseFloat(value)
          if (!isNaN(scoreNum) && scoreNum >= 0 && scoreNum <= maxScore) {
            entry.score = scoreNum
            entry.grade = calculateGrade(scoreNum)
          } else if (value === "") {
            entry.score = ""
            entry.grade = ""
          }
        } else {
          entry[field] = value
        }

        newEntries.set(studentId, entry)
        return newEntries
      })
    },
    [autoCalculateGrades, calculateGrade, maxScore]
  )

  // Calculate statistics
  const stats = useMemo(() => {
    const scores = Array.from(entries.values())
      .map((e) => (typeof e.score === "number" ? e.score : null))
      .filter((s) => s !== null) as number[]

    if (scores.length === 0) return null

    const sum = scores.reduce((a, b) => a + b, 0)
    const avg = sum / scores.length
    const sorted = [...scores].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]

    return {
      count: scores.length,
      average: formatNumber(avg, locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      median: formatNumber(median, locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      highest: formatNumber(Math.max(...scores), locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      lowest: formatNumber(Math.min(...scores), locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    }
  }, [entries, locale])

  // Save all entries
  const handleSave = async () => {
    setSaving(true)
    try {
      const validEntries = Array.from(entries.values()).filter(
        (e) => typeof e.score === "number"
      )
      if (validEntries.length === 0) {
        toast.error(dictionary.school.grades.noGradesToSave)
        return
      }
      await onSave(validEntries)
      toast.success(
        dictionary.school.grades.savedGrades.replace(
          "{count}",
          validEntries.length.toString()
        )
      )
    } catch (error) {
      toast.error(dictionary.school.grades.failedToSave)
    } finally {
      setSaving(false)
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      dictionary.school.students.studentId,
      dictionary.school.students.fullName,
      dictionary.school.grades.score,
      dictionary.school.grades.grade,
      dictionary.school.grades.percentage,
      dictionary.school.grades.feedback,
    ]
    const rows = students.map((student) => {
      const entry = entries.get(student.id)
      const score = entry?.score || ""
      const percentage =
        typeof score === "number"
          ? formatNumber((score / maxScore) * 100, locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : ""
      return [
        student.studentId || student.id,
        `${student.givenName} ${student.surname}`,
        typeof score === "number" ? formatNumber(score, locale) : "",
        entry?.grade || "",
        percentage,
        entry?.feedback || "",
      ]
    })

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `grades_${classId}_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  // Import from CSV
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim())

      const scoreIndex = headers.findIndex((h) =>
        h.toLowerCase().includes("score")
      )
      const gradeIndex = headers.findIndex((h) =>
        h.toLowerCase().includes("grade")
      )
      const feedbackIndex = headers.findIndex((h) =>
        h.toLowerCase().includes("feedback")
      )

      if (scoreIndex === -1) {
        toast.error(dictionary.school.grades.csvMustContainScore)
        return
      }

      const newEntries = new Map(entries)
      lines.slice(1).forEach((line, idx) => {
        if (!line.trim()) return

        const values = line.split(",").map((v) => v.replace(/"/g, "").trim())
        const student = students[idx]
        if (!student) return

        const score = parseFloat(values[scoreIndex])
        if (!isNaN(score)) {
          newEntries.set(student.id, {
            studentId: student.id,
            score,
            grade: gradeIndex >= 0 ? values[gradeIndex] : calculateGrade(score),
            feedback: feedbackIndex >= 0 ? values[feedbackIndex] : "",
          })
        }
      })

      setEntries(newEntries)
      toast.success(dictionary.school.grades.importedSuccessfully)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.school.grades.bulkEntry}</CardTitle>
          <CardDescription>
            {dictionary.school.grades.bulkEntryDescription.replace(
              "{maxScore}",
              formatNumber(maxScore, locale)
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="auto-grade"
                checked={autoCalculateGrades}
                onChange={(e) => setAutoCalculateGrades(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="auto-grade">
                {dictionary.school.grades.autoCalculateGrades}
              </Label>
            </div>

            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              {dictionary.school.grades.exportCSV}
            </Button>

            <div>
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-csv"
              />
              <Button variant="outline" size="sm" asChild>
                <label htmlFor="import-csv" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {dictionary.school.grades.importCSV}
                </label>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>{dictionary.school.grades.studentName}</TableHead>
                  <TableHead className="w-[120px]">
                    {dictionary.school.grades.score}
                  </TableHead>
                  <TableHead className="w-[100px]">
                    {dictionary.school.grades.grade}
                  </TableHead>
                  <TableHead className="w-[100px]">
                    {dictionary.school.grades.percentage}
                  </TableHead>
                  <TableHead>{dictionary.school.grades.feedback}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => {
                  const entry = entries.get(student.id)
                  const percentage =
                    typeof entry?.score === "number"
                      ? formatNumber((entry.score / maxScore) * 100, locale, {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })
                      : ""

                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {student.givenName} {student.surname}
                          </div>
                          {student.studentId && (
                            <div className="text-muted-foreground text-xs">
                              {student.studentId}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={maxScore}
                          step="0.5"
                          value={entry?.score ?? ""}
                          onChange={(e) =>
                            updateEntry(student.id, "score", e.target.value)
                          }
                          className={cn(
                            "w-24",
                            typeof entry?.score === "number" &&
                              entry.score > maxScore &&
                              "border-red-500"
                          )}
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        {autoCalculateGrades ? (
                          <div className="font-medium">
                            {entry?.grade || "-"}
                          </div>
                        ) : (
                          <Select
                            value={entry?.grade || ""}
                            onValueChange={(value) =>
                              updateEntry(student.id, "grade", value)
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              {gradeScale.map((scale) => (
                                <SelectItem
                                  key={scale.grade}
                                  value={scale.grade}
                                >
                                  {scale.grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "font-medium",
                            parseFloat(percentage) >= 90 && "text-green-600",
                            parseFloat(percentage) >= 70 &&
                              parseFloat(percentage) < 90 &&
                              "text-blue-600",
                            parseFloat(percentage) >= 50 &&
                              parseFloat(percentage) < 70 &&
                              "text-yellow-600",
                            parseFloat(percentage) < 50 &&
                              parseFloat(percentage) > 0 &&
                              "text-red-600"
                          )}
                        >
                          {percentage ? `${percentage}%` : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={entry?.feedback || ""}
                          onChange={(e) =>
                            updateEntry(student.id, "feedback", e.target.value)
                          }
                          placeholder={
                            dictionary.school.grades.optionalFeedback
                          }
                          className="h-[38px] min-h-[38px] resize-none"
                          rows={1}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {stats && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {dictionary.school.grades.statistics}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">
                      {dictionary.school.grades.graded}
                    </div>
                    <div className="font-medium">
                      {formatNumber(stats.count, locale)}/
                      {formatNumber(students.length, locale)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {dictionary.school.grades.average}
                    </div>
                    <div className="font-medium">{stats.average}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {dictionary.school.grades.median}
                    </div>
                    <div className="font-medium">{stats.median}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {dictionary.school.grades.highest}
                    </div>
                    <div className="font-medium text-green-600">
                      {stats.highest}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      {dictionary.school.grades.lowest}
                    </div>
                    <div className="font-medium text-red-600">
                      {stats.lowest}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving
                ? dictionary.school.grades.saving
                : dictionary.school.grades.saveGrades}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
