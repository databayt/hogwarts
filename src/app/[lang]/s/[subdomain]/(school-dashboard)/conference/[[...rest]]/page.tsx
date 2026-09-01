// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Permanent redirect: the block was renamed from `conference` to `live`.
// Preserves any sub-path (`/conference/{id}/room` → `/live/{id}/room`) and
// query string so existing bookmarks keep working.
//
// This stub is PERMANENT, not transitional. Every live-class notification
// dispatched before the rename stored `/conference/{id}` into
// `Notification.metadata.url` (see `actions/notifications.ts`), and those rows
// are kept as relative paths and absolutified only when rendered — so the bell
// and the emails already in people's inboxes will keep pointing here forever.
// Do not delete it in a future cleanup.

import { permanentRedirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string; rest?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConferenceRedirect({
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
