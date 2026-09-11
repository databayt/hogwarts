// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAllCatalogCourses } from "@/components/lumos/data/catalog/get-all-courses"
import { getContinueWatching } from "@/components/lumos/data/catalog/get-continue-watching"
import { LumosHomeContent } from "@/components/lumos/home/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.lumos?.title || "Lumos - Learning Management",
    description:
      dictionary.lumos?.description ||
      "Elevate your learning experience with our LMS school-dashboard",
  }
}

export default async function LumosHomePage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const { schoolId } = await getTenantContext()
  const session = await auth()

  // Students skip the marketing home and go straight to the catalog. They land
  // on the browse view rather than a `?level=` grid: that page now opens with
  // what they were watching and a shelf for their own grade, and the grid is
  // one tap away on a grade badge. Pinning them to `?level=` would put them
  // straight into the drill-down and hide both shelves.
  if (session?.user?.role === "STUDENT") {
    redirect(`/${lang}/lumos/courses`)
  }

  const isAdmin =
    session?.user?.role === "ADMIN" ||
    session?.user?.role === "TEACHER" ||
    session?.user?.role === "DEVELOPER"

  // Real courses for the "new releases" strip — this school's own selected
  // catalog, not a hardcoded list. Empty when the school has no selections yet,
  // in which case the section hides itself rather than inventing content.
  const [continueWatching, { rows: featuredCourses }] = await Promise.all([
    session?.user ? getContinueWatching() : Promise.resolve([]),
    getAllCatalogCourses({ perPage: 4, lang }),
  ])

  return (
    <LumosHomeContent
      dictionary={dictionary.lumos}
      lang={lang}
      schoolId={schoolId}
      isAuthenticated={!!session?.user}
      isAdmin={isAdmin}
      continueWatching={continueWatching}
      featuredCourses={featuredCourses}
    />
  )
}
