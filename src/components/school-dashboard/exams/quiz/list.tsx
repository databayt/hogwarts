"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Play,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useDictionary,
  useDictionaryFallback,
} from "@/components/internationalization/use-dictionary"

import type { QuizItem, QuizQuestionStats, QuizSubjectFilter } from "./types"

interface QuizListProps {
  quizzes: QuizItem[]
  subjects: QuizSubjectFilter[]
  questionStats: QuizQuestionStats[]
  page: number
  pageCount: number
  total: number
  pageSize: number
  subjectId: string
  type: string
  catalogMode: boolean
  canBrowseCatalog: boolean
}

const ALL = "all"
const CATALOG = "__catalog"

export function QuizList({
  quizzes,
  subjects,
  questionStats,
  page,
  pageCount,
  total,
  pageSize,
  subjectId,
  type,
  catalogMode,
  canBrowseCatalog,
}: QuizListProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.quizUi
  // New keys live in the `exams` namespace (not in the TS types yet)
  const x = (useDictionaryFallback(dictionary) as any)?.exams?.quiz ?? {}
  // The question bank's own difficulty labels — same source ai-generate-content.tsx
  // uses — so "byDifficulty" doesn't print raw EASY/MEDIUM/HARD enum keys.
  const cfg = dictionary?.school?.exams?.qbankUi?.config
  const difficultyLabels: Record<string, string> = {
    EASY: cfg?.difficulty?.easy ?? "",
    MEDIUM: cfg?.difficulty?.medium ?? "",
    HARD: cfg?.difficulty?.hard ?? "",
  }

  // Filters and the page live in the URL: the server returns one page at a time
  const router = useRouter()
  const pathname = usePathname()
  const current = useSearchParams()
  const [pending, startTransition] = useTransition()

  const navigate = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(current.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    const qs = next.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }

  const onSubject = (value: string) => {
    if (value === CATALOG)
      navigate({ scope: "catalog", subject: null, page: null })
    else if (value === ALL) navigate({ scope: null, subject: null, page: null })
    else navigate({ subject: value, page: null })
  }
  const subjectValue = subjectId || (catalogMode ? CATALOG : ALL)
  const typeValue = type || ALL

  const filtered = quizzes
  const filteredStats = questionStats
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = (page - 1) * pageSize + quizzes.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={subjectValue} onValueChange={onSubject}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t?.allSubjects ?? ""} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>
              {catalogMode ? (x.mySubjects ?? "") : (t?.allSubjects ?? "")}
            </SelectItem>
            {canBrowseCatalog && (
              <SelectItem value={CATALOG}>{x.allCatalog ?? ""}</SelectItem>
            )}
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs
          value={typeValue}
          onValueChange={(v) =>
            navigate({ type: v === ALL ? null : v, page: null })
          }
          className="max-w-full"
        >
          <TabsList className="max-w-full overflow-x-auto">
            <TabsTrigger value="all">{t?.tabs?.all ?? ""}</TabsTrigger>
            <TabsTrigger value="quiz">{t?.tabs?.quiz ?? ""}</TabsTrigger>
            <TabsTrigger value="diagnostic">
              {t?.tabs?.diagnostic ?? ""}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card className="max-md:bg-muted max-md:border-0">
          <CardContent className="flex min-h-[200px] items-center justify-center">
            <p className="text-muted-foreground">{t?.noQuizzes ?? ""}</p>
          </CardContent>
        </Card>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 aria-busy:opacity-60 max-md:gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy={pending}
        >
          {filtered.map((quiz) => (
            <Card key={quiz.id} className="max-md:bg-muted max-md:border-0">
              <CardHeader className="pb-3 max-md:p-4 max-md:pb-2">
                <div className="space-y-1">
                  <CardTitle className="line-clamp-2 text-base break-words max-md:text-sm max-md:leading-5">
                    {quiz.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      style={
                        quiz.subjectColor
                          ? {
                              backgroundColor: `${quiz.subjectColor}20`,
                              color: quiz.subjectColor,
                              borderColor: `${quiz.subjectColor}40`,
                            }
                          : undefined
                      }
                    >
                      {quiz.name}
                    </Badge>
                    <Badge variant="outline">
                      {t?.tabs?.[quiz.examType as keyof typeof t.tabs] ??
                        quiz.examType}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-md:px-4 max-md:pb-4">
                {(quiz.chapterName || quiz.lessonName) && (
                  <p className="text-muted-foreground mb-3 line-clamp-1 text-sm max-md:mb-2 max-md:text-xs">
                    {[quiz.chapterName, quiz.lessonName]
                      .filter(Boolean)
                      .join(" → ")}
                  </p>
                )}
                <div className="text-muted-foreground grid grid-cols-1 gap-2 text-sm max-md:gap-1 max-md:text-xs min-[480px]:grid-cols-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {quiz.durationMinutes != null
                        ? (x.minutes ?? "").replace(
                            "{count}",
                            String(quiz.durationMinutes)
                          )
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>
                      {quiz.totalQuestions != null
                        ? `${quiz.totalQuestions} ${t?.questions ?? ""}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    <span>
                      {quiz.totalMarks != null
                        ? (x.points ?? "").replace(
                            "{count}",
                            String(quiz.totalMarks)
                          )
                        : "—"}
                    </span>
                  </div>
                </div>
                {quiz.usageCount > 0 && (
                  <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                    <BookOpen className="h-3 w-3" />
                    <span>
                      {(t?.usageCount ?? "").replace(
                        "{count}",
                        String(quiz.usageCount)
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 max-md:px-4 max-md:pb-4">
                <Button
                  asChild
                  size="sm"
                  className="min-h-11 w-full gap-1 max-md:rounded-full md:min-h-9"
                >
                  <Link href={`mock/${quiz.id}/take`}>
                    <Play className="h-3.5 w-3.5" />
                    {t?.startQuiz ?? ""}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {pageCount > 1 && (
        <nav
          aria-label={x.pager?.label ?? ""}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
        >
          <p className="text-muted-foreground text-sm">
            {(x.pager?.showing ?? "")
              .replace("{from}", String(from))
              .replace("{to}", String(to))
              .replace("{total}", String(total))}
          </p>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 flex-1 gap-1 sm:min-h-9 sm:flex-none"
              disabled={page <= 1 || pending}
              onClick={() =>
                navigate({ page: page - 1 > 1 ? String(page - 1) : null })
              }
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {x.pager?.previous ?? ""}
            </Button>
            <span className="text-muted-foreground px-2 text-sm tabular-nums">
              {(x.pager?.pageOf ?? "")
                .replace("{page}", String(page))
                .replace("{pages}", String(pageCount))}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 flex-1 gap-1 sm:min-h-9 sm:flex-none"
              disabled={page >= pageCount || pending}
              onClick={() => navigate({ page: String(page + 1) })}
            >
              {x.pager?.next ?? ""}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </nav>
      )}

      {filteredStats.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t?.questionPool ?? ""}</h3>
          <div className="grid grid-cols-1 gap-3 max-md:gap-2 sm:grid-cols-2">
            {filteredStats.map((stat) => {
              const maxQuestions = Math.max(
                ...filteredStats.map((s) => s.totalQuestions)
              )
              return (
                <Card
                  key={stat.catalogSubjectId}
                  className="max-md:bg-muted max-md:border-0"
                >
                  <CardContent className="pt-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2">
                      <span className="text-sm font-medium">{stat.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {stat.totalQuestions} {t?.questions ?? ""}
                      </span>
                    </div>
                    <Progress
                      value={(stat.totalQuestions / maxQuestions) * 100}
                      className="h-2"
                    />
                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs">
                      {Object.entries(stat.byDifficulty).map(
                        ([level, count]) => (
                          <span key={level}>
                            {difficultyLabels[level] ?? level}: {count}
                          </span>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
