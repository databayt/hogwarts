// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"

interface Props {
  params: Promise<{ lang: string }>
}

export default async function ListRedirect({ params }: Props) {
  const { lang } = await params
  redirect(`/${lang}/finance/invoice`)
}
