// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

/**
 * The old method chooser. The "Take attendance" section nav now lists every
 * method, so this address just opens the class list.
 */
export default async function Page({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/attendance/manual`)
}
