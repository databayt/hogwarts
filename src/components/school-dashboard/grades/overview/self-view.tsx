// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Download } from "lucide-react"

import { displayName } from "@/lib/name-utils"
import { schoolNameDisplay } from "@/lib/school-name-format"
import { Ltr } from "@/components/atom/ltr"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/school-dashboard/school/configuration/ui/settings-group"
import { getLabels } from "@/components/translation/person"

import { getSelfOverview, type OverviewTerm } from "../lib/overview"
import { termTitle } from "./term-pills"

/**
 * What a student — or a guardian, per child — keeps coming back for: how
 * each subject is going this term, and the report cards and certificates
 * the school has published for them to download.
 */
export async function GradesSelfView({
  schoolId,
  studentIds,
  term,
  dictionary,
  lang,
  showNames = false,
}: {
  /** A guardian always sees whose results these are, even with one child. */
  showNames?: boolean
  schoolId: string
  studentIds: string[]
  term: OverviewTerm | null
  dictionary: Dictionary
  lang: Locale
}) {
  const t = dictionary.school.grades.overview
  const s = t.self
  const [children, nameDisplay] = await Promise.all([
    getSelfOverview(schoolId, studentIds, term),
    schoolNameDisplay(schoolId),
  ])
  if (children.length === 0) return null

  const labels = await getLabels(
    children.flatMap((c) => [
      ...c.subjects.map((x) => x.name),
      ...c.certificates.map((x) => x.title),
    ]),
    lang,
    schoolId
  )
  const label = (v: string) => labels.get(v) ?? v
  const nf = new Intl.NumberFormat(lang === "ar" ? "ar" : "en")
  const df = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
    dateStyle: "medium",
  })

  return (
    <div className="space-y-12">
      {children.map((child) => (
        <section key={child.student.id} className="space-y-6">
          {(showNames || children.length > 1) && (
            <h2 className="text-2xl font-semibold tracking-tight">
              <bdi dir="auto">{displayName(child.student, nameDisplay)}</bdi>
            </h2>
          )}

          <SettingsGroup
            title={term ? `${s.subjects} · ${termTitle(term, t)}` : s.subjects}
          >
            {child.subjects.length === 0 ? (
              <SettingsRow label={s.noGrades} />
            ) : (
              child.subjects.map((subject) => (
                <SettingsRow
                  key={subject.id}
                  label={label(subject.name)}
                  description={s.entries.replace(
                    "{count}",
                    nf.format(subject.count)
                  )}
                >
                  <div className="flex w-36 items-center gap-3 sm:w-48">
                    <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.min(100, subject.average)}%` }}
                      />
                    </div>
                    <span className="w-12 text-end text-sm font-medium">
                      <Ltr>{Math.round(subject.average)}%</Ltr>
                    </span>
                  </div>
                </SettingsRow>
              ))
            )}
          </SettingsGroup>

          <div className="grid gap-6 lg:grid-cols-2">
            <SettingsGroup title={s.reportCards}>
              {child.reportCards.length === 0 ? (
                <SettingsRow label={s.noReportCards} />
              ) : (
                child.reportCards.map((rc) => (
                  <SettingsRow
                    key={rc.id}
                    label={
                      rc.termNumber != null
                        ? termTitle(
                            {
                              id: rc.id,
                              termNumber: rc.termNumber,
                              yearName: rc.yearName,
                              startDate: new Date(0),
                              endDate: new Date(0),
                            },
                            t
                          )
                        : s.reportCards
                    }
                  >
                    {rc.grade && (
                      <span className="text-sm font-medium">
                        <Ltr>{rc.grade}</Ltr>
                      </span>
                    )}
                    {rc.pdfUrl && (
                      <a
                        href={rc.pdfUrl}
                        download
                        className="text-primary inline-flex items-center gap-1 text-sm"
                      >
                        <Download className="size-4" />
                        {s.download}
                      </a>
                    )}
                  </SettingsRow>
                ))
              )}
            </SettingsGroup>

            <SettingsGroup title={s.certificates}>
              {child.certificates.length === 0 ? (
                <SettingsRow label={s.noCertificates} />
              ) : (
                child.certificates.map((c) => (
                  <SettingsRow
                    key={c.id}
                    label={label(c.title)}
                    description={df.format(c.issuedAt)}
                  >
                    {c.pdfUrl && (
                      <a
                        href={c.pdfUrl}
                        download
                        className="text-primary inline-flex items-center gap-1 text-sm"
                      >
                        <Download className="size-4" />
                        {s.download}
                      </a>
                    )}
                  </SettingsRow>
                ))
              )}
            </SettingsGroup>
          </div>
        </section>
      ))}
    </div>
  )
}
