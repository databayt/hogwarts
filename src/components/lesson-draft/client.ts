// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The browser side of POST /api/live/lesson-draft: send the request, read the
 * event stream, report each stage, resolve with the drafts or an error CODE.
 * Client-safe (no server imports). The caller maps codes to dictionary text.
 */
import { readEvents } from "@/components/chatbot/sse"

import type { DraftResult, DraftStage } from "./types"

/** The server's own deadline is 55 s; the browser gives up at 60. */
export const CLIENT_TIMEOUT_MS = 60_000

export interface LessonDraftBody {
  sessionId?: string
  lessonId?: string
  topic?: string
  assignmentId?: string
  replace?: boolean
  homeworkOnly?: boolean
}

export type LessonDraftOutcome =
  | { ok: true; result: DraftResult }
  | { ok: false; code: string }

export async function requestLessonDraft(
  body: LessonDraftBody,
  onStage?: (s: DraftStage) => void
): Promise<LessonDraftOutcome> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), CLIENT_TIMEOUT_MS)
  try {
    const res = await fetch("/api/live/lesson-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
    if (!res.ok || !res.body) {
      const data = (await res.json().catch(() => null)) as {
        error?: string
      } | null
      return { ok: false, code: data?.error ?? "UNKNOWN" }
    }
    for await (const raw of readEvents(res.body)) {
      const e = raw as unknown as { event: string; data: Record<string, unknown> }
      if (e.event === "stage") onStage?.(e.data.stage as DraftStage)
      else if (e.event === "done")
        return { ok: true, result: e.data as unknown as DraftResult }
      else if (e.event === "error")
        return { ok: false, code: String(e.data.code ?? "UNKNOWN") }
    }
    return { ok: false, code: "UNKNOWN" }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      return { ok: false, code: "LESSON_DRAFT_TIMEOUT" }
    return { ok: false, code: "UNKNOWN" }
  } finally {
    clearTimeout(timer)
  }
}
