"use client"

import { Download, FileText, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export function ExamsTab({ dictionary, lang }: Props) {
  function downloadTemplate() {
    const template =
      "ExamName,Subject,StudentId,Score,MaxScore,Date\nMidterm 2024,Mathematics,STU001,85,100,2024-01-20\nMidterm 2024,Mathematics,STU002,72,100,2024-01-20"
    const blob = new Blob([template], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "exam-scores-template.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle>Bulk Exam Scores Import</CardTitle>
              <CardDescription>
                Import exam scores and results from CSV for multiple students.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            <div className="flex-1">
              <Input type="file" accept=".csv" disabled />
            </div>
            <Button disabled>
              <Upload className="me-2 h-4 w-4" />
              Coming Soon
            </Button>
          </div>

          <div className="rounded-md border p-4">
            <h4 className="mb-2 font-medium">CSV Format</h4>
            <code className="text-muted-foreground block text-sm">
              ExamName,Subject,StudentId,Score,MaxScore,Date
            </code>
            <p className="text-muted-foreground mt-2 text-xs">
              Score must be less than or equal to MaxScore.
            </p>
          </div>

          <div className="bg-muted rounded-md p-4 text-center">
            <p className="text-muted-foreground text-sm">
              Bulk exam scores import will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
