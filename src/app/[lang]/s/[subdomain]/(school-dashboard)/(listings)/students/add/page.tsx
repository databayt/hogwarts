// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"
import { createDraftStudent } from "@/components/school-dashboard/listings/students/wizard/actions"

interface AddStudentProps {
  params: Promise<{ subdomain: string; lang: Locale }>
}

// The student add flow lives under `add/[id]/<step>` and is normally entered via
// the "+" button, which mints a draft first. Hitting the bare `/students/add`
// URL directly (bookmark, shared link, manual typing) has no `[id]`, so it would
// otherwise dead-end. Start a fresh draft and hand off to the wizard; fall back
// to the list if a draft can't be created (e.g. no permission).
export default async function AddStudent({ params }: AddStudentProps) {
  const { lang } = await params

  const result = await createDraftStudent()

  if (result.success && result.data) {
    redirect(`/${lang}/students/add/${result.data.id}/attachments`)
  }

  redirect(`/${lang}/students`)
}
