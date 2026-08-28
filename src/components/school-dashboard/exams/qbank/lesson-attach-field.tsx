"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Sentinel for "no lesson" — Radix Select refuses an empty-string value. */
const NONE = "__none__"

type Chapter = { id: string; name: string; lessonCount: number }
type Lesson = { id: string; name: string; chapterName: string }

/**
 * Attach a question to a catalog lesson so it appears in that lesson's Lumos
 * practice quiz.
 *
 * Reuses the SAME two route handlers the Lumos upload dialog's picker walks —
 * `/api/lumos/proposable-chapters` and `/api/lumos/proposable-lessons` — so
 * scope, tenant gating, hidden-content subtraction and name translation are
 * defined in exactly one place (`lumos/teach/get-proposable-lessons.ts`). They
 * are route handlers, not server actions, on purpose: `auth()` rotates the
 * session cookie inside an action request, which would ship a full RSC
 * re-render of this page on every chapter change.
 *
 * The subject is chosen upstream in the question form; changing it clears the
 * attachment, because a lesson only ever belongs to one subject and the server
 * refuses a mismatch.
 */
export function LessonAttachField({
  subjectId,
  value,
  onChange,
  lang,
  disabled,
  labels,
}: {
  subjectId: string | undefined
  /** Selected lesson id, or "" for unattached. */
  value: string
  onChange: (lessonId: string) => void
  lang?: string
  disabled?: boolean
  labels?: {
    lesson?: string
    chapter?: string
    none?: string
    hint?: string
    pickSubject?: string
    loading?: string
    empty?: string
  }
}) {
  const [chapterId, setChapterId] = useState<string>(NONE)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(false)

  const locale = lang === "ar" ? "ar" : "en"

  // Subject change invalidates both tiers and any existing attachment.
  useEffect(() => {
    setChapterId(NONE)
    setChapters([])
    setLessons([])
    if (!subjectId) return

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(
          `/api/lumos/proposable-chapters?subjectId=${encodeURIComponent(subjectId)}&locale=${locale}`
        )
        if (!res.ok) return
        const body = (await res.json()) as { chapters?: Chapter[] }
        if (!cancelled) setChapters(body.chapters ?? [])
      } catch {
        // Offline / transient — the lesson tier stays empty and the field is
        // simply not usable this render. Never blocks saving the question.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [subjectId, locale])

  // Lessons follow the subject (optionally narrowed by chapter). The effect
  // keys on a STRING, not an object — an object identity here re-fires on
  // every render.
  const lessonQuery = subjectId
    ? `subjectIds=${encodeURIComponent(subjectId)}${
        chapterId !== NONE ? `&chapterId=${encodeURIComponent(chapterId)}` : ""
      }&locale=${locale}`
    : ""

  useEffect(() => {
    if (!lessonQuery) {
      setLessons([])
      return
    }
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const res = await fetch(`/api/lumos/proposable-lessons?${lessonQuery}`)
        if (!res.ok) return
        const body = (await res.json()) as { lessons?: Lesson[] }
        if (!cancelled) setLessons(body.lessons ?? [])
      } catch {
        if (!cancelled) setLessons([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [lessonQuery])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>{labels?.lesson ?? "Lesson (optional)"}</Label>
        <p className="text-muted-foreground text-xs">
          {labels?.hint ??
            "Attach this question to a lesson to include it in that lesson's practice quiz."}
        </p>
      </div>

      {!subjectId ? (
        <p className="text-muted-foreground text-sm">
          {labels?.pickSubject ?? "Choose a subject first."}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            value={chapterId}
            onValueChange={(next) => {
              setChapterId(next)
              onChange("")
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={labels?.chapter ?? "All chapters"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                {labels?.chapter ?? "All chapters"}
              </SelectItem>
              {chapters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={value || NONE}
            onValueChange={(next) => onChange(next === NONE ? "" : next)}
            disabled={disabled || loading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  loading
                    ? (labels?.loading ?? "Loading…")
                    : (labels?.none ?? "Not attached")
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                {labels?.none ?? "Not attached"}
              </SelectItem>
              {lessons.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {subjectId && !loading && lessons.length === 0 && (
        <p className="text-muted-foreground text-sm">
          {labels?.empty ?? "No lessons available for this subject."}
        </p>
      )}
    </div>
  )
}
