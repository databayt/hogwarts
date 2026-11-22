// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The words of the class-link form (`class-link-form.tsx`), and the function
// that fills them from the dictionary.
//
// In a file of its own, with NO "use client": the class page is a server
// component and calls `resolveClassLinkLabels` while it renders. A function
// exported from a client file cannot be called on the server — React throws
// at render time, and neither the typecheck nor the build says a word. This
// was caught by opening the page (2026-11-22), not by a test. Same split as
// `notifications/class-alerts-labels.ts`.

export interface ClassLinkLabels {
  add: string
  hint: string
  url: string
  urlPlaceholder: string
  title: string
  titlePlaceholder: string
  save: string
  saving: string
  cancel: string
  saved: string
  failed: string
  invalid: string
  remove: string
  removed: string
}

export const DEFAULT_CLASS_LINK_LABELS: ClassLinkLabels = {
  add: "Add a link",
  hint: "Recorded the lesson? Upload it to YouTube or Drive and paste its link here — students who missed the class will find it on this page.",
  url: "Link",
  urlPlaceholder: "https://",
  title: "Name (optional)",
  titlePlaceholder: "Lesson video",
  save: "Add",
  saving: "Adding…",
  cancel: "Cancel",
  saved: "The link is on the class page",
  failed: "The link was not added. Try again.",
  invalid: "Paste a full link that starts with https://",
  remove: "Remove link",
  removed: "The link was removed",
}

export function resolveClassLinkLabels(source: unknown): ClassLinkLabels {
  const out = { ...DEFAULT_CLASS_LINK_LABELS }
  if (source && typeof source === "object") {
    for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
      if (typeof v === "string" && k in out) {
        ;(out as unknown as Record<string, string>)[k] = v
      }
    }
  }
  return out
}
