// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Badge } from "@/components/ui/badge"
import type { getDictionary } from "@/components/internationalization/dictionaries"

// Public question-bank view for /community/[slug]/qbank. Server component — the
// inline qbank type cards on the subject detail page only show COUNTS; this
// page lists the actual public questions grouped by type. Mirrors the catalog
// dictionary labels used by catalog-content-sections.tsx.

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

interface QuestionRow {
  id: string
  questionText: string
  questionType: string
  difficulty: string
  bloomLevel: string | null
}

interface Props {
  questions: QuestionRow[]
  subjectColor: string | null
  dictionary: Dictionary
}

const TYPE_ORDER = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "ESSAY",
  "FILL_BLANK",
  "MATCHING",
  "ORDERING",
  "MULTI_SELECT",
]

const TYPE_FALLBACK: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple Choice",
  TRUE_FALSE: "True/False",
  SHORT_ANSWER: "Short Answer",
  ESSAY: "Essay",
  FILL_BLANK: "Fill in Blank",
  MATCHING: "Matching",
  ORDERING: "Ordering",
  MULTI_SELECT: "Multi Select",
}

const DIFFICULTY_FALLBACK: Record<string, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
}

export function CommunityQBank({ questions, subjectColor, dictionary }: Props) {
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, unknown>
    | undefined
  const typeLabels = (cat?.questionTypes ?? {}) as Record<string, string>
  const diffLabels = (cat?.difficulty ?? {}) as Record<string, string>
  const qbankLabel = (cat?.qbank as string | undefined) || "Question Bank"
  const questionsLabel = (cat?.questions as string | undefined) || "questions"

  const accent = subjectColor ?? "#1e40af"

  const groups = new Map<string, QuestionRow[]>()
  for (const q of questions) {
    const arr = groups.get(q.questionType) ?? []
    arr.push(q)
    groups.set(q.questionType, arr)
  }
  const orderedTypes = [
    ...TYPE_ORDER.filter((t) => groups.has(t)),
    ...[...groups.keys()].filter((t) => !TYPE_ORDER.includes(t)),
  ]

  if (questions.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        0 {questionsLabel}
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold">{qbankLabel}</h2>
        <Badge variant="secondary" className="text-xs">
          {questions.length}
        </Badge>
      </div>

      {orderedTypes.map((type) => {
        const items = groups.get(type) ?? []
        const label = typeLabels[type] ?? TYPE_FALLBACK[type] ?? type
        return (
          <section key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-1.5 rounded-full"
                style={{ backgroundColor: accent }}
              />
              <h3 className="text-base font-semibold">{label}</h3>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
            <ol className="space-y-2">
              {items.map((q, i) => (
                <li
                  key={q.id}
                  className="bg-card flex items-start gap-3 rounded-lg border p-3"
                >
                  <span className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-snug">
                    {q.questionText}
                  </p>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {diffLabels[q.difficulty] ??
                      DIFFICULTY_FALLBACK[q.difficulty] ??
                      q.difficulty}
                  </Badge>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
