"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"

import { reportIssue } from "@/lib/actions/report-issue"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export function ReportIssue() {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const pathname = usePathname()
  const { dictionary } = useDictionary()
  const t = dictionary?.reportIssue

  async function handleSubmit() {
    if (!description.trim()) return
    setStatus("loading")
    try {
      await reportIssue({ description, pageUrl: pathname })
      setStatus("success")
      setDescription("")
      setTimeout(() => {
        setOpen(false)
        setStatus("idle")
      }, 1500)
    } catch {
      setStatus("error")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) setStatus("idle")
      }}
    >
      <DialogTrigger asChild>
        <button className="cursor-pointer font-medium underline underline-offset-4">
          {t?.link || "Report an issue"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t?.title || "Report an issue"}</DialogTitle>
        </DialogHeader>
        <textarea
          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
          placeholder={t?.placeholder || "Describe the issue..."}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {status === "error" && (
          <p className="text-destructive text-sm">
            {t?.error || "Something went wrong. Try again."}
          </p>
        )}
        {status === "success" ? (
          <p className="text-sm text-green-600">
            {t?.success || "Submitted. Thank you!"}
          </p>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || status === "loading"}
          >
            {status === "loading"
              ? t?.submitting || "Submitting..."
              : t?.submit || "Submit"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
