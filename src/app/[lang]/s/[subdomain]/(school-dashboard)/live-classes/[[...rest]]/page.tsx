// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Permanent redirect: the live-classes feature is now `live`.
// Preserves any sub-path (`/live-classes/{id}/room` → `/live/{id}/room`)
// and query string so existing bookmarks keep working.

import { permanentRedirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string; rest?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LiveClassesRedirect({
  params,
  searchParams,
}: Props) {
  const [{ lang, rest }, sp] = await Promise.all([params, searchParams])
  const sub = rest?.length ? `/${rest.join("/")}` : ""
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) for (const v of value) qs.append(key, v)
    else if (value !== undefined) qs.append(key, value)
  }
  const query = qs.size > 0 ? `?${qs.toString()}` : ""
  permanentRedirect(`/${lang}/live${sub}${query}`)
}
