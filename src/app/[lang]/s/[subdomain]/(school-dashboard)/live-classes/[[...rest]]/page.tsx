// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Permanent redirect: the live-classes feature was renamed to `conference`.
// Preserves any sub-path (`/live-classes/{id}/room` → `/conference/{id}/room`)
// and query string so existing bookmarks keep working.

import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string; rest?: string[] }>
}

export default async function LiveClassesRedirect({ params }: Props) {
  const { lang, rest } = await params
  const sub = rest?.length ? `/${rest.join("/")}` : ""
  redirect(`/${lang}/conference${sub}`)
}
