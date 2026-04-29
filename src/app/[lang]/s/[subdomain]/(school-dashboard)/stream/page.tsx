// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getPolicyContext } from "@/lib/rbac/context"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getContinueWatching } from "@/components/stream/data/catalog/get-continue-watching"
import { StreamHomeContent } from "@/components/stream/home/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.title || "Stream - Learning Management",
    description:
      dictionary.stream?.description ||
      "Elevate your learning experience with our LMS school-dashboard",
  }
}

export default async function StreamHomePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  // Students skip the marketing home and go straight to courses for their
  // grade. Falling back to the unfiltered list when their grade isn't synced
  // yet — they're a student, they want courses, not the prospect-facing page.
  if (session?.user?.role === "STUDENT") {
    const ctx = await getPolicyContext()
    const grade = ctx.academicGradeNumber
    redirect(
      grade != null
        ? `/${lang}/stream/courses?level=${grade}`
        : `/${lang}/stream/courses`
    )
  }

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "TEACHER" ||
    session?.user?.role === "DEVELOPER"

  const continueWatching = session?.user ? await getContinueWatching() : []

  return (
    <StreamHomeContent
      dictionary={dictionary.stream}
      lang={lang}
      schoolId={schoolId}
      isAuthenticated={!!session?.user}
      isAdmin={isAdmin}
      continueWatching={continueWatching}
    />
  )
}
