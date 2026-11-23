// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function TeacherDetailPage({ params }: Props) {
  const { lang, id } = await params

  // Resolve userId from teacher record
  const teacher = await db.teacher.findFirst({
    where: { id },
    select: { userId: true },
  })

  if (!teacher) return notFound()

  // Redirect to unified profile if user account exists
  if (teacher.userId) {
    redirect(`/${lang}/profile/${teacher.userId}`)
  }

  return notFound()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.teachers, b?.profile].every(Boolean)
      ? [b?.teachers, b?.profile].join(" - ")
      : "Teacher Profile",
  }
}
