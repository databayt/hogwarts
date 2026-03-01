// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

// Legacy route — redirect to unified attendance records
export default function ParentAttendance() {
  redirect("/attendance/records")
}
