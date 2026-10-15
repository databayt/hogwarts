// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string }>
}

// The breadcrumb links "الإعدادات" to /school/configuration; land on the
// first section instead of a 404.
export default async function ConfigurationIndex({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/school/configuration/title`)
}
