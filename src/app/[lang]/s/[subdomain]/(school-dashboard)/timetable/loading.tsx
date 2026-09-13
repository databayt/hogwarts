// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { TimetableShellSkeleton } from "@/components/school-dashboard/timetable/shell-context"

/**
 * A dynamic route without a `loading.tsx` is not prefetched at all: the
 * sidebar's Timetable link did nothing visible until the whole server
 * response had arrived. This boundary is what the link prefetches, so a tap
 * shows the surface skeleton immediately. The shape (student column or admin
 * week) comes from the layout through `TimetableShellProvider`.
 */
export default function Loading() {
  return <TimetableShellSkeleton />
}
