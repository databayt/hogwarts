"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

// Monotonic id so every render target is unique (mermaid.render needs a fresh id).
let mermaidSeq = 0

// Theme-aware client renderer. The diagram source is passed as a `chart` string
// prop (a backtick string in MDX) rather than a fenced ```mermaid block, which
// keeps it clear of the raw-`{`/`<` MDX hazard and out of the rehype-pretty-code
// (shiki) pipeline. Mermaid is dynamically imported inside the effect so it never
// loads on the server.
export function Mermaid({
  chart,
  className,
}: {
  chart: string
  className?: string
}) {
  const { resolvedTheme } = useTheme()
  const [svg, setSvg] = React.useState("")
  const [failed, setFailed] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: resolvedTheme === "dark" ? "dark" : "default",
          fontFamily: "inherit",
        })
        mermaidSeq += 1
        const { svg } = await mermaid.render(`mermaid-${mermaidSeq}`, chart)
        if (!cancelled) {
          setSvg(svg)
          setFailed(false)
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [chart, resolvedTheme])

  // Graceful fallback: show the source like any other code block instead of
  // crashing the page.
  if (failed) {
    return (
      <pre className="no-scrollbar my-6 overflow-x-auto rounded-lg border px-4 py-3.5 text-sm">
        {chart}
      </pre>
    )
  }

  return (
    <div
      className={cn(
        "bg-muted/30 my-6 flex justify-center overflow-x-auto rounded-lg border p-4 [&_svg]:h-auto [&_svg]:max-w-full",
        className
      )}
      // SVG is produced by mermaid.render with securityLevel "strict" (sanitized).
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
