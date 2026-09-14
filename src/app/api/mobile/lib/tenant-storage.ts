// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
