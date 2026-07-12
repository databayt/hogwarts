"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

// Lazily load pdf.js once per page and wire up its worker. The worker is
// emitted as a same-origin static asset (CSP worker-src 'self') via the
// `new URL(..., import.meta.url)` pattern, so no CDN/inline-worker is needed.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null
function loadPdfjs(): Promise<typeof import("pdfjs-dist")> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString()
      return pdfjs
    })
  }
  return pdfjsPromise
}

interface PdfThumbnailProps {
  /** Public URL of the PDF (S3/CDN) — fetched through the same-origin proxy. */
  url: string
  label: string
  className?: string
  /** Rendered while page 1 rasterizes and when rendering fails. */
  fallback?: React.ReactNode
}

/**
 * Renders the first page of a PDF to a canvas as a thumbnail image. Falls back
 * to `fallback` while loading and on any error (fetch/CORS/parse), so callers
 * always get a sensible visual instead of a broken embed.
 */
export function PdfThumbnail({
  url,
  label,
  className,
  fallback,
}: PdfThumbnailProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">(
    "loading"
  )

  React.useEffect(() => {
    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null

    ;(async () => {
      setStatus("loading")
      try {
        const pdfjs = await loadPdfjs()
        const res = await fetch(
          `/api/file/pdf-proxy?url=${encodeURIComponent(url)}`
        )
        if (!res.ok) throw new Error(`proxy ${res.status}`)
        const data = await res.arrayBuffer()
        if (cancelled) return

        const pdf = await pdfjs.getDocument({ data }).promise
        const page = await pdf.getPage(1)
        if (cancelled) return

        const canvas = canvasRef.current
        const ctx = canvas?.getContext("2d")
        if (!canvas || !ctx) return

        const containerWidth = canvas.parentElement?.clientWidth || 200
        const dpr = window.devicePixelRatio || 1
        const base = page.getViewport({ scale: 1 })
        const viewport = page.getViewport({
          scale: (containerWidth / base.width) * dpr,
        })
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)

        renderTask = page.render({ canvas, viewport })
        await renderTask.promise
        if (cancelled) return
        setStatus("ready")
      } catch {
        if (!cancelled) setStatus("error")
      }
    })()

    return () => {
      cancelled = true
      try {
        renderTask?.cancel()
      } catch {
        /* render already settled */
      }
    }
  }, [url])

  return (
    <div className={cn("relative h-full w-full", className)}>
      {status !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center">
          {status === "error" ? (
            fallback
          ) : (
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          )}
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label={label}
        className={cn(
          "h-full w-full object-cover object-top",
          status !== "ready" && "invisible"
        )}
      />
    </div>
  )
}
