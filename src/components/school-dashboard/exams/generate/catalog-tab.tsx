"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import {
  Check,
  Clock,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getCatalogSubjectsForBrowse } from "../qbank/actions/catalog-browse"
import {
  browseCatalogExams,
  getCatalogExamDetail,
  type CatalogExamBrowseFilters,
  type CatalogExamDetail,
  type CatalogExamRow,
} from "./actions/catalog-browse"

const EXAM_TYPE_LABELS: Record<string, string> = {
  final: "Final",
  midterm: "Midterm",
  chapter_test: "Chapter Test",
  quiz: "Quiz",
  practice: "Practice",
  diagnostic: "Diagnostic",
}

const EXAM_TYPE_COLORS: Record<string, string> = {
  final: "bg-purple-100 text-purple-800",
  midterm: "bg-blue-100 text-blue-800",
  chapter_test: "bg-orange-100 text-orange-800",
  quiz: "bg-green-100 text-green-800",
  practice: "bg-gray-100 text-gray-800",
  diagnostic: "bg-cyan-100 text-cyan-800",
}

export function CatalogExamBrowseTab() {
  const [exams, setExams] = useState<CatalogExamRow[]>([])
  const [total, setTotal] = useState(0)
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState<CatalogExamBrowseFilters>({})
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [previewExam, setPreviewExam] = useState<CatalogExamDetail | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const fetchExams = useCallback(() => {
    startTransition(async () => {
      const result = await browseCatalogExams({ ...filters, page })
      setExams(result.exams)
      setTotal(result.total)
    })
  }, [filters, page])

  useEffect(() => {
    fetchExams()
  }, [fetchExams])

  useEffect(() => {
    getCatalogSubjectsForBrowse().then(setSubjects)
  }, [])

  const handlePreview = async (examId: string) => {
    setLoadingPreview(true)
    setPreviewOpen(true)
    try {
      const detail = await getCatalogExamDetail(examId)
      setPreviewExam(detail)
    } finally {
      setLoadingPreview(false)
    }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="text-muted-foreground absolute start-3 top-2.5 size-4" />
          <Input
            placeholder="Search catalog exams..."
            className="ps-9"
            onChange={(e) => {
              setPage(0)
              setFilters((f) => ({ ...f, search: e.target.value || undefined }))
            }}
          />
        </div>

        <Select
          onValueChange={(v) => {
            setPage(0)
            setFilters((f) => ({
              ...f,
              catalogSubjectId: v === "all" ? undefined : v,
            }))
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => {
            setPage(0)
            setFilters((f) => ({
              ...f,
              examType: v === "all" ? undefined : v,
            }))
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Exam type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="midterm">Midterm</SelectItem>
            <SelectItem value="chapter_test">Chapter Test</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Exam Cards Grid */}
      {isPending && exams.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : exams.length === 0 ? (
        <div className="text-muted-foreground py-12 text-center">
          No catalog exams found
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <Card key={exam.id} className="relative">
              {exam.isAdopted && (
                <div className="absolute end-3 top-3">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    <Check className="me-1 size-3" />
                    Adopted
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-base">
                  {exam.title}
                </CardTitle>
                <CardDescription className="line-clamp-1">
                  {exam.catalogSubjectName}
                  {exam.catalogChapterName && ` / ${exam.catalogChapterName}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    className={`text-xs ${EXAM_TYPE_COLORS[exam.examType] ?? ""}`}
                  >
                    {EXAM_TYPE_LABELS[exam.examType] ?? exam.examType}
                  </Badge>
                  {exam.variantLabel && (
                    <Badge variant="outline" className="text-xs">
                      {exam.variantLabel}
                    </Badge>
                  )}
                </div>

                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  {exam.durationMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {exam.durationMinutes}min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FileText className="size-3" />
                    {exam.questionCount} Q
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3" />
                    {exam.usageCount} used
                  </span>
                </div>

                {exam.totalMarks && (
                  <p className="text-muted-foreground text-xs">
                    {exam.totalMarks} marks
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handlePreview(exam.id)}
                  >
                    <Eye className="me-1 size-4" />
                    Preview
                  </Button>
                  {!exam.isAdopted && (
                    <Button size="sm" className="flex-1">
                      <Download className="me-1 size-4" />
                      Adopt
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">{total} exams total</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {loadingPreview ? "Loading..." : previewExam?.title}
            </DialogTitle>
            <DialogDescription>
              {previewExam?.catalogSubjectName}
              {previewExam?.catalogChapterName &&
                ` / ${previewExam.catalogChapterName}`}
            </DialogDescription>
          </DialogHeader>

          {loadingPreview ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : previewExam ? (
            <div className="space-y-4">
              {/* Exam Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge
                    className={EXAM_TYPE_COLORS[previewExam.examType] ?? ""}
                  >
                    {EXAM_TYPE_LABELS[previewExam.examType] ??
                      previewExam.examType}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p>{previewExam.durationMinutes ?? "-"} minutes</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Marks</p>
                  <p>
                    {previewExam.totalMarks ?? "-"} (pass:{" "}
                    {previewExam.passingMarks ?? "-"})
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Questions</p>
                  <p>{previewExam.totalQuestions ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Usage</p>
                  <p>{previewExam.usageCount} schools</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Score</p>
                  <p>{previewExam.averageScore}%</p>
                </div>
              </div>

              {previewExam.variantCount > 0 && (
                <p className="text-muted-foreground text-sm">
                  {previewExam.variantCount} variant(s) available
                </p>
              )}

              {/* Sample Questions */}
              {previewExam.sampleQuestions.length > 0 && (
                <div>
                  <h4 className="mb-2 font-medium">
                    Sample Questions (first {previewExam.sampleQuestions.length}
                    )
                  </h4>
                  <div className="space-y-2">
                    {previewExam.sampleQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="bg-muted/50 rounded-md p-3 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground font-mono">
                            {q.order}.
                          </span>
                          <div className="flex-1">
                            <p className="line-clamp-2">{q.questionText}</p>
                            <div className="mt-1 flex gap-2">
                              <Badge variant="outline" className="text-xs">
                                {q.questionType}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {q.difficulty}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                {q.points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adopt CTA */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                  Close
                </Button>
                {!previewExam.isAdopted && (
                  <Button>
                    <Download className="me-1 size-4" />
                    Adopt This Exam
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
