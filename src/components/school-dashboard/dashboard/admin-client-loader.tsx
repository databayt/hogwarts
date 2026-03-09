"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

// Dynamic import with ssr: false — avoids hydration mismatch from Date/locale
// differences between Vercel server (UTC) and client browser timezone.
// Dashboard is behind auth so SSR is not needed for SEO.
const AdminDashboardClient = dynamic(
  () =>
    import("./admin-client").then((mod) => ({
      default: mod.AdminDashboardClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="flex gap-6">
          <Skeleton className="h-[320px] w-[320px] rounded-2xl" />
          <Skeleton className="h-[320px] flex-1 rounded-2xl" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
        <Skeleton className="h-[100px] w-full rounded-xl" />
      </div>
    ),
  }
)

// Re-export props type for the server component
export type { AdminDashboardClientProps } from "./admin-client"

// Thin wrapper that passes props through to the dynamically loaded component
export function AdminDashboardClientLoader(
  props: React.ComponentProps<typeof AdminDashboardClient>
) {
  return <AdminDashboardClient {...props} />
}
