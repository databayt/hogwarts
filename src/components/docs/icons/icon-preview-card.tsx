"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

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
        "bg-background rounded-lg border p-6 transition-all",
        "hover:border-primary hover:shadow-md",
        "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none"
      )}
      title={icon.description || icon.name}
    >
      {/* Icon Display */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {IconComponent && (
          <IconComponent className="text-foreground h-10 w-10 transition-transform group-hover:scale-110" />
        )}
      </div>

      {/* Icon Name */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-foreground text-sm font-medium">{icon.name}</span>
        <span className="text-muted-foreground text-xs">{icon.id}</span>
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
          <Check className="text-primary h-3.5 w-3.5" />
        ) : (
          <Copy className="text-muted-foreground h-3.5 w-3.5" />
        )}
      </div>

      {/* Hover Overlay */}
      <div className="bg-primary/5 absolute inset-0 rounded-lg opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
