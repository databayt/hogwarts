// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { CalendarClock, ClipboardList } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { MyAssignment } from "./my-assignments"
import { StudentSubmissionCard } from "./submission-card"

interface Props {
  assignments: MyAssignment[]
  dictionary: Dictionary
  lang: string
}

/**
 * `AssessmentType` enum values (`FINAL_EXAM`, `LAB_REPORT`, …) as the
 * dictionary's camelCase keys (`finalExam`, `labReport`). A plain
 * `.toLowerCase()` left the underscore in place, so these two types never
 * matched a key and fell back to the raw enum string in both languages.
 */
function typeKey(type: string): string {
  return type
    .toLowerCase()
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
}

/**
 * The student's assignments, each with its hand-in card. Server component;
 * the card underneath is the client piece that submits (or queues offline).
 */
export function MyAssignmentsContent({ assignments, dictionary, lang }: Props) {
  const school = dictionary?.school as Record<string, any> | undefined
  const t = (school?.myAssignments ?? {}) as Record<string, string | undefined>
  const detail = (school?.assignments?.detail ?? {}) as Record<string, unknown>
  const types = (detail.types ?? {}) as Record<string, string | undefined>
  const now = Date.now()

  return (
    <div className="space-y-6">
      <header>
        <h1>{t.title ?? "My assignments"}</h1>
        <p className="text-muted-foreground">
          {t.description ??
            "Everything your classes have set, and what you handed in."}
        </p>
      </header>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground flex items-center gap-3 py-8">
            <ClipboardList className="h-5 w-5" aria-hidden />
            {t.empty ?? "No assignments yet."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-6">
          {assignments.map((a) => {
            const overdue =
              a.dueDate.getTime() < now && !a.submission?.submittedAt
            return (
              <li key={a.id} className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                      <span>{a.title}</span>
                      <Badge variant="outline">
                        {types[typeKey(a.type)] ?? a.type}
                      </Badge>
                      <span className="text-muted-foreground text-sm font-normal">
                        {a.className}
                      </span>
                      <span
                        className={
                          "ms-auto flex items-center gap-1 text-sm font-normal " +
                          (overdue
                            ? "text-destructive"
                            : "text-muted-foreground")
                        }
                      >
                        <CalendarClock className="h-4 w-4" aria-hidden />
                        {t.due ?? "Due"} {a.dueDate.toLocaleDateString(lang)}
                        {" · "}
                        {a.totalPoints} {t.points ?? "pts"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  {(a.description || a.instructions) && (
                    <CardContent className="space-y-2">
                      {a.description && (
                        <p className="whitespace-pre-wrap">{a.description}</p>
                      )}
                      {a.instructions && (
                        <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                          {a.instructions}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
                <StudentSubmissionCard
                  assignmentId={a.id}
                  existing={a.submission}
                  labels={detail}
                  locale={lang}
                />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
