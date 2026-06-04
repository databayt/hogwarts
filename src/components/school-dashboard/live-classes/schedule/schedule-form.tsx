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
import { createLiveClass } from "@/components/school-dashboard/live-classes/actions/sessions"
import { resolveLiveClassError } from "@/components/school-dashboard/live-classes/error-map"

interface Props {
  locale: string
  dictionary: Dictionary
  // Pre-resolved options (passed from server)
  sections: { id: string; name: string }[]
  subjects: { id: string; name: string }[]
  teacherId?: string | null
  // True when LiveKit SFU env is configured — enables the built-in video option.
  liveKitEnabled?: boolean
}

export function ScheduleLiveClassForm({
  locale,
  dictionary,
  sections,
  subjects,
  teacherId,
  liveKitEnabled = false,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    description: "",
    // Default to a pasted meeting link — works on every deployment tier.
    provider: "external" as "external" | "livekit",
    meetingUrl: "",
    meetingProvider: "",
    saveAsDefault: true,
    sectionId: sections[0]?.id ?? "",
    subjectId: subjects[0]?.id ?? "",
    scheduledStart: "",
    scheduledEnd: "",
    recordingEnabled: true,
    maxParticipants: 50,
  })

  const t = dictionary?.liveClasses
  const isExternal = form.provider === "external"

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
            provider: form.provider,
            meetingUrl: isExternal ? form.meetingUrl || undefined : undefined,
            meetingProvider:
              isExternal && form.meetingProvider
                ? form.meetingProvider
                : undefined,
            saveAsDefault:
              isExternal &&
              form.saveAsDefault &&
              !!form.sectionId &&
              !!form.subjectId,
            scheduledStart: new Date(form.scheduledStart).toISOString(),
            scheduledEnd: new Date(form.scheduledEnd).toISOString(),
            recordingEnabled: isExternal ? false : form.recordingEnabled,
            maxParticipants: form.maxParticipants,
          })
          if ("success" in result && result.success) {
            router.push(`/${locale}/live-classes/${result.data.id}`)
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

      {/* Provider — only offer the built-in video option when LiveKit is configured */}
      {liveKitEnabled && (
        <div className="space-y-2">
          <Label htmlFor="provider">{t?.form?.provider ?? "Class type"}</Label>
          <select
            id="provider"
            className="bg-background w-full rounded-md border px-3 py-2 text-sm"
            value={form.provider}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                provider: e.target.value as "external" | "livekit",
              }))
            }
          >
            <option value="external">
              {t?.form?.providerExternal ?? "Meeting link (Google Meet / Zoom)"}
            </option>
            <option value="livekit">
              {t?.form?.providerLivekit ?? "Built-in video room"}
            </option>
          </select>
        </div>
      )}

      {/* Meeting link — required for the external provider */}
      {isExternal && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="meetingUrl">
              {t?.form?.meetingUrl ?? "Meeting link"}
            </Label>
            <Input
              id="meetingUrl"
              type="url"
              required
              placeholder="https://meet.google.com/abc-defg-hij"
              value={form.meetingUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, meetingUrl: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meetingProvider">
              {t?.form?.meetingProvider ?? "Provider"}
            </Label>
            <Input
              id="meetingProvider"
              placeholder="Google Meet"
              value={form.meetingProvider}
              onChange={(e) =>
                setForm((f) => ({ ...f, meetingProvider: e.target.value }))
              }
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <input
              id="saveDefault"
              type="checkbox"
              checked={form.saveAsDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, saveAsDefault: e.target.checked }))
              }
            />
            <Label htmlFor="saveDefault" className="font-normal">
              {t?.form?.saveAsDefault ??
                "Reuse this link for every class of this subject + section"}
            </Label>
          </div>
        </div>
      )}

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
        {/* Recording is a LiveKit-only capability */}
        {!isExternal && (
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
        )}
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
