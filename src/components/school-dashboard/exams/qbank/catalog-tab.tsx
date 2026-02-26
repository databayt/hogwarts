"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Check, Download, Loader2, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

import {
  adoptCatalogQuestion,
  browseCatalogQuestions,
  getCatalogSubjectsForBrowse,
  type CatalogBrowseFilters,
  type CatalogQuestionRow,
} from "./actions/catalog-browse"

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HARD: "bg-red-100 text-red-800",
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "MCQ",
  TRUE_FALSE: "T/F",
  SHORT_ANSWER: "Short",
  ESSAY: "Essay",
  FILL_BLANK: "Fill",
  MATCHING: "Match",
  ORDERING: "Order",
  MULTI_SELECT: "Multi",
}

export function CatalogBrowseTab() {
  const [questions, setQuestions] = useState<CatalogQuestionRow[]>([])
  const [total, setTotal] = useState(0)
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState<CatalogBrowseFilters>({})
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [adoptingId, setAdoptingId] = useState<string | null>(null)

  const fetchQuestions = useCallback(() => {
    startTransition(async () => {
      const result = await browseCatalogQuestions({ ...filters, page })
      setQuestions(result.questions)
      setTotal(result.total)
    })
  }, [filters, page])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    getCatalogSubjectsForBrowse().then(setSubjects)
  }, [])

  const handleAdopt = async (questionId: string) => {
    setAdoptingId(questionId)
    try {
      const result = await adoptCatalogQuestion(questionId)
      if (result.success) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, isAdopted: true } : q))
        )
      }
    } finally {
      setAdoptingId(null)
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
            placeholder="Search catalog questions..."
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
              difficulty: v === "all" ? undefined : v,
            }))
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="EASY">Easy</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HARD">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => {
            setPage(0)
            setFilters((f) => ({
              ...f,
              questionType: v === "all" ? undefined : v,
            }))
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="MULTIPLE_CHOICE">MCQ</SelectItem>
            <SelectItem value="TRUE_FALSE">True/False</SelectItem>
            <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
            <SelectItem value="ESSAY">Essay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Question</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-center">Used</TableHead>
              <TableHead className="text-end">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending && questions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <Loader2 className="text-muted-foreground mx-auto size-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : questions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center"
                >
                  No catalog questions found
                </TableCell>
              </TableRow>
            ) : (
              questions.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <p className="line-clamp-2 text-sm">{q.questionText}</p>
                    {q.tags.length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {q.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {q.catalogSubjectName ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {TYPE_LABELS[q.questionType] ?? q.questionType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}
                    >
                      {q.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center text-sm">
                    {q.usageCount}
                  </TableCell>
                  <TableCell className="text-end">
                    {q.isAdopted ? (
                      <Button size="sm" variant="ghost" disabled>
                        <Check className="me-1 size-4" />
                        Adopted
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdopt(q.id)}
                        disabled={adoptingId === q.id}
                      >
                        {adoptingId === q.id ? (
                          <Loader2 className="me-1 size-4 animate-spin" />
                        ) : (
                          <Download className="me-1 size-4" />
                        )}
                        Adopt
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {total} questions total
          </p>
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
    </div>
  )
}
