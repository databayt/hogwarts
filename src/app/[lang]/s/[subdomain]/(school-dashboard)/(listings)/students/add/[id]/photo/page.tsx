// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Backwards compat: redirect old "photo" step to "attachments"

import AttachmentsContent from "@/components/school-dashboard/listings/students/wizard/attachments/content"

export default function PhotoPage() {
  return <AttachmentsContent />
}
