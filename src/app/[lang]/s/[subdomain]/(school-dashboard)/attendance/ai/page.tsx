// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { AIContent } from "@/components/school-dashboard/attendance/ai/content"

export const metadata = { title: "Dashboard: AI Attendance" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2>Access Denied</h2>
        <p className="text-muted-foreground">
          You do not have permission to access AI attendance features.
        </p>
      </div>
    )
  }

  return <AIContent locale={lang} />
}
