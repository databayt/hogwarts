// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getSignedReadUrl } from "@/lib/s3"
import { extractStorageKey, isOwnStorageUrl } from "@/lib/storage-key"

/**
 * True when a client-supplied file URL is an object in our own bucket under
 * THIS school's key segment (`<prefix>/<schoolId>/...`, the shape every
 * presign route mints). Stops a device from attaching an arbitrary external
 * link — or another school's object — to a record a teacher will open.
 */
export function isTenantStorageUrl(url: string, schoolId: string): boolean {
  if (!isOwnStorageUrl(url)) return false
  const key = extractStorageKey(url)
  return !!key && !key.includes("..") && key.split("/")[1] === schoolId
}

/**
 * Readable URLs for stored attachments. The bucket is private, so an object
 * of ours gets a short-lived signed GET (null when signing is unavailable);
 * anything else (a legacy external link) is passed through untouched.
 */
export async function signAttachmentUrls(
  urls: string[]
): Promise<(string | null)[]> {
  return Promise.all(
    urls.map(async (url) => {
      const key = isOwnStorageUrl(url) ? extractStorageKey(url) : null
      return key ? getSignedReadUrl(key) : url
    })
  )
}
