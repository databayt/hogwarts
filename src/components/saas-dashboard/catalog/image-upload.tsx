// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Catalog art preview (READ-ONLY).
 *
 * Catalog images are NOT uploaded per entity. Every subject/chapter/lesson shows
 * its **nearest-concept** art automatically — the concept is resolved from the
 * entity (see concepts-data.ts `nearestConcept`) and the seeds store the flat
 * `clickview/...` key, which the resolver serves from cdn.databayt.org/clickview.
 *
 * This component used to be a dropzone uploader; it's now a read-only preview so
 * no one can override the shared concept art with a one-off file. The export name
 * and props are kept for drop-in compatibility with the existing call sites.
 */

import { cn } from "@/lib/utils"
import { getCatalogImageUrl } from "@/components/catalog/image-url"

interface CatalogImageUploadProps {
  entityType: "subject" | "chapter" | "lesson"
  entityId: string
  currentThumbnailKey?: string | null
  className?: string
}

export function CatalogImageUpload({
  currentThumbnailKey,
  className,
}: CatalogImageUploadProps) {
  const url = getCatalogImageUrl(currentThumbnailKey, "md")

  return (
    <div className={cn("space-y-2", className)}>
      <div className="bg-muted/40 relative h-48 w-full overflow-hidden rounded-lg border">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Concept art"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
            Concept art assigned automatically
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Auto-assigned from the nearest concept · served from
        cdn.databayt.org/clickview. Not editable per entity.
      </p>
    </div>
  )
}
