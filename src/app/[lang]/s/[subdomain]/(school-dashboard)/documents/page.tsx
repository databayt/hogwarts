// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Locale } from "@/components/internationalization/config"
import DocumentsContent from "@/components/school-dashboard/documents/content"

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ lang: Locale }>
}) {
  const { lang } = await params
  return <DocumentsContent lang={lang} />
}
