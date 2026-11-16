// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { FileText, Paperclip } from "lucide-react"

/**
 * What a teacher attached to an assignment, ready to render: a readable
 * (signed) URL, a display name, and whether to draw it as a thumbnail.
 * Built server-side by `buildAttachmentLinks` (attachment-links.ts).
 */
export interface AttachmentLink {
  url: string
  name: string
  isImage: boolean
}

/** Stored keys are `<timestamp>_<name>` (presignUpload); show the name. */
export function attachmentName(url: string) {
  return decodeURIComponent(
    url.split("/").pop()?.split("?")[0] ?? "file"
  ).replace(/^\d{10,}[_-]/, "")
}

export function isImageUrl(url: string) {
  const path = url.split("?")[0].toLowerCase()
  return /\.(jpe?g|png|webp|heic|gif)$/.test(path)
}

/** Images as thumbnails linking to full size, PDFs/files as links. */
export function AssignmentAttachments({
  links,
  label,
}: {
  links?: AttachmentLink[]
  label?: string
}) {
  if (!links || links.length === 0) return null
  return (
    <div className="space-y-2">
      {label ? (
        <p className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
          <Paperclip className="h-3.5 w-3.5" aria-hidden />
          {label}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-muted hover:bg-muted/70 inline-flex items-center gap-2 rounded-md border p-1 text-xs"
            >
              {l.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.url}
                  alt={l.name}
                  loading="lazy"
                  className="h-24 w-24 rounded object-cover"
                />
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1">
                  <FileText className="h-4 w-4" aria-hidden />
                  <span dir="auto">{l.name}</span>
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
