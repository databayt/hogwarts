// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StudentDetail({ params }: Props) {
  const { lang, id } = await params

  const session = await auth()
  const schoolId = session?.user?.schoolId
  if (!schoolId) return notFound()

  // Resolve userId from student record (scoped by schoolId)
  const student = await db.student.findFirst({
    where: { id, schoolId },
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.school.students.studentDetails || "Student Profile",
  }
}
