// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { MockContent } from "@/components/school-dashboard/exams/mock/content"

interface MockPageProps {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function MockPage({ params }: MockPageProps) {
  await params

  return <MockContent />
}
