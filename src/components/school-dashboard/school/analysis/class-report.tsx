"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Check, Copy } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { reasonChip, reasonTone } from "@/components/school-dashboard/school/readiness/labels"
import type { ReadinessReason } from "@/components/school-dashboard/school/readiness/rules"
import {
  allClassesReportText,
  classReportText,
  type ClassReportInput,
} from "@/components/school-dashboard/school/readiness/whatsapp-text"

export type ClassReportCard = ClassReportInput & { sectionId: string }

export type ClassReportStrings = {
  title: string
  description: string
  date: string
  copyCard: string
  copyAll: string
  copied: string
  supervisor: string
  noSupervisor: string
  canCover: string
  cannotCover: string
  teachers: string
  students: string
  noClasses: string
  noTeacher: string
}

const TONE: Record<string, string> = {
  ok: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  bad: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
}

function Chips({
  reasons,
  lang,
}: {
  reasons: ReadinessReason[]
  lang: string
}) {
  if (reasons.length === 0) return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {reasons.map((r) => (
        <span
          key={r}
          className={`rounded-full px-2 py-0.5 text-xs ${TONE[reasonTone(r)]}`}
        >
          {reasonChip(r, lang)}
        </span>
      ))}
    </span>
  )
}

function CopyButton({
  text,
  label,
  done,
  variant = "outline",
}: {
  text: string
  label: string
  done: string
  variant?: "outline" | "default"
}) {
  const [copied, setCopied] = React.useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked (insecure context) — nothing to fall back on.
    }
  }
  return (
    <Button type="button" size="sm" variant={variant} onClick={copy}>
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? done : label}
    </Button>
  )
}

export function ClassReport({
  cards,
  date,
  lang,
  strings: t,
}: {
  cards: ClassReportCard[]
  date: string
  lang: string
  strings: ClassReportStrings
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-muted-foreground text-sm" htmlFor="class-report-date">
            {t.date}
          </label>
          <Input
            id="class-report-date"
            type="date"
            dir="ltr"
            value={date}
            className="w-auto"
            onChange={(e) => {
              if (e.target.value) router.push(`${pathname}?date=${e.target.value}`)
            }}
          />
          {cards.length > 0 && (
            <CopyButton
              text={allClassesReportText(cards, lang)}
              label={t.copyAll}
              done={t.copied}
              variant="default"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {cards.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t.noClasses}
          </p>
        )}
        {cards.map((card) => (
          <div key={card.sectionId} className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">{card.className}</h3>
              <CopyButton
                text={classReportText(card, lang)}
                label={t.copyCard}
                done={t.copied}
              />
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">{t.supervisor}:</span>
                {card.supervisor ? (
                  <>
                    <span className="font-medium">{card.supervisor.name}</span>
                    <Chips reasons={card.supervisor.reasons} lang={lang} />
                  </>
                ) : (
                  <span className="text-muted-foreground">{t.noSupervisor}</span>
                )}
              </div>
              {card.supervisor && (
                <Badge variant={card.supervisor.canCover ? "secondary" : "outline"} className="h-auto whitespace-normal">
                  {card.supervisor.canCover ? t.canCover : t.cannotCover}
                </Badge>
              )}
            </div>

            {card.classes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-medium">
                  {t.teachers}
                </p>
                <ul className="space-y-2">
                  {card.classes.map((c, i) => (
                    <li
                      key={`${c.start}-${i}`}
                      className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span className="shrink-0">
                        <span dir="ltr" className="text-muted-foreground tabular-nums">
                          {c.start}
                        </span>{" "}
                        {c.subject}
                        {" — "}
                        <span className="font-medium">
                          {c.teacherName ?? t.noTeacher}
                        </span>
                      </span>
                      <Chips reasons={c.reasons} lang={lang} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {card.students.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-medium">
                  {t.students}
                </p>
                <ul className="space-y-2">
                  {card.students.map((s, i) => (
                    <li
                      key={`${s.name}-${i}`}
                      className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span className="shrink-0 font-medium">{s.name}</span>
                      <Chips reasons={s.reasons} lang={lang} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
