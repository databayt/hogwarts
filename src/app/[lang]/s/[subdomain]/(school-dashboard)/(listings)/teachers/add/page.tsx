// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import crypto from "crypto"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.teachers, b?.add].every(Boolean)
      ? [b?.teachers, b?.add].join(" - ")
      : "Dashboard: Add Teacher",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const { lang } = await params

  const session = await auth()
  if (!session?.user) redirect(`/${lang}/teachers`)

  const { schoolId } = await getTenantContext()
  if (!schoolId) redirect(`/${lang}/teachers`)

  const draftEmail = `draft-${crypto.randomUUID().slice(0, 8)}@draft.internal`

  const teacher = await db.teacher.create({
    data: {
      schoolId,
      firstName: "",
      lastName: "",
      emailAddress: draftEmail,
      wizardStep: "attachments",
    },
  })

  redirect(`/${lang}/teachers/add/${teacher.id}/attachments`)
}
