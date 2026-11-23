// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { getTenantContext } from "@/lib/tenant-context"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { loadCover } from "@/components/school-dashboard/live/cover-core"
import { CoverContent } from "@/components/school-dashboard/live/cover-view"

// Auth-gated, per-viewer: render on demand.
export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

/**
 * «حصة بلا معلم» — where the no-teacher alert lands. Admin, or a supervisor of
 * the class's stage; anyone else is sent to the dashboard, the same refusal the
 * other live pages give a role that may not be here.
 */
export default async function Page({ params }: Props) {
  const [{ lang, id }, session] = await Promise.all([params, auth()])
  const userId = session?.user?.id
  const role = session?.user?.role as UserRole | undefined
  if (!userId || !role) redirect(`/${lang}/login`)
  const { schoolId } = await getTenantContext()
  if (!schoolId) redirect(`/${lang}/dashboard`)

  const loaded = await loadCover({ userId, role, schoolId }, id)
  if (!loaded.ok) redirect(`/${lang}/dashboard`)

  const dictionary = await getDictionary(lang)
  return <CoverContent view={loaded.view} lang={lang} dictionary={dictionary} />
}
