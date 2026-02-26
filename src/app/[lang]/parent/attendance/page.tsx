// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { ParentAttendanceContent } from "@/components/school-dashboard/parent-portal/attendance/content"

export const metadata: Metadata = {
  title: "Student Attendance | Parent Portal",
  description: "View your children attendance records",
}

export default function ParentAttendance() {
  return <ParentAttendanceContent />
}
