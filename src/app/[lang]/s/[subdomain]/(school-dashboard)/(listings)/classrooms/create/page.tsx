// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { type Locale } from "@/components/internationalization/config"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

// Rooms are added from the classrooms list. This route held a "Create New
// Class" placeholder; the links that point here (setup guide, command menu,
// attendance empty state) now land on the list.
export default async function Page({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/classrooms`)
}
