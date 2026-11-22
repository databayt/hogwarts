"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { Link2, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import {
  addClassLink,
  removeClassLink,
} from "@/components/school-dashboard/live/actions/resources"
import type { ClassLinkLabels } from "@/components/school-dashboard/live/class-link-labels"

/** Only http(s): what the server stores, checked here to answer at once. */
export function looksLikeLink(value: string): boolean {
  const v = value.trim()
  if (!/^https?:\/\//i.test(v)) return false
  try {
    return !!new URL(v).hostname
  } catch {
    return false
  }
}

/**
 * The class's teacher puts a link on the class page — the lesson she recorded
 * and uploaded herself, a worksheet, a reference. Closed by default: one
 * button, which opens two fields. The page re-renders from the action.
 */
export function ClassLinkForm({
  sessionId,
  labels,
}: {
  sessionId: string
  labels: ClassLinkLabels
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [pending, startTransition] = useTransition()

  const submit = () => {
    if (!looksLikeLink(url)) {
      ErrorToast(labels.invalid)
      return
    }
    startTransition(async () => {
      const result = await addClassLink({ sessionId, url, title })
      if (result.success) {
        SuccessToast(labels.saved)
        setUrl("")
        setTitle("")
        setOpen(false)
      } else {
        ErrorToast(labels.failed)
      }
    })
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" aria-hidden />
        {labels.add}
      </Button>
    )
  }

  return (
    <form
      className="space-y-3 rounded-md border p-3"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <p className="text-muted-foreground text-sm">{labels.hint}</p>
      <div className="space-y-1">
        <Label htmlFor="class-link-url">{labels.url}</Label>
        <Input
          id="class-link-url"
          type="url"
          inputMode="url"
          dir="ltr"
          autoComplete="off"
          required
          maxLength={2000}
          placeholder={labels.urlPlaceholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="min-h-11"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="class-link-title">{labels.title}</Label>
        <Input
          id="class-link-title"
          maxLength={120}
          placeholder={labels.titlePlaceholder}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-h-11"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" className="min-h-11" disabled={pending}>
          <Link2 className="size-4" aria-hidden />
          {pending ? labels.saving : labels.save}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="min-h-11"
          disabled={pending}
          onClick={() => setOpen(false)}
        >
          {labels.cancel}
        </Button>
      </div>
    </form>
  )
}

/** The small "remove" control beside a link, for the class's teacher. */
export function RemoveClassLinkButton({
  sessionId,
  resourceId,
  labels,
}: {
  sessionId: string
  resourceId: string
  labels: Pick<ClassLinkLabels, "remove" | "removed" | "failed">
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-11 shrink-0"
      aria-label={labels.remove}
      title={labels.remove}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await removeClassLink({ sessionId, resourceId })
          if (result.success) SuccessToast(labels.removed)
          else ErrorToast(labels.failed)
        })
      }
    >
      <X className="size-4" aria-hidden />
    </Button>
  )
}
