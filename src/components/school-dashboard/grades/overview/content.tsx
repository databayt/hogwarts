// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import {
  Award,
  ChevronRight,
  ClipboardCheck,
  FileText,
  Inbox,
} from "lucide-react"

import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { cn } from "@/lib/utils"
import { Ltr } from "@/components/atom/ltr"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/school-dashboard/school/configuration/ui/settings-group"

import {
  AT_RISK_BELOW,
  getGradesOverview,
  type OverviewTerm,
} from "../lib/overview"
import { CollectButton } from "./collect-button"
import { TermPills, termTitle } from "./term-pills"

const GRADE_ORDER = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
]

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template
  )

/**
 * The grades hub for staff: one headline number, the term's workflow as four
 * steps — collect, review, report cards, certificates — each with its live
 * count and one action, then the two insights worth acting on.
 */
export async function GradesOverviewContent({
  schoolId,
  terms,
  term,
  dictionary,
  lang,
}: {
  schoolId: string
  terms: OverviewTerm[]
  term: OverviewTerm | null
  dictionary: Dictionary
  lang: Locale
}) {
  const t = dictionary.school.grades.overview

  if (!term) {
    return <p className="text-muted-foreground py-16 text-center">{t.noTerm}</p>
  }

  const [data, nameDisplay] = await Promise.all([
    getGradesOverview(schoolId, term),
    schoolNameDisplay(schoolId),
  ])
  const nf = new Intl.NumberFormat(lang === "ar" ? "ar" : "en")
  const n = (v: number) => nf.format(v)
  const base = `/${lang}/grades`
  const termQuery = `?termId=${term.id}`

  const pending = data.collect.examsAwaiting + data.collect.submissionsToGrade
  type Line = string | { text: string; href: string }
  const steps: Array<{
    icon: React.ReactNode
    title: string
    lines: Line[]
    attention: boolean
    cta: string
    href: string
    extra?: React.ReactNode
  }> = [
    {
      icon: <Inbox />,
      title: t.collect.title,
      // Exams are marked under /exams/mark, homework under /assignments —
      // each pending count links to where it is cleared.
      lines:
        pending === 0
          ? [data.results === 0 ? t.noGrades : t.collect.done]
          : [
              {
                text: fill(t.collect.examsAwaiting, {
                  count: n(data.collect.examsAwaiting),
                }),
                href: `/${lang}/exams/mark`,
              },
              {
                text: fill(t.collect.submissionsToGrade, {
                  count: n(data.collect.submissionsToGrade),
                }),
                href: `/${lang}/assignments`,
              },
            ],
      attention: pending > 0,
      extra: <CollectButton />,
      cta: t.collect.cta,
      href:
        data.collect.examsAwaiting === 0 && data.collect.submissionsToGrade > 0
          ? `/${lang}/assignments`
          : `/${lang}/exams/mark`,
    },
    {
      icon: <ClipboardCheck />,
      title: t.review.title,
      lines: [
        fill(t.review.graded, {
          graded: n(data.gradedStudents),
          total: n(data.activeStudents),
        }),
        fill(t.review.atRisk, { count: n(data.atRisk.count) }),
      ],
      attention: data.atRisk.count > 0,
      cta: t.review.cta,
      href: `${base}/book`,
    },
    {
      icon: <FileText />,
      title: t.reportCards.title,
      lines:
        data.reportCards.total === 0
          ? [t.reportCards.none]
          : [
              fill(t.reportCards.status, {
                published: n(data.reportCards.published),
                drafts: n(data.reportCards.drafts),
              }),
            ],
      attention: data.reportCards.drafts > 0,
      cta: t.reportCards.cta,
      href: `${base}/reports${termQuery}`,
    },
    {
      icon: <Award />,
      title: t.certificates.title,
      lines: [fill(t.certificates.issued, { count: n(data.certificates) })],
      attention: false,
      cta: t.certificates.cta,
      href: `${base}/certificates`,
    },
  ]

  const maxBucket = Math.max(1, ...Object.values(data.distribution))
  const grades = GRADE_ORDER.filter((g) => data.distribution[g])
  const otherGrades = Object.keys(data.distribution).filter(
    (g) => !GRADE_ORDER.includes(g)
  )

  return (
    <div className="space-y-10">
      {/* Headline */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{termTitle(term, t)}</p>
          <p className="text-5xl font-semibold tracking-tight">
            {data.average == null ? (
              "—"
            ) : (
              <Ltr>{Math.round(data.average)}%</Ltr>
            )}
          </p>
          <p className="text-muted-foreground text-sm">
            {t.averageLabel} ·{" "}
            {fill(t.resultsCount, { count: n(data.results) })}
          </p>
        </div>
        <TermPills terms={terms} currentId={term.id} lang={lang} t={t} />
      </header>

      {/* Workflow */}
      <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, i) => (
          <li
            key={step.title}
            className="bg-muted/40 flex min-h-52 flex-col gap-4 rounded-3xl p-6"
          >
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>{fill(t.step, { n: n(i + 1) })}</span>
              <span
                className={cn(
                  "flex size-9 items-center justify-center rounded-full [&_svg]:size-4",
                  step.attention
                    ? "bg-primary text-primary-foreground"
                    : "bg-background"
                )}
              >
                {step.icon}
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{step.title}</h3>
              {step.lines.map((line) =>
                typeof line === "string" ? (
                  <p key={line} className="text-muted-foreground text-sm">
                    {line}
                  </p>
                ) : (
                  <Link
                    key={line.text}
                    href={line.href}
                    className="text-muted-foreground hover:text-foreground block text-sm hover:underline"
                  >
                    {line.text}
                  </Link>
                )
              )}
            </div>
            {step.extra}
            <Link
              href={step.href}
              className="text-primary mt-auto inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {step.cta}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </Link>
          </li>
        ))}
      </ol>

      {/* Insights */}
      <div className="grid gap-8 lg:grid-cols-2">
        <SettingsGroup title={t.distribution}>
          {grades.length + otherGrades.length === 0 ? (
            <SettingsRow label={t.noGrades} />
          ) : (
            [...grades, ...otherGrades].map((g) => (
              <SettingsRow key={g} label={<Ltr>{g}</Ltr>}>
                <div className="flex w-40 items-center gap-3 sm:w-56">
                  <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${(data.distribution[g] / maxBucket) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-muted-foreground w-10 text-end text-sm tabular-nums">
                    {n(data.distribution[g])}
                  </span>
                </div>
              </SettingsRow>
            ))
          )}
        </SettingsGroup>

        <SettingsGroup
          title={t.needsAttention}
          footer={fill(t.needsAttentionHint, { threshold: AT_RISK_BELOW })}
        >
          {data.atRisk.students.length === 0 ? (
            <SettingsRow
              label={fill(t.needsAttentionEmpty, {
                threshold: AT_RISK_BELOW,
              })}
            />
          ) : (
            data.atRisk.students.map((s) => (
              <Link
                key={s.id}
                href={`${base}/book?studentId=${s.id}`}
                className="hover:bg-muted/50 block"
              >
                <SettingsRow
                  label={<bdi dir="auto">{displayName(s, nameDisplay)}</bdi>}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-destructive text-sm font-medium">
                      <Ltr>{Math.round(s.average)}%</Ltr>
                    </span>
                    <ChevronRight className="text-muted-foreground size-4 rtl:rotate-180" />
                  </span>
                </SettingsRow>
              </Link>
            ))
          )}
        </SettingsGroup>
      </div>
    </div>
  )
}
