"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { Eye, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { VideoWatermark } from "@/components/lumos/shared/video-player/video-watermark"

export interface MaterialViewerLabels {
  viewOnly?: string
  loading?: string
  failed?: string
  page?: string
}

interface MaterialViewerProps {
  /** Same-origin protected route (`/api/lumos/file/<kind>/<id>`). */
  url: string
  title: string
  viewer?: { id?: string; email?: string | null }
  labels?: MaterialViewerLabels
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_PAGES = 120

/**
 * In-app viewer for lesson materials — the only way a material's bytes
 * reach a screen. PDFs are drawn onto canvases by pdf.js (no native viewer
 * toolbar, no save button, no "open in new tab"), images are shown
 * undraggable, and a forensic watermark with the viewer's identity roams
 * over everything so a screenshot carries who took it.
 *
 * What this does NOT do: stop a determined person with a camera. School
 * policy accepts that; the point is that nothing in the product hands out
 * a copy, and every capture is attributable.
 */
export function MaterialViewer({
  url,
  title,
  viewer,
  labels,
  open,
  onOpenChange,
}: MaterialViewerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "failed">(
    "idle"
  )
  const [kind, setKind] = useState<"pdf" | "image" | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const pagesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    let objectUrl: string | null = null
    setStatus("loading")
    setKind(null)
    setPageCount(0)
    ;(async () => {
      try {
        const res = await fetch(url, { credentials: "same-origin" })
        if (!res.ok) throw new Error(`file ${res.status}`)
        const type = res.headers.get("content-type") ?? ""
        if (type.startsWith("image/")) {
          const blob = await res.blob()
          if (cancelled) return
          objectUrl = URL.createObjectURL(blob)
          setImageUrl(objectUrl)
          setKind("image")
          setStatus("ready")
          return
        }
        const data = await res.arrayBuffer()
        if (cancelled) return
        const pdfjs = await import("pdfjs-dist")
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        const doc = await pdfjs.getDocument({ data }).promise
        if (cancelled) return
        setKind("pdf")
        setPageCount(doc.numPages)
        setStatus("ready")
        const host = pagesRef.current
        if (!host) return
        host.replaceChildren()
        const width = Math.min(host.clientWidth || 800, 1100)
        for (let n = 1; n <= Math.min(doc.numPages, MAX_PAGES); n++) {
          if (cancelled) return
          const page = await doc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          const scale = (width / base.width) * (window.devicePixelRatio || 1)
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = `${viewport.width / (window.devicePixelRatio || 1)}px`
          canvas.style.height = `${viewport.height / (window.devicePixelRatio || 1)}px`
          canvas.className =
            "mx-auto mb-3 block max-w-full rounded-sm bg-white shadow"
          canvas.setAttribute("aria-label", `${labels?.page ?? "Page"} ${n}`)
          host.appendChild(canvas)
          const ctx = canvas.getContext("2d")
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
        }
      } catch {
        if (!cancelled) setStatus("failed")
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      setImageUrl(null)
    }
  }, [open, url, labels?.page])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] w-[min(96vw,1100px)] max-w-none overflow-hidden p-0 select-none"
        onContextMenu={(e) => e.preventDefault()}
        data-video-protected
      >
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" aria-hidden />
            <span className="truncate">{title}</span>
            <span className="text-muted-foreground ms-auto text-xs font-normal">
              {labels?.viewOnly ?? "View only"}
              {kind === "pdf" && pageCount > 0
                ? ` · ${pageCount} ${labels?.page ?? "pages"}`
                : ""}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="bg-muted relative max-h-[calc(92vh-56px)] overflow-y-auto p-3">
          {status === "loading" && (
            <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {labels?.loading ?? "Loading…"}
            </div>
          )}
          {status === "failed" && (
            <p className="text-destructive py-16 text-center text-sm">
              {labels?.failed ?? "This file couldn't be displayed."}
            </p>
          )}
          {kind === "image" && imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              draggable={false}
              className="mx-auto block max-h-[80vh] max-w-full rounded-sm"
              onDragStart={(e) => e.preventDefault()}
            />
          )}
          <div ref={pagesRef} className={kind === "pdf" ? "" : "hidden"} />
          <VideoWatermark
            userId={viewer?.id}
            userEmail={viewer?.email ?? undefined}
            rotationInterval={15000}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** A resource row that opens the viewer instead of handing out the file. */
export function MaterialViewerTrigger({
  url,
  title,
  description,
  icon,
  viewer,
  labels,
}: {
  url: string
  title: string
  description?: string | null
  icon: React.ReactNode
  viewer?: { id?: string; email?: string | null }
  labels?: MaterialViewerLabels
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hover:bg-accent flex w-full items-center gap-2 rounded-md border p-2 text-start transition-colors"
      >
        {icon}
        <span className="min-w-0">
          <span className="block truncate text-sm">{title}</span>
          {description && (
            <span className="text-muted-foreground block truncate text-xs">
              {description}
            </span>
          )}
        </span>
        <Eye
          className="text-muted-foreground ms-auto h-4 w-4 shrink-0"
          aria-hidden
        />
      </button>
      {open && (
        <MaterialViewer
          url={url}
          title={title}
          viewer={viewer}
          labels={labels}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  )
}
