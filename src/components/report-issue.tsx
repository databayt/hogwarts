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

export function ReportIssue() {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const pathname = usePathname()

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
          Report an issue
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
        </DialogHeader>
        <textarea
          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring min-h-[120px] w-full rounded-md border bg-transparent px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
          placeholder="Describe the issue..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {status === "error" && (
          <p className="text-destructive text-sm">
            Something went wrong. Try again.
          </p>
        )}
        {status === "success" ? (
          <p className="text-sm text-green-600">Submitted. Thank you!</p>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || status === "loading"}
          >
            {status === "loading" ? "Submitting..." : "Submit"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
