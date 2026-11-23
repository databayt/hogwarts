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
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import {
  adoptQuestion,
  browseQuestions,
  getSubjectsForBrowse,
  type CatalogBrowseFilters,
  type QuestionRow,
} from "./actions/catalog-browse"
import { getQuestionTypeLabels } from "./config"
import { fmt, qbankT } from "./t"

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HARD: "bg-red-100 text-red-800",
}

export function CatalogBrowseTab() {
  const dictionary = useDictionaryFallback<any>()
  const qt = qbankT(dictionary)
  const t = qt.catalog as Record<string, any> | undefined
  const exams = dictionary?.school?.exams
  const difficultyLabel = (level: string) =>
    ({
      EASY: t?.difficultyEasy,
      MEDIUM: t?.difficultyMedium,
      HARD: t?.difficultyHard,
    })[level] ?? level
  const typeLabels = getQuestionTypeLabels(qt)
  const typeLabel = (type: string) => typeLabels[type] || type
  const [questions, setQuestions] = useState<QuestionRow[]>([])
  const [total, setTotal] = useState(0)
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [filters, setFilters] = useState<CatalogBrowseFilters>({})
  const [page, setPage] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [adoptingId, setAdoptingId] = useState<string | null>(null)

  const fetchQuestions = useCallback(() => {
    startTransition(async () => {
      const result = await browseQuestions({ ...filters, page })
      setQuestions(result.questions)
      setTotal(result.total)
    })
  }, [filters, page])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    getSubjectsForBrowse().then(setSubjects)
  }, [])

  const handleAdopt = async (questionId: string) => {
    setAdoptingId(questionId)
    try {
      const result = await adoptQuestion(questionId)
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
        <div className="relative min-w-[200px] flex-1 max-md:basis-full">
          <Search className="text-muted-foreground absolute start-3 top-2.5 size-4" />
          <Input
            placeholder={t?.searchPlaceholder ?? ""}
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
          <SelectTrigger className="w-[200px] max-md:w-[calc(50%-0.375rem)]">
            <SelectValue placeholder={t?.allSubjects ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t?.allSubjects ?? ""}</SelectItem>
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
          <SelectTrigger className="w-[140px] max-md:w-[calc(50%-0.375rem)]">
            <SelectValue placeholder={t?.difficulty ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t?.difficultyAll ?? ""}</SelectItem>
            <SelectItem value="EASY">{t?.difficultyEasy ?? ""}</SelectItem>
            <SelectItem value="MEDIUM">{t?.difficultyMedium ?? ""}</SelectItem>
            <SelectItem value="HARD">{t?.difficultyHard ?? ""}</SelectItem>
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
          <SelectTrigger className="w-[140px] max-md:w-[calc(50%-0.375rem)]">
            <SelectValue placeholder={t?.type ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t?.typeAll ?? ""}</SelectItem>
            <SelectItem value="MULTIPLE_CHOICE">{t?.typeMCQ ?? ""}</SelectItem>
            <SelectItem value="TRUE_FALSE">{t?.typeTrueFalse ?? ""}</SelectItem>
            <SelectItem value="SHORT_ANSWER">
              {t?.typeShortAnswer ?? ""}
            </SelectItem>
            <SelectItem value="ESSAY">{t?.typeEssay ?? ""}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">
                {t?.headers?.question ?? ""}
              </TableHead>
              <TableHead>{t?.headers?.subject ?? ""}</TableHead>
              <TableHead>{t?.headers?.type ?? ""}</TableHead>
              <TableHead>{t?.headers?.difficulty ?? ""}</TableHead>
              <TableHead className="text-center">
                {t?.headers?.used ?? ""}
              </TableHead>
              <TableHead className="text-end">
                {t?.headers?.action ?? ""}
              </TableHead>
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
                  {t?.noResults ?? ""}
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
                    {q.catalogSubjectName ?? ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {typeLabel(q.questionType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${DIFFICULTY_COLORS[q.difficulty] ?? ""}`}
                    >
                      {difficultyLabel(q.difficulty)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-center text-sm">
                    {q.usageCount}
                  </TableCell>
                  <TableCell className="text-end">
                    {q.isAdopted ? (
                      <Button size="sm" variant="ghost" disabled>
                        <Check className="me-1 size-4" />
                        {t?.adopted ?? ""}
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
                        {t?.adopt ?? ""}
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
            {fmt(t?.totalQuestions, { count: total })}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              {exams?.previous ?? ""}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              {exams?.next ?? ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
