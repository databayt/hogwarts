// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound, redirect } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StudentDetail({ params }: Props) {
  const { lang, id } = await params

  // Resolve userId from student record
  const student = await db.student.findFirst({
    where: { id },
    select: { userId: true },
  })

  if (!student) return notFound()

  // Redirect to unified profile if user account exists
  if (student.userId) {
    redirect(`/${lang}/profile/${student.userId}`)
  }

  // Fallback: student without user account
  return notFound()
}

export const metadata = { title: "Student Profile" }
