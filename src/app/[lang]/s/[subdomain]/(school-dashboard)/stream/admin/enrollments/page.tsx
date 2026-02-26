// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getSchoolEnrollments } from "@/components/stream/admin/enrollments/actions"
import { EnrollmentsContent } from "@/components/stream/admin/enrollments/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function AdminEnrollmentsPage({ params }: Props) {
  const { lang, subdomain } = await params
  const session = await auth()
  const dictionary = await getDictionary(lang)

  if (
    !session?.user ||
    !["ADMIN", "DEVELOPER"].includes(session.user.role || "")
  ) {
    redirect(`/${lang}/s/${subdomain}/stream/courses`)
  }

  const enrollments = await getSchoolEnrollments()

  return (
    <EnrollmentsContent
      dictionary={dictionary.stream || {}}
      lang={lang}
      enrollments={enrollments}
    />
  )
}
