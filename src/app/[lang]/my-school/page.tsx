// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { tenantOriginForHost } from "@/lib/root-domain"
import { safeTenantNext } from "@/lib/tenant-paths"

interface MySchoolPageProps {
  params: Promise<{ lang: string }>
  searchParams: Promise<{ next?: string }>
}

/**
 * My School Redirect Page
 *
 * Looks up the user's school from their session and redirects them
 * to their school's dashboard. If no school is found, redirects to onboarding.
 */
export default async function MySchoolPage({
  params,
  searchParams,
}: MySchoolPageProps) {
  const { lang } = await params
  const { next } = await searchParams
  const session = await auth()

  // Not authenticated - redirect to login
  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const schoolId = session.user.schoolId

  // No school associated - redirect to onboarding
  if (!schoolId) {
    redirect(`/${lang}/newcomers`)
  }

  // Look up the school to get its domain (used as subdomain in routing)
  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { domain: true },
  })

  // School not found or no domain - redirect to onboarding
  if (!school?.domain) {
    redirect(`/${lang}/newcomers`)
  }

  // Forward to the school's own host. A relative redirect would stay on the
  // bare root (balqalam.com), where school routes 404. `next` carries the
  // tenant page the visitor was trying to open (e.g. a live-class link).
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host")
  const target = safeTenantNext(next) ?? `/${lang}/dashboard`
  redirect(`${tenantOriginForHost(host, school.domain)}${target}`)
}
