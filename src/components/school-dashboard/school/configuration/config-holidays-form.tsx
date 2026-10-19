"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorToast } from "@/components/atom/toast"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import {
  createHoliday,
  deleteHoliday,
  type HolidayRow,
} from "./holidays-actions"
import { Segmented } from "./ui/segmented"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

type HolidayType = HolidayRow["type"]

interface Props {
  initial: HolidayRow[]
  dictionary?: Dictionary
  lang: string
}

/**
 * Days with no classes. A holiday or closure here stops live classes being
 * created and reminders going out for those days, and the timetable says so.
 */
export function ConfigHolidaysForm({
  initial,
  dictionary: dictionaryProp,
  lang,
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const t: Partial<Dictionary["schoolSettings"]["holidays"]> =
    dictionary?.schoolSettings?.holidays ?? {}
  const [rows, setRows] = useState<HolidayRow[]>(initial)
  const [title, setTitle] = useState("")
  const [type, setType] = useState<HolidayType>("HOLIDAY")
  const [from, setFrom] = useState("")
  const [until, setUntil] = useState("")
  const [pending, startTransition] = useTransition()

  const fmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  })
  // Day strings are calendar days; formatting them at UTC noon keeps the
  // printed day the one that was stored, whatever the reader's zone.
  const day = (d: string) => fmt.format(new Date(`${d}T12:00:00Z`))

  const canAdd = title.trim() && from && (!until || until >= from)

  function add() {
    if (!canAdd) return
    startTransition(async () => {
      const res = await createHoliday({
        title: title.trim(),
        type,
        from,
        until: until || from,
      })
      if (!res.success) {
        ErrorToast(t.saveError ?? "Couldn't save. Try again.")
        return
      }
      setRows((prev) =>
        [...prev, res.data].sort((a, b) => a.from.localeCompare(b.from))
      )
      setTitle("")
      setFrom("")
      setUntil("")
    })
  }

  function remove(id: string) {
    const before = rows
    setRows((prev) => prev.filter((r) => r.id !== id))
    startTransition(async () => {
      const res = await deleteHoliday({ id })
      if (!res.success) {
        setRows(before)
        ErrorToast(t.saveError ?? "Couldn't save. Try again.")
      }
    })
  }

  return (
    <div className="space-y-8">
      <SettingsGroup footer={t.footer}>
        {rows.length === 0 ? (
          <SettingsRow
            label={
              <span className="text-muted-foreground">
                {t.empty ?? "No holidays declared."}
              </span>
            }
          />
        ) : (
          rows.map((r) => (
            <SettingsRow
              key={r.id}
              label={<span dir="auto">{r.title}</span>}
              description={
                <>
                  {r.from === r.until
                    ? day(r.from)
                    : `${day(r.from)} – ${day(r.until)}`}
                  {" · "}
                  {r.type === "CANCELLED"
                    ? (t.closed ?? "School closed")
                    : (t.holiday ?? "Holiday")}
                </>
              }
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove(r.id)}
                disabled={pending}
                aria-label={t.remove ?? "Remove"}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </SettingsRow>
          ))
        )}
      </SettingsGroup>

      <SettingsGroup title={t.addTitle ?? "Add a day off"}>
        <SettingsRow label={t.name ?? "Name"} stack>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.namePlaceholder ?? "Eid al-Fitr"}
            maxLength={120}
            dir="auto"
          />
        </SettingsRow>
        <SettingsRow label={t.type ?? "Type"} stack>
          <Segmented<HolidayType>
            value={type}
            onValueChange={setType}
            aria-label={t.type ?? "Type"}
            options={[
              { value: "HOLIDAY", label: t.holiday ?? "Holiday" },
              { value: "CANCELLED", label: t.closed ?? "School closed" },
            ]}
          />
        </SettingsRow>
        <SettingsRow label={t.from ?? "From"}>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-44"
          />
        </SettingsRow>
        <SettingsRow label={t.until ?? "Until"} description={t.untilHint}>
          <Input
            type="date"
            value={until}
            min={from || undefined}
            onChange={(e) => setUntil(e.target.value)}
            className="w-44"
          />
        </SettingsRow>
        <SettingsRow label="">
          <Button onClick={add} disabled={!canAdd || pending}>
            {t.add ?? "Add"}
          </Button>
        </SettingsRow>
      </SettingsGroup>
    </div>
  )
}
