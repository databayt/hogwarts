"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Check, Copy } from "lucide-react"
import type { IconItem } from "./config"

interface IconPreviewCardProps {
  icon: IconItem
}

export function IconPreviewCard({ icon }: IconPreviewCardProps) {
  const [copied, setCopied] = React.useState(false)
  const IconComponent = Icons[icon.id as keyof typeof Icons]

  const copyCode = React.useCallback(() => {
    const code = `<Icons.${icon.id} className="w-6 h-6" />`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [icon.id])

  return (
    <button
      onClick={copyCode}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-3",
        "rounded-lg border bg-background p-6 transition-all",
        "hover:border-primary hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      title={icon.description || icon.name}
    >
      {/* Icon Display */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {IconComponent && (
          <IconComponent className="h-10 w-10 text-foreground transition-transform group-hover:scale-110" />
        )}
      </div>

      {/* Icon Name */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-foreground">{icon.name}</span>
        <span className="text-xs text-muted-foreground">{icon.id}</span>
      </div>

      {/* Copy Indicator */}
      <div
        className={cn(
          "absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-md",
          "bg-primary/10 opacity-0 transition-opacity",
          "group-hover:opacity-100",
          copied && "opacity-100"
        )}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
