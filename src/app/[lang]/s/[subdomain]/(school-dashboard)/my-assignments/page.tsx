// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { permanentRedirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * `/my-assignments` is gone: `/assignments` is one page that shows each role
 * its own side of homework. The route stays only as a permanent redirect —
 * the Android app, notifications and bookmarks still point here.
 */
export default async function Page({ params }: Props) {
  const { lang } = await params
  permanentRedirect(`/${lang}/assignments`)
}
