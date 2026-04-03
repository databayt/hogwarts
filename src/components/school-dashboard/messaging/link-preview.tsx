// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LinkPreviewData {
  url: string
  title?: string
  description?: string
  image?: string
  siteName?: string
}

interface LinkPreviewProps {
  preview: LinkPreviewData
  isOwnMessage?: boolean
  className?: string
}

export function LinkPreview({
  preview,
  isOwnMessage = false,
  className,
}: LinkPreviewProps) {
  const { url, title, description, image, siteName } = preview

  // Don't render if we have nothing meaningful
  if (!title && !description && !image) return null

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-1 block overflow-hidden rounded-lg border",
        isOwnMessage
          ? "border-foreground/10 bg-msg-outgoing/80"
          : "border-foreground/10 bg-msg-incoming/80",
        className
      )}
    >
      {image && (
        <img
          src={image}
          alt={title || url}
          className="h-[140px] w-full object-cover"
          loading="lazy"
        />
      )}
      <div className="px-3 py-2">
        {siteName && (
          <p className="text-msg-link text-[11px] font-medium uppercase tracking-wide">
            {siteName}
          </p>
        )}
        {title && (
          <p className="text-sm font-medium leading-tight">{title}</p>
        )}
        {description && (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-relaxed">
            {description}
          </p>
        )}
        <p className="text-msg-timestamp mt-1 flex items-center gap-1 text-[11px]">
          <ExternalLink className="h-3 w-3" />
          {new URL(url).hostname}
        </p>
      </div>
    </a>
  )
}

/**
 * Extract the first URL from a message content string.
 */
export function extractFirstUrl(content: string): string | null {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i
  const match = content.match(urlRegex)
  return match ? match[0] : null
}
