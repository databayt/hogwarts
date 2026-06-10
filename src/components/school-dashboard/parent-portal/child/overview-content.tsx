// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { notFound } from "next/navigation"
import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getChildOverview } from "../actions"

interface Props {
  studentId: string
  lang: Locale
  dictionary?: Dictionary
}

export async function ChildOverviewContent({
  studentId,
  lang,
  dictionary,
}: Props) {
  const d = dictionary?.parentPortal?.childOverview
  const data = await getChildOverview({ studentId })

  if (!data.student) {
    notFound()
  }

  const cards: Array<{ label: string; value: string }> = [
    {
      label: d?.name ?? "Name",
      value: data.student.name,
    },
    {
      label: d?.averageScore ?? "Average score",
      value: `${data.averageScore}%`,
    },
    {
      label: d?.attendance ?? "Attendance",
      value: `${data.attendance.percentage}%`,
    },
    {
      label: d?.daysPresent ?? "Days present",
      value: `${data.attendance.presentDays} / ${data.attendance.totalDays}`,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{data.student.name}</h2>
        {/* Per-child "Message teacher" CTA. Deep-links to /messages;
            GUARDIAN role-dispatch already filters to the teachers of
            this guardian's children. */}
        <Button asChild variant="outline" size="sm">
          <Link href={`/${lang}/messages`}>
            <MessageCircle className="me-1 h-4 w-4" />
            {d?.messageTeacher ?? "Message teacher"}
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardDescription>{c.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{d?.recentExamResults ?? "Recent exam results"}</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentExams.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {d?.noResultsYet ?? "No results yet"}
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {data.recentExams.map((e, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{e.examTitle}</span>
                  <span className="text-muted-foreground">
                    {e.name} · {e.percentage.toFixed(1)}%
                    {e.grade ? ` · ${e.grade}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
