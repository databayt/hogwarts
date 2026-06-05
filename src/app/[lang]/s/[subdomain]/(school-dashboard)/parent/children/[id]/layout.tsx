// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Locale } from "@/components/internationalization/config"
import { ChildTabs } from "@/components/school-dashboard/parent-portal/child/tabs"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export default async function ChildLayout({ children, params }: Props) {
  const { id, lang } = await params
  return (
    <div className="space-y-4">
      <ChildTabs childId={id} lang={lang} />
      <div>{children}</div>
    </div>
  )
}
