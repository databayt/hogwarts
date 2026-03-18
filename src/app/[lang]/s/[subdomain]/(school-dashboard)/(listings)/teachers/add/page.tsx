// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import crypto from "crypto"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"

export const metadata = { title: "Dashboard: Add Teacher" }

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
      givenName: "",
      surname: "",
      emailAddress: draftEmail,
      wizardStep: "attachments",
    },
  })

  redirect(`/${lang}/teachers/add/${teacher.id}/attachments`)
}
