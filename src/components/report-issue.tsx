"use client"

import { useState } from "react"
import { Bug } from "lucide-react"

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

interface ReportIssueProps {
  variant?: "text" | "icon"
}

function parseBrowser(ua: string): string {
  if (ua.includes("Firefox/")) return `Firefox / ${getOS(ua)}`
  if (ua.includes("Edg/")) return `Edge / ${getOS(ua)}`
  if (ua.includes("Chrome/")) return `Chrome / ${getOS(ua)}`
  if (ua.includes("Safari/")) return `Safari / ${getOS(ua)}`
  return ua.slice(0, 50)
}

function getOS(ua: string): string {
  if (ua.includes("Mac OS")) return "macOS"
  if (ua.includes("Windows")) return "Windows"
  if (ua.includes("Android")) return "Android"
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS"
  if (ua.includes("Linux")) return "Linux"
  return "Unknown"
}

export function ReportIssue({ variant = "text" }: ReportIssueProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const { dictionary } = useDictionary()
  const t = dictionary?.reportIssue as Record<string, string> | undefined

  async function handleSubmit() {
    if (!description.trim()) return
    setStatus("loading")
    try {
      await reportIssue({
        description,
        pageUrl: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        direction: document.documentElement.dir || "ltr",
        browser: parseBrowser(navigator.userAgent),
      })
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
        {variant === "icon" ? (
          <button
            className="cursor-pointer"
            aria-label={t?.link || "Report an issue"}
          >
            <Bug className="h-6 w-6" strokeWidth={0.75} />
          </button>
        ) : (
          <button className="cursor-pointer font-medium underline underline-offset-4">
            {t?.link || "Report an issue"}
          </button>
        )}
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
