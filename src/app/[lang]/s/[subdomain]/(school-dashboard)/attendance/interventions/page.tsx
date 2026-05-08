// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { InterventionsContent } from "@/components/school-dashboard/attendance/interventions/content"

export const metadata = { title: "Dashboard: Interventions" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const STAFF_ROLES = ["ADMIN", "TEACHER", "STAFF", "DEVELOPER"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  // Interventions are an MTSS staff workflow — students/guardians don't manage them
  if (!STAFF_ROLES.includes(session?.user?.role ?? "")) {
    redirect(`/${lang}/attendance`)
  }

  return <InterventionsContent locale={lang} />
}
