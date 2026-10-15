"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * QR code check-in: staff put a section's code on the board and students
 * scan it from the mobile app. The web page is the display side only — a
 * scan resolves the signed-in user to their student record, and only staff
 * open this page, so a web "Scan" tab could never succeed.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { QrCode } from "lucide-react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getAttendanceList, getSectionsForSelection } from "../actions"
import { localCalendarDay } from "../core/local-date"
import { AttendanceSectionNav } from "../ui/section-nav"
import { QRGenerator } from "./qr-generator"

interface Props {
  locale?: string
}

interface Scan {
  studentId: string
  name: string
  at?: Date
}

export default function QRCodeAttendanceContent({ locale = "ar" }: Props) {
  const { dictionary } = useDictionary()
  const t = (dictionary?.attendanceTake?.qr ?? {}) as Record<string, string>
  const [sections, setSections] = useState<
    Array<{ id: string; name: string; gradeName: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [sectionId, setSectionId] = useState<string>("")
  const [scans, setScans] = useState<Scan[]>([])

  useEffect(() => {
    let alive = true
    getSectionsForSelection()
      .then((res) => {
        if (!alive || !res.success || !res.data?.sections) return
        setSections(res.data.sections)
        setSectionId((cur) => cur || res.data!.sections[0]?.id || "")
      })
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  // Who has scanned today — refreshed every 10 seconds while the code is up.
  const loadScans = useCallback(async () => {
    if (!sectionId) return
    const res = await getAttendanceList({
      sectionId,
      date: localCalendarDay(),
      lang: locale,
    })
    if (!res.success || !res.data) return
    setScans(
      res.data.rows
        .filter((r) => r.method === "QR_CODE")
        .map((r) => ({
          studentId: r.studentId,
          name: r.name,
          at: r.checkInTime,
        }))
        .sort(
          (a, b) =>
            new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime()
        )
    )
  }, [sectionId, locale])

  useEffect(() => {
    const first = window.setTimeout(() => void loadScans(), 0)
    const id = window.setInterval(() => void loadScans(), 10_000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [loadScans])

  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
        { hour: "numeric", minute: "2-digit" }
      ),
    [locale]
  )
  const num = new Intl.NumberFormat(
    locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"
  )
  const section = sections.find((s) => s.id === sectionId)

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="take" />

      {loading ? null : sections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <QrCode className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-sm">
            {t.noSections ?? "You have no sections to show a code for."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={sectionId}
              onValueChange={(id) => {
                setScans([])
                setSectionId(id)
              }}
            >
              <SelectTrigger
                className="h-9 w-full rounded-full sm:w-64"
                aria-label={t.section ?? "Section"}
              >
                <SelectValue placeholder={t.section ?? "Section"} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-sm">
              {t.hint ?? "Students scan it from the school app."}
            </p>
          </div>

          {sectionId ? (
            <QRGenerator
              key={sectionId}
              sectionId={sectionId}
              sectionName={section?.name ?? ""}
              t={t}
              lang={locale}
            />
          ) : null}

          <section className="space-y-2">
            <h3 className="text-muted-foreground px-4 text-xs font-medium">
              {(t.scanned ?? "Checked in by QR today · {n}").replace(
                "{n}",
                num.format(scans.length)
              )}
            </h3>
            {scans.length === 0 ? (
              <p className="bg-card text-muted-foreground rounded-2xl border px-4 py-6 text-center text-sm">
                {t.noScans ?? "No one has scanned yet."}
              </p>
            ) : (
              <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
                {scans.map((s) => (
                  <li
                    key={s.studentId}
                    className="flex min-h-12 items-center gap-3 px-4 py-2.5"
                  >
                    <span className="flex-1 truncate text-sm font-medium">
                      {s.name}
                    </span>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {s.at ? time.format(new Date(s.at)) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
