// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { ParentLandingContent } from "@/components/school-dashboard/parent-portal/landing/content"

export const metadata: Metadata = {
  title: "Parent Portal",
  description: "Follow up on your children's academic progress",
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ParentLandingPage({ params }: Props) {
  const { lang } = await params
  return <ParentLandingContent lang={lang} />
}
