"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { createLiveClass } from "@/components/school-dashboard/conference/actions/sessions"
import { resolveLiveClassError } from "@/components/school-dashboard/conference/error-map"

interface Props {
  locale: string
  dictionary: Dictionary
  // Pre-resolved options (passed from server)
  sections: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  teacherId?: string | null
}

export function ScheduleLiveClassForm({
  locale,
  dictionary,
  sections,
  subjects,
  teacherId,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    sectionId: sections[0]?.id ?? "",
    subjectId: subjects[0]?.id ?? "",
    scheduledStart: "",
    scheduledEnd: "",
    recordingEnabled: true,
    maxParticipants: 50,
  })

  const t = dictionary?.liveClasses

  return (
    <form
      className="mx-auto max-w-2xl space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!teacherId) {
          setError("UNAUTHORIZED")
          return
        }
        startTransition(async () => {
          setError(null)
          const result = await createLiveClass({
            title: form.title,
            description: form.description || undefined,
            lang: locale === "ar" ? "ar" : "en",
            sectionId: form.sectionId || undefined,
            subjectId: form.subjectId || undefined,
            teacherId,
            scheduledStart: new Date(form.scheduledStart).toISOString(),
            scheduledEnd: new Date(form.scheduledEnd).toISOString(),
            recordingEnabled: form.recordingEnabled,
            maxParticipants: form.maxParticipants,
          })
          if ("success" in result && result.success) {
            router.push(`/${locale}/conference/${result.data.id}`)
          } else {
            setError(
              resolveLiveClassError(
                dictionary,
                "error" in result ? result.error : undefined
              )
            )
          }
        })
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="title">{t?.form?.title ?? "Title"}</Label>
        <Input
          id="title"
          required
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t?.form?.description ?? "Description"}
        </Label>
        <Textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>

      {sections.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="section">{t?.form?.section ?? "Section"}</Label>
          <select
            id="section"
            className="bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={form.sectionId}
            onChange={(e) =>
              setForm((f) => ({ ...f, sectionId: e.target.value }))
            }
          >
            <option value="">—</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {subjects.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subject">{t?.form?.subject ?? "Subject"}</Label>
          <select
            id="subject"
            className="bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={form.subjectId}
            onChange={(e) =>
              setForm((f) => ({ ...f, subjectId: e.target.value }))
            }
          >
            <option value="">—</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start">{t?.form?.scheduledStart ?? "Starts"}</Label>
          <Input
            id="start"
            type="datetime-local"
            required
            value={form.scheduledStart}
            onChange={(e) =>
              setForm((f) => ({ ...f, scheduledStart: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end">{t?.form?.scheduledEnd ?? "Ends"}</Label>
          <Input
            id="end"
            type="datetime-local"
            required
            value={form.scheduledEnd}
            onChange={(e) =>
              setForm((f) => ({ ...f, scheduledEnd: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="max">
            {t?.form?.maxParticipants ?? "Max participants"}
          </Label>
          <Input
            id="max"
            type="number"
            min={1}
            max={300}
            value={form.maxParticipants}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                maxParticipants: Number(e.target.value) || 1,
              }))
            }
          />
        </div>
        <div className="flex items-end gap-2">
          <input
            id="rec"
            type="checkbox"
            checked={form.recordingEnabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, recordingEnabled: e.target.checked }))
            }
          />
          <Label htmlFor="rec">
            {t?.form?.recordingEnabled ?? "Record this class"}
          </Label>
        </div>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t?.actions?.cancel ?? "Cancel"}
        </Button>
        <Button type="submit" disabled={pending || !teacherId}>
          {t?.actions?.schedule ?? "Schedule"}
        </Button>
      </div>
    </form>
  )
}
