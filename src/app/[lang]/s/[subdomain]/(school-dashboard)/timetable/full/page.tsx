// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { TimetableContent } from "@/components/school-dashboard/timetable/content"
import { loadInitialTimetable } from "@/components/school-dashboard/timetable/initial-data"

export const metadata = { title: "Dashboard: Timetable - Full Week" }

export default function Page() {
  return (
    <TimetableContent defaultTab="full" initialData={loadInitialTimetable()} />
  )
}
