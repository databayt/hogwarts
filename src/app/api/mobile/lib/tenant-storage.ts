// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Moved to @/lib/tenant-storage so the web submissions view signs attachments
// the same way the mobile routes do. Re-exported for the existing imports.
export { isTenantStorageUrl, signAttachmentUrls } from "@/lib/tenant-storage"
