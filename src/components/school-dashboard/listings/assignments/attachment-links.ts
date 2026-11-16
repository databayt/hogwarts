// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { signAttachmentUrls } from "@/lib/tenant-storage"

import {
  attachmentName,
  isImageUrl,
  type AttachmentLink,
} from "./assignment-attachments"

/** Stored attachment URLs → signed, display-ready links (unsignable ones dropped). */
export async function buildAttachmentLinks(
  stored: string[] | null | undefined
): Promise<AttachmentLink[]> {
  const raw = stored ?? []
  if (raw.length === 0) return []
  const signed = await signAttachmentUrls(raw)
  return raw.flatMap((r, i) => {
    const url = signed[i]
    return url ? [{ url, name: attachmentName(r), isImage: isImageUrl(r) }] : []
  })
}
