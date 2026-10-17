"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { NotebookPen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { setClassHomework } from "@/components/school-dashboard/live/actions/resources"

export interface SetHomeworkLabels {
  setHomework: string
  dialogTitle: string
  dialogHint: string
  fieldTitle: string
  fieldTitlePlaceholder: string
  fieldInstructions: string
  fieldDue: string
  fieldPoints: string
  save: string
  skip: string
  saving: string
  saved: string
  failed: string
  noAudience: string
}

/** Tomorrow at 08:00 local, as an `<input type="datetime-local">` value. */
function defaultDue(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(8, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * "Set homework" for a class — a button on the class page, and the question
 * the page asks by itself right after the host ends the class
 * (`EndClassButton` lands on `?homework=1`). Skippable: "Not now" just
 * closes it.
 */
export function SetHomeworkDialog({
  sessionId,
  labels,
}: {
  sessionId: string
  labels: SetHomeworkLabels
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const asked = searchParams.get("homework") === "1"
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [instructions, setInstructions] = useState("")
  const [due, setDue] = useState(defaultDue)
  const [points, setPoints] = useState("10")
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (asked) setOpen(true)
  }, [asked])

  const close = () => {
    setOpen(false)
    // Drop the one-shot `?homework=1` so a reload does not ask again.
    if (asked) router.replace(pathname, { scroll: false })
  }

  const save = () => {
    startTransition(async () => {
      const res = await setClassHomework({
        sessionId,
        title,
        instructions,
        dueDate: new Date(due).toISOString(),
        totalPoints: Number(points) || 10,
      })
      if ("success" in res && res.success) {
        SuccessToast(labels.saved)
        setTitle("")
        setInstructions("")
        close()
        router.refresh()
      } else {
        const message =
          "details" in res && res.details === "no_audience"
            ? labels.noAudience
            : labels.failed
        ErrorToast(message)
      }
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <NotebookPen className="h-4 w-4" aria-hidden />
        {labels.setHomework}
      </Button>
      <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{labels.dialogTitle}</DialogTitle>
            <DialogDescription>{labels.dialogHint}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (title.trim()) save()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="hw-title">{labels.fieldTitle}</Label>
              <Input
                id="hw-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={labels.fieldTitlePlaceholder}
                maxLength={200}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hw-instructions">
                {labels.fieldInstructions}
              </Label>
              <Textarea
                id="hw-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                maxLength={5000}
              />
            </div>
            <div className="grid grid-cols-[1fr_6rem] gap-4">
              <div className="space-y-2">
                <Label htmlFor="hw-due">{labels.fieldDue}</Label>
                <Input
                  id="hw-due"
                  type="datetime-local"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hw-points">{labels.fieldPoints}</Label>
                <Input
                  id="hw-points"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={999}
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                {labels.skip}
              </Button>
              <Button type="submit" disabled={pending || !title.trim()}>
                {pending ? labels.saving : labels.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
