import { Metadata } from "next"

import { ParentAttendanceContent } from "@/components/school-dashboard/parent-portal/attendance/content"

export const metadata: Metadata = {
  title: "Student Attendance | Parent Portal",
  description: "View your children attendance records",
}

export default function ParentAttendance() {
  return <ParentAttendanceContent />
}
