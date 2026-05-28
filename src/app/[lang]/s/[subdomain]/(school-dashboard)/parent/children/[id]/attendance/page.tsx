// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ParentAttendanceContent } from "@/components/school-dashboard/parent-portal/attendance/content"

// ParentAttendanceContent loads ALL the guardian's children + attendance
// internally. The dynamic [id] segment here ties this page to one child for
// URL/breadcrumb consistency, but the rendered view shows the full picture.
// A per-child filter inside the view will land alongside the i18n pass.
export default async function ChildAttendancePage() {
  return <ParentAttendanceContent />
}
