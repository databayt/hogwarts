// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

import { i18n } from "@/components/internationalization/config"

export default async function Root() {
  // Redirect to default locale
  redirect(`/${i18n.defaultLocale}`)
}
