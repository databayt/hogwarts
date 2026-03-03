// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { notFound, redirect } from "next/navigation"

import { db } from "@/lib/db"
import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ParentDetailPage({ params }: Props) {
  const { lang, id } = await params

  const guardian = await db.guardian.findFirst({
    where: { id },
    select: { userId: true },
  })

  if (guardian?.userId) {
    redirect(`/${lang}/profile/${guardian.userId}`)
  }

  return notFound()
}

export const metadata = { title: "Parent Profile" }
