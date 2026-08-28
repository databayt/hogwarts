// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ReactNode } from "react"

import { LumosSectionNav } from "@/components/lumos/nav"

interface Props {
  children: ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

/**
 * Chrome for the managed lumos surfaces — dashboard, enrollments, instructors,
 * review, videos. A route group, so it adds the heading + tab strip without
 * adding a URL segment: these live at /lumos/<name>, not /lumos/settings/<name>.
 *
 * The landing page (/lumos) and the catalog (/lumos/courses) sit outside this
 * group on purpose — the landing page owns its own hero.
 */
export default async function LumosAppLayout({ children, params }: Props) {
  const { lang } = await params

  return (
    <div className="space-y-6">
      <LumosSectionNav lang={lang} />
      {children}
    </div>
  )
}
