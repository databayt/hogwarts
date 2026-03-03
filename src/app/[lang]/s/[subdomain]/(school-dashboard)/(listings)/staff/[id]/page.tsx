// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound, redirect } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function StaffDetailPage({ params }: Props) {
  const { lang, id } = await params

  // Try teacher first
  const teacher = await db.teacher.findFirst({
    where: { id },
    select: { userId: true },
  })

  if (teacher?.userId) {
    redirect(`/${lang}/profile/${teacher.userId}`)
  }

  // Try staff member
  const staff = await db.staffMember.findFirst({
    where: { id },
    select: { userId: true },
  })

  if (staff?.userId) {
    redirect(`/${lang}/profile/${staff.userId}`)
  }

  return notFound()
}

export const metadata = { title: "Staff Profile" }
