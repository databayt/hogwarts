import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"

interface MySchoolPageProps {
  params: Promise<{ lang: string }>
}

/**
 * My School Redirect Page
 *
 * Looks up the user's school from their session and redirects them
 * to their school's dashboard. If no school is found, redirects to onboarding.
 */
export default async function MySchoolPage({ params }: MySchoolPageProps) {
  const { lang } = await params
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

  // Redirect to school dashboard (domain is used as subdomain in routing)
  redirect(`/${lang}/s/${school.domain}/dashboard`)
}
